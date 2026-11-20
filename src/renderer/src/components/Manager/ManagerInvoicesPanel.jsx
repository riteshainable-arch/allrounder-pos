import * as XLSX from "xlsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Backdrop,
    Chip,
    CircularProgress,
    FormControlLabel,
    IconButton,
    Paper,
    Switch,
    Tooltip,
    Typography,
} from "@mui/material";
import { format, parseISO } from "date-fns";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitDebouncedInput from "../../../../kit/components/KitDebouncedInput";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import KitMuiTable from "../../../../kit/components/KitMuiTable";
import KitSelect from "../../../../kit/components/KitSelect";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import { fetchInvoiceBills, useInvoiceBills } from "../../../../kit/hooks/data/invoice";
import { useUsersDropdown } from "../../../../kit/hooks/data/users";
import useUser from "../../../../kit/hooks/useUser";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import { parseApiList, buildUserLabel } from "../../../../kit/utils/parseApiList";
import { EllipsisText } from "../../../../kit/utils/ellipsisText";
import {
    formatBillPaymentsSummary,
    getPaymentModeLabel,
    normalizeBillPayments,
} from "../../../../kit/utils/billPayments";
import { EXPORT_LIMIT, paymentMethodConst } from "../../../../kit/configs/general";
import { getPersonDisplayName } from "../../../../kit/utils/invoiceBill";
import InvoiceBillDetailDrawer from "./InvoiceBillDetailDrawer";
import ShortcutBadge from "../Dashboard/ShortcutBadge";
import KitDataGrid from "../../../../kit/components/KitDataGrid/KitDataGrid";
import { toast } from "react-toastify";
import { downloadCsv, downloadXlsx } from "../../../../kit/utils/exportFile";
import useKeyboardShortcuts from "../../../../kit/hooks/useKeyboardShortcuts";
import KitHeader from "../../../../kit/components/KitHeader/KitHeader";
import ManagerUnlockModal from "../Dashboard/ManagerUnlockModal";
import KitShow from "../../../../kit/components/KitShow/KitShow";
import KOTPrintModal from "../Dashboard/KOTPrintModal";

const DEFAULT_STORE_ID = 1;

const formatBillDateTime = (date, createdAt) => {
    const datePart = date || (createdAt ? format(parseISO(createdAt), "yyyy-MM-dd") : "-");
    const timePart = createdAt ? format(parseISO(createdAt), "hh:mm a") : "";
    return (
        <div className="flex flex-col">
            <Typography className="text-sm!">{datePart}</Typography>
            {timePart && <Typography className="text-xs! text-third-500">{timePart}</Typography>}
        </div>
    );
};

const getCustomerLabel = (bill = {}) =>
    bill.customer?.displayName ||
    [bill.customer?.firstName, bill.customer?.lastName].filter(Boolean).join(" ") ||
    bill.customer?.phone ||
    "-";

