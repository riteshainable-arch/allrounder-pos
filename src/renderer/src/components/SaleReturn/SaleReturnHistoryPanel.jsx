import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Backdrop, Chip, CircularProgress, IconButton, Paper, Typography } from "@mui/material";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import KitMuiTable from "../../../../kit/components/KitMuiTable";
import KitSelect from "../../../../kit/components/KitSelect";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import { fetchSaleReturns, useSaleReturns } from "../../../../kit/hooks/data/saleReturn";
import { useUsersDropdown } from "../../../../kit/hooks/data/users";
import { parseApiList, buildUserLabel } from "../../../../kit/utils/parseApiList";
import { getPersonDisplayName } from "../../../../kit/utils/invoiceBill";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import { getPaymentModeLabel } from "../../../../kit/utils/billPayments";
import SrnPrintModal from "./SrnPrintModal";
import SrnDetailDrawer from "./SrnDetailDrawer";
import { useNavigate } from "react-router-dom";
import useUser from "../../../../kit/hooks/useUser";
import { EXPORT_LIMIT, Role } from "../../../../kit/configs/general";
import ShortcutBadge from "../Dashboard/ShortcutBadge";
import KitShow from "../../../../kit/components/KitShow/KitShow";
import KitDataGrid from "../../../../kit/components/KitDataGrid/KitDataGrid";
import { downloadCsv, downloadXlsx } from "../../../../kit/utils/exportFile";
import { toast } from "react-toastify";
import { format } from "date-fns";
import useKeyboardShortcuts from "../../../../kit/hooks/useKeyboardShortcuts";
import KitHeader from "../../../../kit/components/KitHeader/KitHeader";
import ManagerUnlockModal from "../Dashboard/ManagerUnlockModal";

