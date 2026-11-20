import { Divider, IconButton, Paper, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import ShortcutBadge from "../../../components/Dashboard/ShortcutBadge";
import KitIcon from "../../../../../kit/components/KitIcon/KitIcon";
import KitDataGrid from "../../../../../kit/components/KitDataGrid/KitDataGrid";
import { priceFormat } from "../../../../../kit/utils/priceFormat";
import KitTextField from "../../../../../kit/components/KitTextField/KitTextField";
import {
    useCreateBusyCrmItemslink,
    useCreateBusyCrmItemsPush,
    useCreateBusyCrmItemsUnlink,
    useGetAllBusyCrmItems,
} from "../../../../../kit/hooks/data/busy";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import { toast } from "react-toastify";
import { SyncBadge } from "../../../../../kit/utils/syncBadge";
import { linkOptions } from "../../../../../kit/configs/general";
import KitSelect from "../../../../../kit/components/KitSelect";
import ManualLinkModal from "./ManualLinkModal";

export default function CrmItemsTab() {
    const nameRef = useRef(null);
    const linkRef = useRef(null);
    const refreshRef = useRef(null);
    const importRef = useRef(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [linked, setLinked] = useState("");
    const [selectedItem, setSelectedItem] = useState();
    const [showManualLinkDialog, setShowManualLinkDialog] = useState(false);
    const [rowSelectionModel, setRowSelectionModel] = useState({
        type: "include",
        ids: new Set(),
    });
    const [selectedItems, setSelectedItems] = useState([]);
    const [results, setResults] = useState([]);
    const [activeRowIndex, setActiveRowIndex] = useState(0);
    const [activeColumn, setActiveColumn] = useState("checkbox");

    const query = {
        page,
        size: pageSize,
        ...(search && { search: search }),
        ...(linked && { linked: linked }),
    };

    const { BusyCrmItemsList, isBusyCrmItemsListLoading, BusyCrmItemsListError, refreshBusyCrmItemsList } =
        useGetAllBusyCrmItems(query);
    const { createBusyCrmItemsPush: onCreateBusyCrmItemsPush, isCreatingBusyCrmItemsPush } =
        useCreateBusyCrmItemsPush();
    const { createBusyCrmItemslink: onCreateBusyCrmItemslink, isCreatingBusyCrmItemslink } =
        useCreateBusyCrmItemslink();
    const { createBusyCrmItemsUnlink: onCreateBusyCrmItemsUnlink, isCreatingBusyCrmItemsUnlink } =
        useCreateBusyCrmItemsUnlink();

    const openManualLinkModal = (item) => {
        setSelectedItem(item);
        setShowManualLinkDialog(true);
    };

    const closeManualLinkModal = () => {
        setShowManualLinkDialog(false);
        setSelectedItem(null);
    };

    const dataRows = BusyCrmItemsList?.data?.items ?? [];

    const handleSelectionChange = (selection) => {
        const currentRows = BusyCrmItemsList?.data?.items ?? [];
        const currentPageIds = new Set(currentRows.map((row) => row.id));

        setRowSelectionModel(selection);
        setSelectedItems((previousItems) => [
            ...previousItems.filter((item) => !currentPageIds.has(item.id)),
            ...currentRows.filter((row) => selection.ids.has(row.id)),
        ]);
    };

    const columns = [
        {
            field: "itemName",
            headerName: "Item",
            minWidth: 200,
            flex: 1.2,
            renderCell: (params) => (
                <div className="flex flex-col justify-center items-start leading-tight">
                    <Typography variant="body2" fontWeight={600}>
                        {params.row.itemName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {params.row.itemCode}
                    </Typography>
                </div>
            ),
        },
        {
            field: "groupName",
            headerName: "Group / Unit",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <div className="flex flex-col justify-center items-start leading-tight">
                    <Typography variant="body2">{params.row.groupName || "—"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {params.row.unitOfMeasure || ""}
                    </Typography>
                </div>
            ),
        },
        {
            field: "hsnCode",
            headerName: "HSN / GST",
            minWidth: 130,
            flex: 0.8,
            renderCell: (params) => (
                <div className="flex flex-col justify-center items-start leading-tight">
                    <Typography variant="body2">{params.row.hsnCode || "—"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {params.row.gst != null && params.row.gst !== "" ? `${params.row.gst}%` : ""}
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
            field: "busy",
            headerName: "BUSY",
            minWidth: 180,
            flex: 1,
            sortable: false,
            renderCell: (params) => {
                const busy = params.row.busy;

                return busy ? (
                    <div className="flex flex-col justify-center items-start leading-tight">
                        <Typography variant="caption" fontWeight={600} className="text-green-700!">
                            {busy.busyName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            #{busy.busyCode} · {busy.source}
                        </Typography>
                    </div>
                ) : (
                    <Typography variant="caption" color="text.secondary">
                        Not linked
                    </Typography>
                );
            },
        },
        {
            field: "actions",
            headerName: "Actions",
            minWidth: 130,
            sortable: false,
            filterable: false,
            align: "right",
            headerAlign: "right",
            renderCell: (params) =>
                params.row.busy ? (
                    <KitButton
                        size="small"
                        variant="outlined"
                        className="w-auto!"
                        loading={isCreatingBusyCrmItemsUnlink}
                        onClick={() => unlink(params.row)}
                    >
                        Unlink
                    </KitButton>
                ) : (
                    <KitButton
                        size="small"
                        variant="outlined"
                        className="w-auto!"
                        loading={isCreatingBusyCrmItemslink}
                        onClick={() => openManualLinkModal(params.row)}
                    >
                        Link existing
                    </KitButton>
                ),
        },
    ];

    const runPush = async () => {
        if (!selectedItems.length) return;
        if (
            !window.confirm(
                `Create ${selectedItems.length} item(s) in BUSY?\nItems whose name already exists in BUSY are linked instead.`
            )
        )
            return;
        try {
            const res = await onCreateBusyCrmItemsPush({ itemCodes: selectedItems.map((i) => i.itemCode) });
            const list = res?.data?.results || [];
            setResults(list);
            const ok = list.filter((r) => ["success", "verified", "linked"].includes(r.status)).length;
            toast.success(`${ok} of ${list.length} item(s) are now in BUSY`);
            setSelectedItems([]);
            refreshBusyCrmItemsList();
        } catch (e) {
            toast.error(e.message || "Push failed");
        }
    };

    const manualLink = async (it, busyCode) => {
        const code = Number(busyCode);

        if (!Number.isInteger(code) || code <= 0) {
            toast.error("Enter a valid BUSY product ID");
            return;
        }

        try {
            await onCreateBusyCrmItemslink({
                masterType: "product",
                localKey: it.itemCode,
                busyCode: code,
                busyName: it.itemName,
            });
            toast.success("Linked successfully");
            closeManualLinkModal();
            refreshBusyCrmItemsList();
        } catch (e) {
            toast.error(e.message || "Link failed");
        }
    };

    const unlink = async (it) => {
        if (!window.confirm(`Remove the BUSY link of ${it.itemName}? Nothing is deleted in BUSY.`)) return;
        try {
            await onCreateBusyCrmItemsUnlink({ masterType: "product", localKey: it.itemCode });
            toast.success("Link removed");
            refreshBusyCrmItemsList();
        } catch (e) {
            toast.error(e.message || "Unlink failed");
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;

            switch (e.key.toLowerCase()) {
                case "n":
                    nameRef.current?.focus();
                    break;
                case "l":
                    linkRef.current?.focus();
                    break;
                case "p":
                    importRef.current?.click();
                    break;
                case "r":
                    refreshRef.current?.click();
                    break;
                default:
                    return;
            }

            e.preventDefault();
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        if (isBusyCrmItemsListLoading || !dataRows.length) return;

        const row = dataRows[activeRowIndex];
        if (!row) return;

        const frameId = requestAnimationFrame(() => {
            const activeGridRow = Array.from(document.querySelectorAll(".MuiDataGrid-row")).find(
                (element) => element.getAttribute("data-id") === String(row.id)
            );
            if (!activeGridRow) return;
            let element = null;
            if (activeColumn === "checkbox") {
                element = activeGridRow.querySelector(".MuiDataGrid-cellCheckbox input[type='checkbox']");
            } else {
                element = activeGridRow.querySelector(".MuiDataGrid-cell[data-field='actions'] button");
            }
            element?.focus({ preventScroll: true });
        });

        return () => cancelAnimationFrame(frameId);
    }, [isBusyCrmItemsListLoading, dataRows, activeRowIndex, activeColumn]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const target = e.target;

            const isCheckbox = target instanceof HTMLInputElement && target.type === "checkbox";

            if (
                target instanceof HTMLElement &&
                !isCheckbox &&
                (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
            ) {
                return;
            }

            if (!dataRows.length) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                e.stopPropagation();
                setActiveRowIndex((prev) => Math.min(prev + 1, dataRows.length - 1));
                return;
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                e.stopPropagation();
                setActiveRowIndex((prev) => Math.max(prev - 1, 0));
                return;
            }

            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                e.stopPropagation();
                setActiveColumn(e.key === "ArrowLeft" ? "checkbox" : "linkButton");
                return;
            }

            if (e.key === "Enter" && isCheckbox) {
                const row = dataRows[activeRowIndex];
                if (!row) return;

                e.preventDefault();
                e.stopPropagation();

                const ids = new Set(rowSelectionModel.ids);
                if (ids.has(row.id)) {
                    ids.delete(row.id);
                } else {
                    ids.add(row.id);
                }

                handleSelectionChange({ type: "include", ids });
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [dataRows, activeRowIndex, rowSelectionModel, handleSelectionChange]);

    useEffect(() => {
        setActiveRowIndex(0);
        setActiveColumn("checkbox");
    }, [page, pageSize, search, linked]);

    useEffect(() => {
        setActiveRowIndex((prev) => (dataRows.length === 0 ? 0 : Math.min(prev, dataRows.length - 1)));
    }, [dataRows.length]);

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
                                placeholder="Item code / name / EAN"
                                className="w-56"
                            />
                        </div>
                        <div className="relative w-60">
                            <ShortcutBadge shortcut="Alt + S" className="top-0" />
                            <KitSelect
                                ref={linkRef}
                                label="Link"
                                placeholder="Select Link"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={linkOptions}
                                value={linkOptions.find((option) => String(option.value) === String(linked)) ?? ""}
                                onChange={(option) => setLinked(option?.value ?? "")}
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + P" className="-top-5" />
                            <KitButton
                                ref={importRef}
                                size="small"
                                variant="contained"
                                className="w-auto"
                                disabled={!selectedItems.length}
                                loading={isCreatingBusyCrmItemsPush}
                                onClick={() => runPush()}
                            >
                                Push to BUSY ({selectedItems.length})
                            </KitButton>
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + R" className="-top-5" />
                            <IconButton
                                ref={refreshRef}
                                onClick={() => refreshBusyCrmItemsList()}
                                className="w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                            >
                                <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                            </IconButton>
                        </div>
                    </div>
                </Paper>

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
                    rows={BusyCrmItemsList?.data?.items ?? []}
                    getRowId={(row) => row.id}
                    rowCount={BusyCrmItemsList?.data?.totalItems ?? 0}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    loading={isBusyCrmItemsListLoading}
                    error={!!BusyCrmItemsListError}
                    checkboxSelection
                    rowSelection
                    isRowSelectable={(params) => !params.row.busy}
                    disableRowSelectionOnClick
                    disableRowSelectionExcludeModel
                    keepNonExistentRowsSelected
                    sx={{
                        "& .MuiDataGrid-cellCheckbox .MuiCheckbox-root:focus-within": {
                            outline: "2px solid #cda500",
                            outlineOffset: 0,
                            borderRadius: "4px",
                        },
                    }}
                    onRowSelectionModelChange={handleSelectionChange}
                    rowSelectionModel={rowSelectionModel}
                    getRowClassName={(params) =>
                        dataRows[activeRowIndex]?.id === params.id ? "keyboard-active-row" : ""
                    }
                />
            </div>

            <ManualLinkModal
                isOpen={showManualLinkDialog}
                onClose={closeManualLinkModal}
                selectedItem={selectedItem}
                onSave={manualLink}
                loading={isCreatingBusyCrmItemslink}
            />
        </div>
    );
}
