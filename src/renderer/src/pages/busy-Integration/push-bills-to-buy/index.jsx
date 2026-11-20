import { Divider, IconButton, Paper, Typography } from "@mui/material";
import KitHeader from "../../../../../kit/components/KitHeader/KitHeader";
import { useEffect, useMemo, useRef, useState } from "react";
import ShortcutBadge from "../../../components/Dashboard/ShortcutBadge";
import KitIcon from "../../../../../kit/components/KitIcon/KitIcon";
import KitDataGrid from "../../../../../kit/components/KitDataGrid/KitDataGrid";
import { priceFormat } from "../../../../../kit/utils/priceFormat";
import KitTextField from "../../../../../kit/components/KitTextField/KitTextField";
import KitSelect from "../../../../../kit/components/KitSelect";
import { format, subDays } from "date-fns";
import { useGetAllStoreList } from "../../../../../kit/hooks/data/store";
import { useCreateBusyInvoicesBulk, useGetAllBusyCrmBills } from "../../../../../kit/hooks/data/busy";
import { SyncBadge } from "../../../../../kit/utils/syncBadge";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import { toast } from "react-toastify";
import { statusOptions } from "../../../../../kit/configs/general";

export default function PushBillsToBuy() {
    const nameRef = useRef(null);
    const storeRef = useRef(null);
    const exportRef = useRef(null);
    const refreshRef = useRef(null);
    const statusRef = useRef(null);
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const pushPendingRef = useRef(null);
    const pushSelectedRef = useRef(null);

    const lastWeek = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const today = format(new Date(), "yyyy-MM-dd");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [storeId, setStoreId] = useState("");
    const [startDate, setStartDate] = useState(lastWeek);
    const [endDate, setEndDate] = useState(today);
    const [rowSelectionModel, setRowSelectionModel] = useState({
        type: "include",
        ids: new Set(),
    });
    const [selectedItems, setSelectedItems] = useState([]);
    const [activeRowIndex, setActiveRowIndex] = useState(0);
    const [bulkResult, setBulkResult] = useState(null);

    const query = {
        page,
        limit: pageSize,
        startDate: startDate,
        endDate: endDate,
        ...(search && { search: search }),
        ...(storeId && { storeId: storeId }),
        ...(status && { status: status }),
    };
    const { storeList, isStoreListLoading } = useGetAllStoreList();
    const { BusyCrmBillsList, isBusyCrmBillsListLoading, BusyCrmBillsListError, refreshBusyCrmBillsList } =
        useGetAllBusyCrmBills(query);
    const { createBusyInvoiceBulk: onCreateBusyInvoiceBulk, isCreatingBusyInvoiceBulk } = useCreateBusyInvoicesBulk();
    const storeName = useMemo(() => new Map(storeList?.data?.stores.map((s) => [s.id, s.storeName])), [storeList]);

    const storeOptions = useMemo(
        () =>
            storeList?.data?.stores?.map((store) => ({
                label: store.storeName || "",
                value: String(store.id),
            })) || [],
        [storeList]
    );

    const handleSelectionChange = (selection) => {
        const currentRows = BusyCrmBillsList?.data?.items ?? [];
        const currentPageIds = new Set(currentRows.map((row) => row.invoiceNo));

        setRowSelectionModel(selection);
        setSelectedItems((previousItems) => [
            ...previousItems.filter((item) => !currentPageIds.has(item.invoiceNo)),
            ...currentRows.filter((row) => selection.ids.has(row.invoiceNo)),
        ]);
    };

    const runBulk = async (mode) => {
        if (mode === "selected" && !selectedItems.length) {
            toast.error("Please select at least one bill.");
            return;
        }

        const confirmText =
            mode === "selected"
                ? `Push ${selectedItems.length} bill(s) to BUSY?`
                : `Push pending bills between ${startDate} and ${endDate} to BUSY?`;

        if (!window.confirm(`${confirmText}\nThis writes sales invoices into the real BUSY books.`)) {
            return;
        }

        setBulkResult(null);

        try {
            const payload =
                mode === "selected"
                    ? {
                          bills: selectedItems.map((bill) => ({
                              invoiceNo: bill.invoiceNo,
                              date: bill.date,
                              storeId: bill.storeId,
                          })),
                      }
                    : {
                          startDate,
                          endDate,
                          storeId: storeId || undefined,
                      };

            const res = await onCreateBusyInvoiceBulk(payload);
            const result = res?.data;
            setBulkResult(result);
            const summary = result?.summary;

            if (summary) {
                toast.success(
                    `Pushed ${summary.pushed}, failed ${summary.failed}, unconfirmed ${summary.uncertain}, skipped ${summary.skipped}`
                );
            } else {
                toast.success("Bulk push completed.");
            }

            setSelectedItems([]);
            setRowSelectionModel({
                type: "include",
                ids: new Set(),
            });
            refreshBusyCrmBillsList();
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message || "Bulk push failed.");
        }
    };

    const columns = [
        {
            field: "invoiceNo",
            headerName: "Bill",
            minWidth: 160,
            flex: 1,
            renderCell: (params) => {
                const bill = params.row;

                return (
                    <div className="flex flex-col justify-center leading-tight">
                        <Typography variant="body2" fontWeight={500}>
                            {bill.invoiceNo || "-"}
                        </Typography>
                        <div className="flex items-center gap-2">
                            <Typography variant="caption" color="text.secondary">
                                {bill.date || "-"}
                            </Typography>
                            {bill.isReturnBill && (
                                <Typography variant="caption" fontWeight={600} className="text-red-600!">
                                    RETURN
                                </Typography>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            field: "itemName",
            headerName: "Store",
            minWidth: 200,
            flex: 1.2,
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    className="truncate"
                    title={storeName.get(params.row.storeId) || params.row.storeId || "—"}
                >
                    {storeName.get(params.row.storeId) || params.row.storeId || "—"}
                </Typography>
            ),
        },

        {
            field: "customerId",
            headerName: "Customer",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2" className="truncate" title={params.row.customerId ?? "Walk-in"}>
                    {params.row.customerId ?? "Walk-in"}
                </Typography>
            ),
        },
        {
            field: "lineCount",
            headerName: "Lines",
            minWidth: 130,
            flex: 0.8,
            renderCell: (params) => <Typography variant="body2">{params.row.lineCount ?? 0}</Typography>,
        },
        {
            field: "totalAmount",
            headerName: "Amount",
            minWidth: 130,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" className="text-sm!">
                    {priceFormat(params.row.totalAmount)}
                </Typography>
            ),
        },
        {
            field: "busyStatus",
            headerName: "BUSY status",
            minWidth: 400,
            flex: 1.2,
            renderCell: (params) => {
                const sync = params.row.sync;

                return (
                    <div className="flex flex-col justify-center items-start! gap-0.5 py-1">
                        <SyncBadge status={sync?.status} />
                        {sync?.busyNumber && (
                            <Typography variant="caption" color="text.secondary">
                                BUSY no. {sync.busyNumber}
                            </Typography>
                        )}
                        {sync?.busyAmount != null && (
                            <Typography variant="caption" color="text.secondary">
                                BUSY total {priceFormat(sync.busyAmount)}
                            </Typography>
                        )}
                        {sync?.error && (
                            <Typography variant="caption" className="text-red-600! max-w-65 whitespace-normal!">
                                {sync.error}
                            </Typography>
                        )}
                    </div>
                );
            },
        },
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.shiftKey && e.key.toLowerCase() === "e") {
                e.preventDefault();
                exportRef.current?.click();
                return;
            }

            if (!e.altKey) return;

            switch (e.key.toLowerCase()) {
                case "n":
                    nameRef.current?.focus();
                    break;
                case "s":
                    storeRef.current?.focus();
                    break;
                case "a":
                    e.preventDefault();
                    statusRef.current?.focus();
                    break;
                case "f":
                    startDateRef.current?.focus();
                    return;
                case "e":
                    endDateRef.current?.focus();
                    return;
                case "p":
                    pushPendingRef.current?.click();
                    break;
                case "d":
                    pushSelectedRef.current?.click();
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

    const dataRows = BusyCrmBillsList?.data?.items ?? [];

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

                    if (ids.has(row.invoiceNo)) {
                        ids.delete(row.invoiceNo);
                    } else {
                        ids.add(row.invoiceNo);
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
            <Divider className="mb-3!" />
            <div className="flex flex-col gap-3 w-full min-w-0">
                <KitHeader
                    title="Push Bills To Buy"
                    subtitle="Every new POS bill is pushed to BUSY automatically in the background. If BUSY refused one (or an item is not in BUSY), the reason shows here; fix it and push again."
                    icon="tabler:file-invoice"
                    count={BusyCrmBillsList?.data?.totalItems ?? 0}
                    countLabel="records"
                />

                <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl">
                    <div className="flex flex-wrap items-end gap-x-3 gap-y-7">
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + N" className="top-0" />
                            <KitTextField
                                inputRef={nameRef}
                                size="small"
                                height="32px"
                                label="Name"
                                placeholderFontSize={14}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Bill no. / customer phone"
                                className="w-44"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + F" className="top-0" />
                            <KitTextField
                                inputRef={startDateRef}
                                label="Start Date"
                                size="small"
                                height="32px"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-44"
                            />
                        </div>

                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + E" className="top-0" />
                            <KitTextField
                                inputRef={endDateRef}
                                label="End Date"
                                size="small"
                                height="32px"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-44"
                            />
                        </div>
                        <div className="relative w-60">
                            <ShortcutBadge shortcut="Alt + S" className="top-0" />
                            <KitSelect
                                ref={storeRef}
                                label="Store Name"
                                placeholder="Select Store Name"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={storeOptions}
                                isDisabled={isStoreListLoading}
                                isClearable
                                value={storeOptions.find((option) => String(option.value) === String(storeId)) ?? ""}
                                onChange={(option) => setStoreId(option?.value ?? "")}
                            />
                        </div>
                        <div className="relative w-60">
                            <ShortcutBadge shortcut="Alt + A" className="top-0" />
                            <KitSelect
                                ref={statusRef}
                                label="Status"
                                placeholder="Select Status"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={statusOptions}
                                isDisabled={false}
                                value={statusOptions.find((option) => String(option.value) === String(status)) ?? ""}
                                onChange={(option) => setStatus(option?.value ?? "")}
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + P" className="-top-5" />
                            <KitButton
                                ref={pushPendingRef}
                                size="small"
                                variant="contained"
                                className="w-auto"
                                onClick={() => runBulk("range")}
                            >
                                Push pending in range
                            </KitButton>
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + D" className="-top-5" />
                            <KitButton
                                ref={pushSelectedRef}
                                size="small"
                                variant="contained"
                                className="w-auto"
                                disabled={!selectedItems.length}
                                onClick={() => runBulk("selected")}
                            >
                                Push selected ({selectedItems.length})
                            </KitButton>
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + R" className="-top-5" />
                            <IconButton
                                ref={refreshRef}
                                onClick={() => refreshBusyCrmBillsList()}
                                className="w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                            >
                                <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                            </IconButton>
                        </div>
                    </div>
                </Paper>

                {bulkResult?.results?.length > 0 && (
                    <Paper elevation={0} className="border border-gray-200 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-3">
                            <Typography variant="subtitle1" fontWeight={600}>
                                Last bulk push
                            </Typography>
                            <IconButton size="small" onClick={() => setBulkResult(null)} title="Dismiss">
                                <KitIcon icon="tabler:x" className="text-lg" />
                            </IconButton>
                        </div>

                        <div className="flex flex-col gap-3">
                            {bulkResult.results.map((item, index) => (
                                <div
                                    key={`${item.invoiceNo}-${item.date}-${index}`}
                                    className="flex flex-col gap-2 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                                >
                                    <div className="flex flex-wrap items-center gap-2">
                                        <SyncBadge status={item.status} />
                                        <Typography variant="body2" fontWeight={600}>
                                            {item.invoiceNo}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {item.date}
                                        </Typography>
                                        {item.busyNumber && (
                                            <Typography variant="caption" color="text.secondary">
                                                BUSY no. {item.busyNumber}
                                            </Typography>
                                        )}
                                    </div>

                                    {item.error && (
                                        <Typography
                                            variant="caption"
                                            color="error"
                                            sx={{
                                                whiteSpace: "normal",
                                                overflowWrap: "anywhere",
                                            }}
                                        >
                                            {item.error}
                                        </Typography>
                                    )}

                                    {item.itemResults?.length > 0 && (
                                        <div className="flex flex-col gap-1 pl-2">
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                Items auto-created / linked in BUSY:
                                            </Typography>

                                            {item.itemResults.map((product, productIndex) => (
                                                <div
                                                    key={`${product.itemCode}-${productIndex}`}
                                                    className="flex flex-wrap items-center gap-2"
                                                >
                                                    <Typography variant="caption">
                                                        {product.itemName || product.itemCode}
                                                    </Typography>
                                                    <Chip
                                                        label={product.status}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{
                                                            height: 20,
                                                            fontSize: "10px",
                                                            textTransform: "capitalize",
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Paper>
                )}

                <KitDataGrid
                    columns={columns}
                    rows={BusyCrmBillsList?.data?.items ?? []}
                    getRowId={(row) => row.invoiceNo}
                    rowCount={BusyCrmBillsList?.data?.totalItems}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    rowHeight={110}
                    isLoading={isBusyCrmBillsListLoading}
                    error={!!BusyCrmBillsListError}
                    getRowClassName={(params) =>
                        dataRows[activeRowIndex]?.invoiceNo === params.id ? "keyboard-active-row" : ""
                    }
                    checkboxSelection
                    rowSelection
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