export default function SaleReturnHistoryPanel({ showCashierFilter = false, showBackButton = false }) {
    const navigate = useNavigate();
    const userData = useUser();
    const posRef = useRef(null);
    const cashierRef = useRef(null);
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const phoneRef = useRef(null);
    const numberRef = useRef(null);
    const invoiceRef = useRef(null);
    const isManager = String(userData?.role || "").toLowerCase() === Role.MANAGER;

    const today = format(new Date(), "yyyy-MM-dd");

    const [printPayload, setPrintPayload] = useState(null);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [isManagerUnlockModalOpen, setIsManagerUnlockModalOpen] = useState(false);
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [cashierId, setCashierId] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [srnNumber, setSrnNumber] = useState("");
    const [originalInvoiceNo, setOriginalInvoiceNo] = useState("");
    const [selectedSrn, setSelectedSrn] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [activeRowIndex, setActiveRowIndex] = useState(0);
    const [isExporting, setIsExporting] = useState(false);

    const queryParams = {
        page: page,
        limit: pageSize,
        ...(startDate && { startDate: startDate }),
        ...(endDate && { endDate: endDate }),
        ...((cashierId && (showCashierFilter || isManager)) && { cashierId: cashierId }),
        ...(customerPhone && { customerPhone: customerPhone.trim() }),
        ...(srnNumber && { srnNumber: srnNumber.trim() }),
        ...(originalInvoiceNo && { originalInvoiceNo: originalInvoiceNo.trim() }),
    }

    const { saleReturns, isSaleReturnsLoading, saleReturnsError, refreshSaleReturns } = useSaleReturns(queryParams);
    const { usersDropdown } = useUsersDropdown({ role: "cashier" }, showCashierFilter || isManager);

    const cashierOptions = useMemo(() => {
        const users = parseApiList(usersDropdown);
        return [
            { label: "All Cashiers", value: "" },
            ...users.map((user) => ({
                label: buildUserLabel(user),
                value: user.id,
            })),
        ];
    }, [usersDropdown]);

    const handleReprint = useCallback((payload) => {
        setPrintPayload(payload);
        toggleManagerUnlockModal()
    }, []);

    const handleClosePrintModal = () => {
        setPrintModalOpen(false);
        setPrintPayload(null);
    };

    const toggleManagerUnlockModal = () => setIsManagerUnlockModalOpen(!isManagerUnlockModalOpen);

    const columns = [
        {
            field: 'srnNumber',
            headerName: 'SRN No',
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {params?.row?.srnNumber ?? "-"}
                </Typography>
            )
        },
        {
            field: 'returnDate',
            headerName: 'Date',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {params?.row?.returnDate ?? "-"}
                </Typography>
            )
        },
        {
            field: 'originalInvoiceNo',
            headerName: 'Original Invoice',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {params.row.originalInvoiceNo ?? '-'}
                </Typography>
            )
        },
        {
            field: 'customer',
            headerName: 'Customer',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {getPersonDisplayName(params.row.customer)}
                </Typography>
            )
        },
        {
            field: 'cashier',
            headerName: 'Cashier',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {getPersonDisplayName(params.row.cashier)}
                </Typography>
            )
        },
        {
            field: 'approvedBy',
            headerName: 'Approved By',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {getPersonDisplayName(params.row.approvedBy)}
                </Typography>
            )
        },
        {
            field: 'refundAmount',
            headerName: 'Refund',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {priceFormat(params.row.refundAmount)}
                </Typography>
            )
        },
        {
            field: 'refundMode',
            headerName: 'Mode',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {getPaymentModeLabel(params.row.refundMode ?? 'cash')}
                </Typography>
            )
        },
        {
            field: 'status',
            headerName: 'Status',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Chip
                    size="small"
                    label={params.row.status || "-"}
                    variant="outlined"
                />
            )
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
                </div >
            ),
            renderCell: (params) => (
                <KitButton
                    size="small"
                    variant="outlined"
                    className="w-auto!"
                    onClick={() => setSelectedSrn(params.row.srnNumber)}
                >
                    View
                </KitButton>
            ),
        },
    ];

    const getExportParams = {
        page: page,
        limit: EXPORT_LIMIT,
        ...(startDate && { startDate: startDate }),
        ...(endDate && { endDate: endDate }),
        ...((cashierId && (showCashierFilter || isManager)) && { cashierId: cashierId }),
        ...(customerPhone && { customerPhone: customerPhone.trim() }),
        ...(srnNumber && { srnNumber: srnNumber.trim() }),
        ...(originalInvoiceNo && { originalInvoiceNo: originalInvoiceNo.trim() }),
    };

    const handleExport = async (type) => {
        if (!saleReturns?.data?.srns?.length > 0) {
            toast.warning("No data available to export.");
            return;
        }

        setIsExporting(true);

        try {
            const response = await fetchSaleReturns(getExportParams);
            const bills = response?.data?.srns || [];

            const exportRows = bills.slice(0, EXPORT_LIMIT).map((bill) => ({
                "SRN No": bill.srnNumber ?? "-",
                Date: bill.returnDate ?? "-",
                "Original Invoice": bill.originalInvoiceNo ?? "-",
                Customer: getPersonDisplayName(bill.customer),
                Cashier: getPersonDisplayName(bill.cashier),
                "Approved By": getPersonDisplayName(bill.approvedBy),
                Refund: priceFormat(bill.refundAmount),
                Mode: getPaymentModeLabel(bill.refundMode ?? "cash"),
                Status: bill.status ?? "-",
            }));

            if (!exportRows.length) return;

            const timestamp = format(new Date(), "yyyyMMdd_HHmmss");

            if (type === "csv") {
                downloadCsv(exportRows, `sale_returns_${timestamp}.csv`);

            } else {
                downloadXlsx(exportRows, `sale_returns_${timestamp}.xlsx`, "Sale Returns");
            }
        } catch (error) {
            toast.error(error?.message || "Export failed");
        } finally {
            setIsExporting(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;

            switch (e.key.toLowerCase()) {
                case "b":
                    e.preventDefault();
                    posRef.current?.click();
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

                case "p":
                    e.preventDefault();
                    phoneRef.current?.focus();
                    break;

                case "n":
                    e.preventDefault();
                    numberRef.current?.focus();
                    break;

                case "i":
                    e.preventDefault();
                    invoiceRef.current?.focus();
                    break;

                case "r":
                    e.preventDefault();
                    refreshSaleReturns();
                    break;

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const activeRow = saleReturns?.data?.srns?.[activeRowIndex];

    useEffect(() => {
        const rows = saleReturns?.data?.srns ?? [];

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
                            setSelectedSrn(activeRow?.srnNumber);
                        }
                        break;

                    default:
                        break;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [saleReturns, activeRowIndex]);

    useEffect(() => {
        if (saleReturns?.data?.srns?.length) {
            setActiveRowIndex(0);
        }
    }, [saleReturns]);

    useKeyboardShortcuts({
        handleExportCsv: () => handleExport("csv"),
        handleExportXlsx: () => handleExport("xlsx"),
    });

    return (
        <>
            <Backdrop open={isSaleReturnsLoading || isExporting} sx={{ zIndex: 9999 }}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <KitHeader
                        title="Sale Return History"
                        subtitle={`${saleReturns?.data?.count ?? 0} SRN(s) · Total refunded ${priceFormat(saleReturns?.data?.refundAmount ?? 0)}`}
                        icon="tabler:arrow-back-up"
                        count={saleReturns?.data?.pagination?.totalItems ?? 0}
                        countLabel="records"
                    />

                    {showBackButton && (
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + B" className="-top-5!" />
                            <KitButton
                                ref={posRef}
                                size="small"
                                variant="outlined"
                                className="w-auto"
                                startIcon={<KitIcon icon="tabler:arrow-left" />}
                                onClick={() => navigate("/dashboard")}
                            >
                                POS
                            </KitButton>
                        </div>
                    )}
                </div>

                <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl">
                    <div className="flex flex-wrap gap-x-3 gap-y-6 items-end">
                        {(showCashierFilter || isManager) && (
                            <div className="w-52 relative">
                                <ShortcutBadge shortcut="Alt + C" className="top-0" />
                                <KitSelect
                                    ref={cashierRef}
                                    label="Cashier"
                                    size="small"
                                    placeholderFontSize={14}
                                    inputFontSize={14}
                                    options={cashierOptions}
                                    value={
                                        cashierOptions.find((o) => String(o.value) === String(cashierId)) ??
                                        cashierOptions[0]
                                    }
                                    onChange={(option) => setCashierId(option?.value ?? "")}
                                />
                            </div>
                        )}
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + S" className="top-0" />
                            <KitTextField
                                inputRef={startDateRef}
                                size="small"
                                type="date"
                                label="Start"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + E" className="top-0" />
                            <KitTextField
                                inputRef={endDateRef}
                                size="small"
                                type="date"
                                label="End"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + P" className="top-0" />
                            <KitTextField
                                inputRef={phoneRef}
                                size="small"
                                label="Customer Phone"
                                placeholder="Enter Phone"
                                placeholderFontSize={14}
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + N" className="top-0" />
                            <KitTextField
                                inputRef={numberRef}
                                size="small"
                                label="SRN No"
                                placeholder="Enter SRN No"
                                placeholderFontSize={14}
                                value={srnNumber}
                                onChange={(e) => setSrnNumber(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + I" className="top-0" />
                            <KitTextField
                                inputRef={invoiceRef}
                                size="small"
                                label="Original Invoice"
                                placeholder="Enter original invoice"
                                placeholderFontSize={14}
                                value={originalInvoiceNo}
                                onChange={(e) => setOriginalInvoiceNo(e.target.value)}
                                className="w-44"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Shift + C" className="-top-5!" />
                            <KitButton
                                size="small"
                                variant="contained"
                                className="w-auto"
                                onClick={() => handleExport("csv")}
                            >
                                Export as CSV
                            </KitButton>
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Shift + X" className="-top-5!" />
                            <KitButton
                                size="small"
                                variant="contained"
                                className="w-auto"
                                onClick={() => handleExport("xlsx")}
                            >
                                Export as XLSX
                            </KitButton>
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + R" className="-top-5!" />
                            <IconButton
                                className="w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                                onClick={() => refreshSaleReturns()}
                            >
                                <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                            </IconButton>
                        </div>
                    </div>
                </Paper>

                <div className="overflow-hidden">
                    <KitDataGrid
                        columns={columns}
                        rows={saleReturns?.data?.srns}
                        getRowId={(row) => row?.id}
                        rowCount={saleReturns?.data?.pagination?.totalItems}
                        pageSize={pageSize}
                        setPage={setPage}
                        setPageSize={setPageSize}
                        isLoading={isSaleReturnsLoading}
                        error={!!saleReturnsError}
                        disableRowSelectionOnClick
                        getRowClassName={(params) =>
                            params.indexRelativeToCurrentPage === activeRowIndex
                                ? "active-row"
                                : ""
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
            </div>

            <KitShow show={selectedSrn}>
                <SrnDetailDrawer
                    srnNumber={selectedSrn}
                    open={Boolean(selectedSrn)}
                    onClose={() => setSelectedSrn(null)}
                    onReprint={handleReprint}
                />
            </KitShow>

            <KitShow show={printModalOpen}>
                <SrnPrintModal
                    isOpen={printModalOpen}
                    onClose={handleClosePrintModal}
                    payload={printPayload}
                />
            </KitShow>

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
        </>
    );
}
