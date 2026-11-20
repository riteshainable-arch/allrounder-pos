import { Divider, Grid, IconButton, Paper, Typography } from "@mui/material";
import KitHeader from "../../../../../kit/components/KitHeader/KitHeader";
import { useEffect, useMemo, useRef, useState } from "react";
import ShortcutBadge from "../../../components/Dashboard/ShortcutBadge";
import KitIcon from "../../../../../kit/components/KitIcon/KitIcon";
import KitDataGrid from "../../../../../kit/components/KitDataGrid/KitDataGrid";
import { priceFormat } from "../../../../../kit/utils/priceFormat";
import KitTextField from "../../../../../kit/components/KitTextField/KitTextField";
import { format, subDays } from "date-fns";
import { useCreateSaleInvoiceImport, useGetAllBusySaleInvoices } from "../../../../../kit/hooks/data/busy";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import KitShow from "../../../../../kit/components/KitShow/KitShow";
import BySaleInvoicesViewModal from "../../../components/BuyIntegration/BuySalsInvoices/BySaleInvoicesViewModal";
import { toast } from "react-toastify";
import { SyncBadge } from "../../../../../kit/utils/syncBadge";

export default function BySaleInvoices() {
    const nameRef = useRef(null);
    const storeRef = useRef(null);
    const exportRef = useRef(null);
    const refreshRef = useRef(null);
    const importRef = useRef(null);
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
    const [startDate, setStartDate] = useState(lastWeek);
    const [endDate, setEndDate] = useState(today);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState();
    const [activeRowIndex, setActiveRowIndex] = useState(0);
    const [importResult, setImportResult] = useState(null);

    const query = {
        page,
        pageSize: pageSize,
        fromDate: startDate,
        toDate: endDate,
    };
    const {
        BusySaleInvoicesList,
        isBusySaleInvoicesListLoading,
        BusySaleInvoicesListError,
        refreshBusySaleInvoicesList,
    } = useGetAllBusySaleInvoices(query);
    const { createSaleInvoiceImport: onCreateSaleInvoiceImport, isCreatingSaleInvoiceImport } =
        useCreateSaleInvoiceImport();

    const data = BusySaleInvoicesList?.data?.items;

    const filterData = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return data;
        return data?.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
    }, [data, search]);

    const pick = (row, keys) => {
        if (!row) return null;
        for (const k of keys) {
            const v = row[k];
            if (v !== undefined && v !== null && v !== "") return v;
        }
        return null;
    };

    const totals = useMemo(
        () => ({
            count: filterData?.length,
            amount: filterData?.reduce((s, r) => s + Number(pick(r, ["grand_total", "total_amount"]) || 0), 0),
            fromCrm: filterData?.filter((r) => r.crmBill)?.length,
            imported: filterData?.filter((r) => r.crmImport)?.length,
        }),
        [filterData]
    );

    const toggleViewModal = () => setShowViewModal(!showViewModal);

    const handleView = (data) => {
        setSelectedItem(data);
        toggleViewModal();
    };

    const columns = [
        {
            field: "invoiceNo",
            headerName: "Invoice",
            minWidth: 160,
            flex: 1,
            renderCell: (params) => {
                const row = params.row;

                return (
                    <div className="flex flex-col justify-center leading-tight">
                        <Typography variant="body2" fontWeight={600}>
                            {pick(row, ["invoice_no", "voucher_number", "vch_no"]) ?? row.vch_code ?? "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {String(row.date ?? "").slice(0, 10)}
                        </Typography>
                    </div>
                );
            },
        },
        {
            field: "customer",
            headerName: "Customer",
            minWidth: 200,
            flex: 1.2,
            renderCell: (params) => {
                const row = params.row;

                return (
                    <div className="flex flex-col justify-center leading-tight min-w-0">
                        <Typography variant="body2" fontWeight={500} className="truncate">
                            {pick(row, ["customer_name", "account_name", "party_name", "billing_name"]) ?? "—"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {pick(row, ["customer_mobile", "mobile_number", "billing_mobile"]) ?? ""}
                        </Typography>
                    </div>
                );
            },
        },
        {
            field: "saleType",
            headerName: "Sale Type / MC",
            minWidth: 160,
            flex: 1,
            renderCell: (params) => {
                const row = params.row;

                return (
                    <div className="flex flex-col justify-center leading-tight">
                        <Typography variant="body2">{pick(row, ["sale_type_name", "sale_type"]) ?? "—"}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {pick(row, ["material_center_name", "mc_name"]) ?? ""}
                        </Typography>
                    </div>
                );
            },
        },
        {
            field: "totalAmount",
            headerName: "Amount",
            minWidth: 130,
            flex: 0.8,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={600}>
                    {priceFormat(pick(params.row, ["grand_total", "total_amount"]))}
                </Typography>
            ),
        },
        {
            field: "paymentStatus",
            headerName: "Payment",
            minWidth: 130,
            flex: 0.8,
            renderCell: (params) => (
                <Typography variant="body2">
                    {pick(params.row, ["payment_status", "bill_status", "status"]) ?? "—"}
                </Typography>
            ),
        },
        {
            field: "eInvoice",
            headerName: "E-way / E-invoice",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => {
                const row = params.row;
                const ewayBill = pick(row, ["eway_bill_no", "e_way_bill_no", "eway_bill_number", "ewaybill_no"]);
                const irn = pick(row, ["einvoice_irn", "irn", "e_invoice_no", "einvoice_no"]);

                return (
                    <div className="flex flex-col justify-center leading-tight">
                        <Typography variant="caption" color="text.secondary">
                            E-way: {ewayBill ?? "—"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" className="truncate max-w-40">
                            IRN: {irn ?? "—"}
                        </Typography>
                    </div>
                );
            },
        },
        {
            field: "crmStatus",
            headerName: "CRM Status",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => {
                const row = params.row;

                if (row.crmBill) {
                    return (
                        <Typography variant="caption" fontWeight={600} className="text-blue-700!">
                            Bill {row.crmBill.localRef}
                        </Typography>
                    );
                }

                if (row.crmImport) {
                    return (
                        <Typography variant="caption" fontWeight={600} className="text-green-700!">
                            Imported as {row.crmImport.invoiceNo}
                        </Typography>
                    );
                }

                return (
                    <Typography variant="caption" color="text.secondary">
                        BUSY only
                    </Typography>
                );
            },
        },
        {
            field: "actions",
            headerName: "Actions",
            minWidth: 100,
            sortable: false,
            filterable: false,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => (
                <KitButton size="small" variant="outlined" className="w-auto!" onClick={() => handleView(params.row)}>
                    Items
                </KitButton>
            ),
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
                case "i":
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

    const dataRows = filterData ?? [];

    useEffect(() => {
        const handleKeyDown = (e) => {
            const target = e.target;

            if (
                target instanceof HTMLElement &&
                (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
            ) {
                return;
            }

            if (!dataRows.length) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveRowIndex((prev) => Math.min(prev + 1, dataRows.length - 1));
                return;
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveRowIndex((prev) => Math.max(prev - 1, 0));
                return;
            }

            if (e.key === "Enter" || (e.shiftKey && e.key.toLowerCase() === "v")) {
                e.preventDefault();
                const row = dataRows[activeRowIndex];
                if (row) {
                    handleView(row);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [dataRows, activeRowIndex, handleView]);

    useEffect(() => {
        setActiveRowIndex(0);
    }, [
        page,
        pageSize,
        search,
        startDate,
        endDate,
    ]);

    const summaryCards = useMemo(
        () => [
            {
                title: "Invoices",
                value: totals.count,
                icon: "tabler:file-invoice",
            },
            {
                title: "Total Amount",
                value: priceFormat(totals.amount),
                icon: "tabler:currency-rupee",
            },
            {
                title: "Pushed from CRM",
                value: totals.fromCrm,
                icon: "tabler:cloud-upload",
            },
            {
                title: "Imported into CRM",
                value: totals.imported,
                icon: "tabler:cloud-download",
            },
        ],
        [totals]
    );

    const runImport = async () => {
        if (
            !window.confirm(
                `Import BUSY sale bills and sales returns from ${startDate} to ${endDate} into CRM bills (Store 1)?\nVouchers pushed from CRM and vouchers already imported are skipped. Stock is not changed.`
            )
        )
            return;
        try {
            const res = await onCreateSaleInvoiceImport({ fromDate: startDate, toDate: endDate });
            setImportResult(res.data);
            const { summary: s, bills, returns, returnsError } = res.data;
            toast.success(
                bills && returns
                    ? `Bills: imported ${bills.imported}, skipped ${bills.skipped}, failed ${bills.failed} · Returns: imported ${returns.imported}, skipped ${returns.skipped}, failed ${returns.failed}`
                    : `Imported ${s.imported}, skipped ${s.skipped}, failed ${s.failed}`,
                { duration: 6000 }
            );
            if (returnsError) toast.error(`Sales returns not imported: ${returnsError}`, { duration: 7000 });
            refreshBusySaleInvoicesList();
        } catch (e) {
            toast.error(busyErrorMessage(e, "Import failed"), { duration: 7000 });
        }
    };

    return (
        <div>
            <Divider className="mb-3!" />
            <div className="flex flex-col gap-3 w-full min-w-0">
                <div className="flex items-center justify-between gap-3">
                    <KitHeader
                        title="BUSY Sale Invoices"
                        subtitle="Sale invoices read live from BUSY. Import copies BUSY sale bills and sales returns into CRM bills (Invoices report, sales reports) with the BUSY number as reference."
                        icon="tabler:file-invoice"
                        count={filterData?.length ?? 0}
                        countLabel="records"
                    />

                    <div className="relative">
                        <ShortcutBadge shortcut="Alt + I" className="-top-5" />
                        <KitButton
                            ref={importRef}
                            size="small"
                            variant="contained"
                            className="w-auto"
                            disabled={isCreatingSaleInvoiceImport}
                            loading={isCreatingSaleInvoiceImport}
                            onClick={() => runImport()}
                        >
                            Import into CRM
                        </KitButton>
                    </div>
                </div>

                <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl">
                    <div className="flex flex-wrap items-end gap-x-3 gap-y-7">
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + N" className="top-0" />
                            <KitTextField
                                inputRef={nameRef}
                                size="small"
                                height="32px"
                                label="Filter loaded rows"
                                placeholderFontSize={14}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Filter loaded rows"
                                className="w-44"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + F" className="top-0" />
                            <KitTextField
                                inputRef={startDateRef}
                                label="From Date"
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
                                label="To Date"
                                size="small"
                                height="32px"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-44"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + R" className="-top-5" />
                            <IconButton
                                ref={refreshRef}
                                onClick={() => refreshBusySaleInvoicesList()}
                                className="w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                            >
                                <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                            </IconButton>
                        </div>
                    </div>
                </Paper>

                <Grid container spacing={2}>
                    {summaryCards.map((card) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={card.title}>
                            <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl h-full">
                                <div className="flex items-center gap-2 mb-1">
                                    <KitIcon icon={card.icon} className="text-primary text-xl!" />
                                    <Typography className="text-lg! font-bold!">{card.value}</Typography>
                                </div>

                                <Typography className="text-sm! text-third-500">{card.title}</Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {importResult?.results?.length > 0 && (
                    <Paper elevation={0} className="overflow-hidden rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between p-3">
                            <div>
                                <Typography variant="subtitle2" fontWeight={700}>
                                    Last Import Results
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Imported: {importResult.summary.imported} · Skipped: {importResult.summary.skipped}{" "}
                                    · Failed: {importResult.summary.failed}
                                </Typography>
                            </div>

                            <IconButton size="small" onClick={() => setImportResult(null)} title="Dismiss">
                                <KitIcon icon="tabler:x" />
                            </IconButton>
                        </div>

                        <Divider />

                        <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
                            {importResult.results.map((r, index) => (
                                <div
                                    key={`${r.kind || "bill"}-${r.busyId}-${index}`}
                                    className="flex flex-wrap items-center gap-2 px-3 py-2.5"
                                >
                                    <SyncBadge status={r.status} />

                                    {r.kind === "return" && (
                                        <Typography variant="caption" fontWeight={700} color="error">
                                            RETURN
                                        </Typography>
                                    )}

                                    <Typography variant="body2" fontWeight={600}>
                                        BUSY {r.busyNumber || r.busyId}
                                    </Typography>

                                    {r.invoiceNo && (
                                        <Typography variant="body2" color="text.secondary">
                                            → CRM Bill: {r.invoiceNo}
                                        </Typography>
                                    )}

                                    {r.amount != null && (
                                        <Typography variant="body2" color="text.secondary">
                                            {priceFormat(r.amount)}
                                        </Typography>
                                    )}

                                    {r.unmapped > 0 && (
                                        <Typography variant="caption" color="warning.main">
                                            item(s) not linked
                                        </Typography>
                                    )}

                                    {r.reason && (
                                        <Typography variant="caption" color="text.secondary">
                                            {r.reason}
                                        </Typography>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Paper>
                )}

                <KitDataGrid
                    columns={columns}
                    rows={filterData ?? []}
                    getRowId={(row) => row.vch_code}
                    rowCount={filterData?.length ?? 0}
                    paginationMode="client"
                    loading={isBusySaleInvoicesListLoading}
                    error={!!BusySaleInvoicesListError}
                    disableRowSelectionOnClick
                    getRowClassName={(params) =>
                        dataRows[activeRowIndex]?.vch_code === params.id ? "keyboard-active-row" : ""
                    }
                />
            </div>

            <KitShow show={showViewModal}>
                <BySaleInvoicesViewModal open={showViewModal} onClose={toggleViewModal} selectedItem={selectedItem} />
            </KitShow>
        </div>
    );
}
