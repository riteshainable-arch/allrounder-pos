import { IconButton, Paper, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import ShortcutBadge from "../../../components/Dashboard/ShortcutBadge";
import KitIcon from "../../../../../kit/components/KitIcon/KitIcon";
import KitDataGrid from "../../../../../kit/components/KitDataGrid/KitDataGrid";
import { priceFormat } from "../../../../../kit/utils/priceFormat";
import KitTextField from "../../../../../kit/components/KitTextField/KitTextField";
import { downloadXLSX } from "../../../../../kit/utils/downloadCSV";
import {
    useCreateBusyItemsImport,
    useCreateBusyItemsSync,
    useGetAllBusyItems,
    useGetAllBusyItemsExport,
} from "../../../../../kit/hooks/data/busy";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import { toast } from "react-toastify";

function exportBusyItemsToXlsx(rows) {
    const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    const exportRows = rows.map((row) =>
        Object.fromEntries(
            headers.map((header) => {
                const value = row[header];
                return [header, value !== null && typeof value === "object" ? JSON.stringify(value) : value ?? ""];
            })
        )
    );
    const date = new Date().toISOString().slice(0, 10);
    downloadXLSX(exportRows, headers, `busy-items-${date}.xlsx`);
}

function SyncAllResult({ result, onClose }) {
    const s = result.summary;

    const stats = [
        ["BUSY items", s.busyItems, "text-gray-900"],
        ["Already linked", s.alreadyLinked, "text-gray-700"],
        ["Linked now", s.linked, "text-green-700"],
        ["Created in CRM", s.created, "text-green-700"],
        ["Same name, many CRM items", s.ambiguous, "text-amber-700"],
        ["CRM item already linked", s.conflicts, "text-amber-700"],
        ["Not found in CRM", s.unmatched, "text-gray-500"],
    ];

    return (
        <div className="rounded-xl bg-white border border-gray-200 p-4 text-sm">
            <div className="mb-3 flex justify-between items-center">
                <p className="font-semibold">{result.mode === "import" ? "Import all" : "Link all"} finished</p>

                <IconButton size="small" onClick={onClose} title="Dismiss">
                    <KitIcon icon="tabler:x" className="text-lg!" />
                </IconButton>
            </div>

            <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {stats.map(([label, value, cls]) => (
                    <div key={label} className="rounded-lg bg-gray-50 p-2">
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className={`text-lg font-bold ${cls}`}>{value}</p>
                    </div>
                ))}
            </div>

            {s.linked ? (
                <p className="mt-2 text-xs text-gray-600">
                    Matched by item code {s.linkedByCode}, barcode {s.linkedByBarcode}, name {s.linkedByName}.
                </p>
            ) : null}

            {result.ambiguous.length ? (
                <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-medium text-amber-700">
                        Same name in many CRM items (link these by hand)
                    </summary>

                    <ul className="mt-1 max-h-40 overflow-auto text-xs">
                        {result.ambiguous.map((a) => (
                            <li key={a.productId}>
                                #{a.productId} {a.name} → {a.crmItems.join(", ")}
                            </li>
                        ))}
                    </ul>
                </details>
            ) : null}

            {result.unmatched.length ? (
                <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-medium text-gray-600">
                        Not found in CRM (use Import all to create them)
                    </summary>

                    <ul className="mt-1 max-h-40 overflow-auto text-xs">
                        {result.unmatched.map((u) => (
                            <li key={u.productId}>
                                #{u.productId} {u.name}
                            </li>
                        ))}
                    </ul>
                </details>
            ) : null}
        </div>
    );
}

export default function BusyItemsTab() {
    const nameRef = useRef(null);
    const refreshRef = useRef(null);
    const exportRef = useRef(null);
    const linkRef = useRef(null);
    const importAllRef = useRef(null);
    const importRef = useRef(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [rowSelectionModel, setRowSelectionModel] = useState({
        type: "include",
        ids: new Set(),
    });
    const [selectedItems, setSelectedItems] = useState([]);
    const [activeRowIndex, setActiveRowIndex] = useState(0);
    const [shouldExport, setShouldExport] = useState(false);
    const [results, setResults] = useState([]);
    const [syncResult, setSyncResult] = useState(null);

    const query = {
        page,
        pageSize: pageSize,
        ...(search && { search: search }),
    };
    const { BusyItemsList, isBusyItemsListLoading, BusyItemsListError, refreshBusyItemsList } =
        useGetAllBusyItems(query);
    const {
        BusyItemsExportList,
        BusyItemsExportListError,
        isBusyItemsExportListLoading,
        isValidatingBusyItemsExportList,
    } = useGetAllBusyItemsExport(shouldExport);
    const { createBusyItemsImport: onCreateBusyItemsImport, isCreatingBusyItemsImport } = useCreateBusyItemsImport();
    const { createBusyItemsSync: onCreateBusyItemsSync, isCreatingBusyItemsSync } = useCreateBusyItemsSync();

    const dataRows = BusyItemsList?.data?.items ?? [];

    const handleSelectionChange = (selection) => {
        const currentRows = BusyItemsList?.data?.items ?? [];
        const currentPageIds = new Set(currentRows.map((row) => row.productId));

        setRowSelectionModel(selection);
        setSelectedItems((previousItems) => [
            ...previousItems.filter((item) => !currentPageIds.has(item.productId)),
            ...currentRows.filter((row) => selection.ids.has(row.productId)),
        ]);
    };

    const runExport = () => {
        setShouldExport(true);
    };

    useEffect(() => {
        if (!shouldExport || isBusyItemsExportListLoading || isValidatingBusyItemsExportList) return;

        if (BusyItemsExportListError) {
            const errorMessage =
                BusyItemsExportListError?.message ||
                BusyItemsExportListError?.detail ||
                BusyItemsExportListError?.[0]?.detail ||
                "Export failed";
            toast.error(errorMessage);
            // Disable the SWR key after the request settles, including empty-body errors.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShouldExport(false);
            return;
        }

        if (!BusyItemsExportList) {
            toast.error("Export failed");
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShouldExport(false);
            return;
        }

        const rows = BusyItemsExportList?.data?.items ?? [];

        if (!rows.length) {
            toast.error("BUSY returned no items");
        } else {
            try {
                exportBusyItemsToXlsx(rows);
                toast.success(`Exported ${rows.length} BUSY items`);
            } catch (error) {
                toast.error(error?.message || "Failed to create Excel file");
            }
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShouldExport(false);
    }, [
        shouldExport,
        isBusyItemsExportListLoading,
        isValidatingBusyItemsExportList,
        BusyItemsExportList,
        BusyItemsExportListError,
    ]);

    const runSyncAll = async (mode) => {
        const text =
            mode === "link"
                ? "Link ALL BUSY items to CRM items?\nMatch order: BUSY alias = CRM item code, then barcode, then exact unique name. Nothing is created."
                : "Import ALL BUSY items?\nMatched items are linked; items not in the CRM are created as draft products.";
        if (!window.confirm(`${text}\nAlready linked items are skipped, so this is safe to run again.`)) return;
        setSyncResult(null);
        try {
            const res = await onCreateBusyItemsSync({ mode: mode });
            setSyncResult(res.data);
            toast.success(`Linked ${res.data.summary.linked}, created ${res.data.summary.created}`);
            refreshBusyItemsList();
        } catch (e) {
            toast.error(e.message || "Sync failed");
        }
    };

    const runImport = async () => {
        if (!selectedItems.length) return;
        if (
            !window.confirm(
                `Import ${selectedItems.length} BUSY item(s) into the CRM?\nNew items are created as drafts; existing items with the same code or name are only linked.`
            )
        )
            return;
        try {
            const products = selectedItems.map(({ raw, ...p }) => p);
            const res = await onCreateBusyItemsImport(products);
            setResults(res?.data?.results || []);
            toast.success(`Created ${res?.data?.summary?.created ?? 0}, linked ${res?.data?.summary?.linked ?? 0}`);
            setSelectedItems([]);
            refreshBusyItemsList();
        } catch (e) {
            toast.error(e.message || "Import failed");
        }
    };

    const columns = [
        {
            field: "name",
            headerName: "BUSY Item",
            minWidth: 220,
            flex: 1.2,
            renderCell: (params) => {
                const p = params.row;

                return (
                    <div className="flex flex-col justify-center items-start leading-tight">
                        <Typography variant="body2" className="truncate" fontWeight={600}>
                            {p.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            #{p.productId}
                            {p.alias ? ` · ${p.alias}` : ""}
                        </Typography>
                    </div>
                );
            },
        },
        {
            field: "group",
            headerName: "Group / Unit",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <div className="flex flex-col justify-center items-start leading-tight">
                    <Typography variant="body2">{params.row.group || "—"}</Typography>

                    <Typography variant="caption" color="text.secondary">
                        {params.row.unit || ""}
                    </Typography>
                </div>
            ),
        },
        {
            field: "hsnCode",
            headerName: "HSN / Tax",
            minWidth: 140,
            flex: 0.8,
            renderCell: (params) => (
                <div className="flex flex-col justify-center items-start leading-tight">
                    <Typography variant="body2">{params.row.hsnCode || "—"}</Typography>

                    <Typography variant="caption" color="text.secondary">
                        {params.row.taxCategory || ""}
                    </Typography>
                </div>
            ),
        },
        {
            field: "salePrice",
            headerName: "Sale Price",
            minWidth: 120,
            flex: 0.7,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => <Typography variant="body2">{priceFormat(params.row.salePrice)}</Typography>,
        },
        {
            field: "mrp",
            headerName: "MRP",
            minWidth: 110,
            flex: 0.7,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => <Typography variant="body2">{priceFormat(params.row.mrp)}</Typography>,
        },
        {
            field: "stock",
            headerName: "Stock",
            minWidth: 100,
            flex: 0.6,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => <Typography variant="body2">{params.row.stock ?? "—"}</Typography>,
        },
        {
            field: "crmStatus",
            headerName: "CRM",
            minWidth: 200,
            flex: 1,
            sortable: false,
            renderCell: (params) => {
                const p = params.row;

                if (p.mapped) {
                    return (
                        <Typography variant="caption" fontWeight={600} className="text-green-700!">
                            Linked · {p.crmItemCode}
                        </Typography>
                    );
                }

                if (p.crmItemCode) {
                    return (
                        <Typography variant="caption" fontWeight={600} className="text-amber-700!">
                            Same as {p.crmItemCode} (import to link)
                        </Typography>
                    );
                }

                return (
                    <Typography variant="caption" color="text.secondary">
                        Not in CRM
                    </Typography>
                );
            },
        },
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey) {
                switch (e.key.toLowerCase()) {
                    case "n":
                        e.preventDefault();
                        nameRef.current?.focus();
                        return;

                    case "r":
                        e.preventDefault();
                        refreshRef.current?.click();
                        return;
                }
            }

            if (e.shiftKey && !e.ctrlKey && !e.altKey) {
                switch (e.key.toLowerCase()) {
                    case "e":
                        e.preventDefault();
                        exportRef.current?.click();
                        return;

                    case "l":
                        e.preventDefault();
                        linkRef.current?.click();
                        return;

                    case "a":
                        e.preventDefault();
                        importAllRef.current?.click();
                        return;

                    case "i":
                        e.preventDefault();
                        importRef.current?.click();
                        return;

                    default:
                        return;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        setActiveRowIndex(0);
    }, [page, pageSize, search]);

    useEffect(() => {
        setActiveRowIndex((prev) => (dataRows.length === 0 ? 0 : Math.min(prev, dataRows.length - 1)));
    }, [dataRows.length]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!dataRows.length) return;

            const target = e.target;

            if (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
                return;
            }

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setActiveRowIndex((prev) => Math.min(prev + 1, dataRows.length - 1));
                    break;

                case "ArrowUp":
                    e.preventDefault();
                    setActiveRowIndex((prev) => Math.max(prev - 1, 0));
                    break;

                case "Enter": {
                    e.preventDefault();

                    const row = dataRows[activeRowIndex];
                    if (!row) return;

                    const ids = new Set(rowSelectionModel.ids);

                    if (ids.has(row.productId)) {
                        ids.delete(row.productId);
                    } else {
                        ids.add(row.productId);
                    }

                    handleSelectionChange({
                        type: "include",
                        ids,
                    });

                    break;
                }

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [dataRows, activeRowIndex, rowSelectionModel]);

    return (
        <div>
            <div className="flex flex-col gap-3 w-full min-w-0">
                <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl">
                    <div className="flex flex-wrap items-end gap-x-3 gap-y-7">
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + N" className="top-0" />
                            <KitTextField
                                inputRef={nameRef}
                                size="small"
                                height="32px"
                                label="Search"
                                placeholderFontSize={14}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search BUSY item name"
                                className="w-56"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Shift + E" className="-top-5" />
                            <KitButton
                                ref={exportRef}
                                size="small"
                                variant="contained"
                                className="w-auto"
                                disabled={isBusyItemsExportListLoading}
                                loading={isBusyItemsExportListLoading}
                                onClick={() => runExport()}
                            >
                                Export all (Excel)
                            </KitButton>
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Shift + L" className="-top-5" />
                            <KitButton
                                ref={linkRef}
                                size="small"
                                variant="contained"
                                className="w-auto"
                                disabled={isCreatingBusyItemsSync}
                                loading={isCreatingBusyItemsSync}
                                onClick={() => runSyncAll("link")}
                            >
                                Link all
                            </KitButton>
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Shift + A" className="-top-5" />
                            <KitButton
                                ref={importAllRef}
                                size="small"
                                variant="contained"
                                className="w-auto"
                                disabled={isCreatingBusyItemsSync}
                                loading={isCreatingBusyItemsSync}
                                onClick={() => runSyncAll("import")}
                            >
                                Import all
                            </KitButton>
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Shift + I" className="-top-5" />
                            <KitButton
                                ref={importRef}
                                size="small"
                                variant="contained"
                                className="w-auto"
                                disabled={!selectedItems.length}
                                loading={isCreatingBusyItemsImport}
                                onClick={() => runImport()}
                            >
                                Import selected ({selectedItems.length})
                            </KitButton>
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + R" className="-top-5" />
                            <IconButton
                                ref={refreshRef}
                                onClick={() => refreshBusyItemsList()}
                                className="w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                            >
                                <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                            </IconButton>
                        </div>
                    </div>
                </Paper>

                {isCreatingBusyItemsSync && (
                    <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                        Reading every item from BUSY (500 per call) and matching with CRM… this can take a minute.
                    </p>
                )}

                {syncResult && <SyncAllResult result={syncResult} onClose={() => setSyncResult(null)} />}

                {results?.length > 0 && (
                    <Paper elevation={0} className="overflow-hidden rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between p-3">
                            <div>
                                <Typography variant="subtitle2" fontWeight={700}>
                                    Last Import Results
                                </Typography>

                                <Typography variant="caption" color="text.secondary">
                                    Total: {results.length} · Success:{" "}
                                    {results.filter((r) => ["success", "verified", "linked"].includes(r.status)).length}{" "}
                                    · Failed: {results.filter((r) => r.status === "failed").length}
                                </Typography>
                            </div>

                            <IconButton size="small" onClick={() => setResults([])} title="Dismiss">
                                <KitIcon icon="tabler:x" />
                            </IconButton>
                        </div>

                        <Divider />

                        <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
                            {results.map((r, index) => (
                                <div
                                    key={`${r.itemCode || r.name || "item"}-${index}`}
                                    className="flex flex-wrap items-center gap-2 px-3 py-2.5"
                                >
                                    <SyncBadge status={r.status} />

                                    <Typography variant="body2" fontWeight={600}>
                                        {r.itemCode || r.name || "Unknown item"}
                                    </Typography>

                                    {r.name && r.itemCode && (
                                        <Typography variant="body2" color="text.secondary">
                                            {r.name}
                                        </Typography>
                                    )}

                                    {r.error && (
                                        <Typography variant="caption" color="error">
                                            {r.error}
                                        </Typography>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Paper>
                )}

                <KitDataGrid
                    columns={columns}
                    rows={dataRows ?? []}
                    getRowId={(row) => row.productId}
                    rowCount={BusyItemsList?.data?.metadata?.totalCount ?? 0}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    loading={isBusyItemsListLoading}
                    error={!!BusyItemsListError}
                    getRowClassName={(params) =>
                        dataRows[activeRowIndex]?.productId === params.id ? "keyboard-active-row" : ""
                    }
                    checkboxSelection
                    rowSelection
                    isRowSelectable={(params) => !!params.row.productId && !params.row.mapped}
                    disableRowSelectionOnClick
                    disableRowSelectionExcludeModel
                    keepNonExistentRowsSelected
                    onRowSelectionModelChange={handleSelectionChange}
                    rowSelectionModel={rowSelectionModel}
                />
            </div>
        </div>
    );
}