export default function ManagerInvoicesPanel() {
    const userData = useUser();
    const searchRef = useRef(null);
    const cashierRef = useRef(null);
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const invoiceRef = useRef(null);
    const nameRef = useRef(null);
    const today = format(new Date(), "yyyy-MM-dd");

    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [createdById, setCreatedById] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [invoiceNo, setInvoiceNo] = useState("");
    const [returnsOnly, setReturnsOnly] = useState(false);
    const [selectedInvoiceNo, setSelectedInvoiceNo] = useState(null);
    const [selectedListRow, setSelectedListRow] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [activeRowIndex, setActiveRowIndex] = useState(0);
    const [isManagerUnlockModalOpen, setIsManagerUnlockModalOpen] = useState(false);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [selectedInvoiceList, setSelectedInvoiceList] = useState(null);

    const storeId = userData?.storeId || DEFAULT_STORE_ID;

    const queryParams = {
        page: page,
        limit: pageSize,
        storeId: storeId,
        ...(startDate && { startDate: startDate }),
        ...(endDate && { endDate: endDate }),
        ...(createdById && { createdById: createdById }),
        ...(customerName && { customerName: customerName }),
        ...(invoiceNo && { invoiceNo: invoiceNo }),
        ...(search && { search: search.trim() }),
        ...(returnsOnly && { isReturnBill: true }),
    };

    const { invoiceBills, isInvoiceBillsLoading, invoiceBillsError, refreshInvoiceBills } =
        useInvoiceBills(queryParams);
    const { usersDropdown, isUsersDropdownLoading } = useUsersDropdown({ role: "cashier" });

    const report = invoiceBills?.data || {};
    const bills = report.bills || parseApiList(invoiceBills, ["bills"]);
    const pagination = report.pagination || {};
    const totalCount = pagination.total ?? bills.length;

    const cashierOptions = useMemo(() => {
        const users = parseApiList(usersDropdown);
        return [
            { label: "All Cashiers", value: "" },
            ...users.map((user) => ({
                label: user.displayName || buildUserLabel(user),
                value: user.id,
            })),
        ];
    }, [usersDropdown]);

    const handleViewDetail = useCallback((bill) => {
        setSelectedInvoiceNo(bill.invoiceNo);
        setSelectedListRow(bill);
        setDetailOpen(true);
    }, []);

    const handleCloseDetail = useCallback(() => {
        setDetailOpen(false);
        setSelectedInvoiceNo(null);
        setSelectedListRow(null);
    }, []);

    const toggleManagerUnlockModal = () => setIsManagerUnlockModalOpen(!isManagerUnlockModalOpen);

    const handleReprint = useCallback((payload) => {
        setSelectedInvoiceList(payload);
        toggleManagerUnlockModal();
    }, []);

    const handleClosePrintModal = () => {
        setPrintModalOpen(false);
        setSelectedInvoiceList(null);
    };

    const getExportParams = {
        page: 1,
        limit: EXPORT_LIMIT,
        storeId: storeId,
        ...(startDate && { startDate: startDate }),
        ...(endDate && { endDate: endDate }),
        ...(createdById && { createdById: createdById }),
        ...(customerName && { customerName: customerName }),
        ...(invoiceNo && { invoiceNo: invoiceNo }),
        ...(search && { search: search.trim() }),
        ...(returnsOnly && { isReturnBill: true }),
    };

    const handleExport = async (type) => {
        if (!invoiceBills?.data?.bills?.length > 0) {
            toast.warning("No data available to export.");
            return;
        }

        setIsExporting(true);

        try {
            const response = await fetchInvoiceBills(getExportParams);
            const bills = response?.data?.bills || [];

            const exportRows = bills.slice(0, EXPORT_LIMIT).map((bill) => {
                const paymentSummary =
                    bill.paymentMethod === paymentMethodConst.MIXED || bill.paymentMethod === "mixed"
                        ? formatBillPaymentsSummary(bill)
                        : getPaymentModeLabel(bill.paymentMethod) || "-";

                const publishedDate =
                    bill.date || (bill.createdAt ? format(parseISO(bill.createdAt), "yyyy-MM-dd hh:mm a") : "-");

                return {
                    "Invoice No": bill.invoiceNo || "-",
                    "BUSY Inv No": bill.busyNumber || "-",
                    "Date / Time": publishedDate,
                    Customer: getCustomerLabel(bill),
                    Phone: bill.phone || "-",
                    Cashier: getPersonDisplayName(bill.createdBy),
                    Payment: paymentSummary,
                    Total: priceFormat(bill.totalAmount),
                    Cash: priceFormat(bill.cashPortion),
                    Settled: bill.isSettled ? "Yes" : "No",
                    Type: bill.isReturnBill ? "Return" : "Sale",
                };
            });

            if (!exportRows.length) return;

            const timestamp = format(new Date(), "yyyyMMdd_HHmmss");

            if (type === "csv") {
                downloadCsv(exportRows, `invoices_${timestamp}.csv`);
            } else {
                downloadXlsx(exportRows, `invoices_${timestamp}.xlsx`, "Invoices");
            }
        } catch (error) {
            toast.error(error?.message || "Export failed");
        } finally {
            setIsExporting(false);
        }
    };

    const columns = [
        {
            field: "invoiceNo",
            headerName: "Invoice No",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" className="text-sm!">
                    {params?.row?.invoiceNo ?? "-"}
                </Typography>
            ),
        },
        {
            field: "dateTime",
            headerName: "Date / Time",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => formatBillDateTime(params?.row?.date, params?.row?.createdAt),
        },
        {
            headerName: "Customer",
            field: 'busyNumber',
            headerName: 'BUSY Inv No',
            minWidth: 130,
            flex: 0.7,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {params?.row?.busyNumber || "-"}
                    {params?.row?.source === "BUSY" && (
                        <span className="ml-1 rounded bg-blue-50 px-1 text-[10px] text-blue-700">From BUSY</span>
                    )}
                </Typography>
            )
        },
        {
            field: "phone",
            headerName: "Phone",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" className="text-sm!">
                    {params.row.phone || "-"}
                </Typography>
            ),
        },
        {
            field: "cashier",
            headerName: "Cashier",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" className="text-sm!">
                    {getPersonDisplayName(params.row.createdBy)}
                </Typography>
            ),
        },
        {
            field: "paymentMethod",
            headerName: "Payment",
            minWidth: 250,
            flex: 1,
            renderCell: (params) => {
                const payments = normalizeBillPayments(params?.row);
                const isMixed =
                    params?.row.paymentMethod === paymentMethodConst.MIXED || params?.row.paymentMethod === "mixed";

                if (isMixed && payments.length) {
                    return (
                        <Tooltip title={formatBillPaymentsSummary(params?.row)} placement="top">
                            <div className="flex gap-1 py-1">
                                {payments.map((payment, index) => (
                                    <Chip
                                        key={`${payment.paymentMode}-${index}`}
                                        size="small"
                                        variant="outlined"
                                        label={`${getPaymentModeLabel(payment.paymentMode)} ${priceFormat(payment.amount)}`}
                                    />
                                ))}
                            </div>
                        </Tooltip>
                    );
                }

                return (
                    <Typography className="text-sm!">
                        {getPaymentModeLabel(params?.row.paymentMethod) || "-"}
                    </Typography>
                );
            },
        },
        {
            field: "totalAmount",
            headerName: "Total",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" className="text-sm!">
                    {priceFormat(params.row.totalAmount)}
                </Typography>
            ),
        },
        {
            field: "cashPortion",
            headerName: "Cash",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" className="text-sm!">
                    {priceFormat(params.row.cashPortion)}
                </Typography>
            ),
        },
        {
            field: "isSettled",
            headerName: "Settled",
            minWidth: 150,
            flex: 1,
            renderCell: (params) =>
                params?.row?.isSettled ? (
                    <CheckCircleIcon fontSize="small" color="success" />
                ) : (
                    <FiberManualRecordIcon fontSize="small" color="error" />
                ),
        },
        {
            field: "type",
            headerName: "Type",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Chip
                    size="small"
                    color={params?.row?.isReturnBill ? "warning" : "default"}
                    label={params?.row?.isReturnBill ? "Return" : "Sale"}
                    variant="outlined"
                />
            ),
        },
        {
            field: "actions",
            headerName: "Action",
            minWidth: 100,
            renderHeader: () => (
                <div className="flex flex-col gap-1 text-start">
                    <span>Actions</span>
                    <span className="rounded bg-blue-100 px-1 py-0.5 text-[9px] font-semibold text-blue-700 h-[16px]! w-fit">
                        Shift + V
                    </span>
                </div>
            ),
            renderCell: (params) => (
                <KitButton
                    size="small"
                    variant="outlined"
                    className="w-auto!"
                    onClick={() => handleViewDetail(params.row)}
                >
                    View
                </KitButton>
            ),
        },
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;

            switch (e.key.toLowerCase()) {
                case "o":
                    e.preventDefault();
                    searchRef.current?.focus();
                    break;

                case "c":
                    e.preventDefault();
                    cashierRef.current?.focus();
                    break;

                case "s":
                    e.preventDefault();
                    startDateRef.current?.focus();
                    break;

                case "e":
                    e.preventDefault();
                    endDateRef.current?.focus();
                    break;

                case "n":
                    e.preventDefault();
                    nameRef.current?.focus();
                    break;

                case "i":
                    e.preventDefault();
                    invoiceRef.current?.focus();
                    break;

                case "t":
                    e.preventDefault();
                    setReturnsOnly((prev) => !prev);
                    break;

                case "r":
                    e.preventDefault();
                    refreshInvoiceBills();
                    break;

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        if (invoiceBills?.data?.bills?.length) {
            setActiveRowIndex(0);
        }
    }, [invoiceBills]);

    const activeRow = invoiceBills?.data?.bills?.[activeRowIndex];

    useEffect(() => {
        const rows = invoiceBills?.data?.bills ?? [];

        const handleKeyDown = (e) => {
            if (!rows.length) return;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setActiveRowIndex((prev) => Math.min(prev + 1, rows.length - 1));
                    break;

                case "ArrowUp":
                    e.preventDefault();
                    setActiveRowIndex((prev) => Math.max(prev - 1, 0));
                    break;
            }

            if (e.shiftKey) {
                switch (e.key.toLowerCase()) {
                    case "v":
                        e.preventDefault();
                        if (activeRow) {
                            handleViewDetail(activeRow);
                        }
                        break;

                    default:
                        break;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [invoiceBills, activeRowIndex]);

    useKeyboardShortcuts({
        handleExportCsv: () => handleExport("csv"),
        handleExportXlsx: () => handleExport("xlsx"),
    });

    return (
        <>
            <Backdrop open={isInvoiceBillsLoading || isExporting} sx={{ zIndex: 9999, color: "#fff" }}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <div className="flex flex-col gap-3 w-full min-w-0">
                <KitHeader
                    title="Invoices"
                    subtitle="View and manage invoices"
                    icon="tabler:file-invoice"
                    count={invoiceBills?.data?.pagination?.totalItems ?? 0}
                    countLabel="records"
                />

                <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl">
                    <div className="grid grid-cols-2 items-end gap-x-2 gap-y-3 md:flex md:flex-wrap md:gap-y-7">
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + O" className="-top-5 hidden md:block"/>
                            <KitDebouncedInput
                                ref={searchRef}
                                value={search}
                                onChange={(value) => setSearch(String(value))}
                                placeholder="Search invoice, phone, customer, cashier..."
                                className="w-full md:w-72"
                                size="small"
                            />
                        </div>
                        <div className="relative w-full min-w-0 md:w-52">
                            <ShortcutBadge shortcut="Alt + C" className="top-0 hidden md:block" />
                            <KitSelect
                                ref={cashierRef}
                                label="Cashier"
                                placeholder="All Cashiers"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={cashierOptions}
                                isDisabled={isUsersDropdownLoading}
                                value={
                                    cashierOptions.find((option) => String(option.value) === String(createdById)) ??
                                    cashierOptions[0]
                                }
                                onChange={(option) => setCreatedById(option?.value ?? "")}
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + S" className="top-0 hidden md:block" />
                            <KitTextField
                                inputRef={startDateRef}
                                size="small"
                                height="32px"
                                type="date"
                                label="Start Date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full md:w-44"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + E" className="top-0 hidden md:block" />
                            <KitTextField
                                inputRef={endDateRef}
                                size="small"
                                height="32px"
                                type="date"
                                label="End Date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full md:w-44"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + N" className="top-0 hidden md:block" />
                            <KitTextField
                                inputRef={nameRef}
                                size="small"
                                height="32px"
                                label="Customer Name"
                                placeholderFontSize={14}
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="e.g. Raj"
                                className="w-full md:w-44"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + I" className="top-0 hidden md:block" />
                            <KitTextField
                                inputRef={invoiceRef}
                                size="small"
                                height="32px"
                                label="Invoice No"
                                placeholderFontSize={14}
                                value={invoiceNo}
                                onChange={(e) => setInvoiceNo(e.target.value)}
                                placeholder="e.g. BILL-1784"
                                className="w-full md:w-44"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + T" className="-top-6! hidden md:block" />
                            <FormControlLabel
                                sx={{
                                    "& .MuiFormControlLabel-label": {
                                        fontSize: { xs: "13px", md: "0.875rem" },
                                    },
                                }}
                                control={
                                    <Switch
                                        size="small"
                                        checked={returnsOnly}
                                        onChange={(e) => setReturnsOnly(e.target.checked)}
                                    />
                                }
                                label="Returns only"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Shift + C" className="-top-5! hidden md:block" />
                            <KitButton
                                size="small"
                                variant="contained"
                                className="w-full md:w-auto"
                                onClick={() => handleExport("csv")}
                            >
                                Export as CSV
                            </KitButton>
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Shift + X" className="-top-5! hidden md:block" />
                            <KitButton
                                size="small"
                                variant="contained"
                                className="w-full md:w-auto"
                                onClick={() => handleExport("xlsx")}
                            >
                                Export as XLSX
                            </KitButton>
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + R" className="-top-5! hidden md:block" />
                            <IconButton
                                className="w-full md:w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                                onClick={() => refreshInvoiceBills()}
                            >
                                <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                            </IconButton>
                        </div>
                    </div>
                </Paper>

                <KitDataGrid
                    columns={columns}
                    rows={invoiceBills?.data?.bills ?? []}
                    getRowId={(row) => row?.invoiceNo}
                    rowCount={invoiceBills?.data?.pagination?.totalItems}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    isLoading={isInvoiceBillsLoading}
                    error={!!invoiceBillsError}
                    disableRowSelectionOnClick
                    getRowClassName={(params) =>
                        params.indexRelativeToCurrentPage === activeRowIndex ? "active-row" : ""
                    }
                    sx={(theme) => ({
                        "& .active-row": {
                            backgroundColor: `${theme.palette.customColors.activeBackground} !important`,
                        },
                        "& .active-row:hover": {
                            backgroundColor: `${theme.palette.customColors.activeBackground} !important`,
                        },
                    })}
                />
            </div>

            <InvoiceBillDetailDrawer
                open={detailOpen}
                invoiceNo={selectedInvoiceNo}
                listRow={selectedListRow}
                onClose={handleCloseDetail}
                onReprint={handleReprint}
            />

            <KitShow show={isManagerUnlockModalOpen}>
                <ManagerUnlockModal
                    isOpen={isManagerUnlockModalOpen}
                    onClose={toggleManagerUnlockModal}
                    onSuccess={() => {
                        toggleManagerUnlockModal();
                        setPrintModalOpen(true);
                    }}
                />
            </KitShow>

            <KitShow show={printModalOpen}>
                <KOTPrintModal
                    isOpen={printModalOpen}
                    autoPrint
                    onClose={handleClosePrintModal}
                    selectedItems={selectedInvoiceList}
                />
            </KitShow>
        </>
    );
}
