import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Backdrop,
    Chip,
    CircularProgress,
    Grid,
    Paper,
    Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { format, subDays } from "date-fns";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import KitSelect from "../../../../kit/components/KitSelect";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import { useCashierLogs } from "../../../../kit/hooks/data/cashierLog";
import { useReconciliation } from "../../../../kit/hooks/data/settlement";
import { mergeCollectionLogs } from "../../../../kit/utils/collectionLogs";
import { syncDayBillsToServer } from "../../../../kit/utils/syncOperations";
import { getElectronApi } from "../../../../kit/utils/electronApi";
import ShortcutBadge from "../Dashboard/ShortcutBadge";
import KitHeader from "../../../../kit/components/KitHeader/KitHeader";
import CashierDaySummary from "./CashierDaySummary";

const toNumber = (value) => Number(value || 0);

const formatDateTime = (value) => {
    if (!value) return "-";
    return format(new Date(value), "dd MMM yyyy, hh:mm a");
};

const getCashierLabel = (log, cashierNameMap = {}) => {
    const cashier = log?.cashier || log?.user || {};
    const name = [cashier.firstName, cashier.lastName].filter(Boolean).join(" ");
    if (name) return name;
    if (cashier.email || log.email) return cashier.email || log.email;
    if (log.userName) return log.userName;

    const userId = log?.userId ?? cashier?.id;
    const mapped = cashierNameMap[userId] || cashierNameMap[String(userId)];
    if (mapped) return mapped;

    if (userId) return `User #${userId}`;
    return null;
};

const DenominationTable = ({ title, denominations = [], totalCash, totalNotes }) => (
    <div className="flex-1 min-w-65">
        <Typography className="font-semibold! text-sm! mb-2">{title}</Typography>
        {!denominations?.length ? (
            <Typography className="text-sm! text-third-500">No data</Typography>
        ) : (
            <>
                <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead  >
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold">Note</th>
                                <th className="px-3 py-2 text-right font-semibold">Count</th>
                                <th className="px-3 py-2 text-right font-semibold">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {denominations.map((item) => (
                                <tr key={`${title}-${item.denomination}`} className="border-t">
                                    <td className="px-3 py-2">{priceFormat(item.denomination)}</td>
                                    <td className="px-3 py-2 text-right">{item.count}</td>
                                    <td className="px-3 py-2 text-right">
                                        {priceFormat(item.denomination * item.count)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                    <span>Total Notes: <b>{totalNotes ?? 0}</b></span>
                    <span>Total Cash: <b>{priceFormat(totalCash)}</b></span>
                </div>
            </>
        )}
    </div>
);

export default function CashierCollectionReport({
    title = "My Collection Report",
    subtitle,
    showHomeButton = true,
    homePath = "/dashboard",
    userId,
    mergeLocalLogs = true,
    showCashierFilter = false,
    cashierOptions = [],
    selectedCashierId = "",
    onCashierChange,
    isCashierOptionsLoading = false,
    cashierNameMap = {},
    initialStartDate,
    initialEndDate,
    showDaySummary = false,
    storeId,
}) {
    const cashierRef = useRef(null);
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const applyRef = useRef(null);
    const posRef = useRef(null);

    const navigate = useNavigate();
    const today = format(new Date(), "yyyy-MM-dd");

    const [startDate, setStartDate] = useState(initialStartDate || format(subDays(new Date(), 6), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(initialEndDate || today);
    const [page, setPage] = useState(1);
    const [localDayBills, setLocalDayBills] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [expanded, setExpanded] = useState(null);

    const queryParams = useMemo(() => {
        const params = {
            startDate,
            endDate,
            page,
            limit: 50,
        };
        if (userId) {
            params.userId = userId;
        }
        return params;
    }, [startDate, endDate, page, userId]);

    const { cashierLogs, isCashierLogsLoading, refreshCashierLogs } = useCashierLogs(queryParams);

    const loadLocalDayBills = async () => {
        if (!mergeLocalLogs || !userId || !window.api?.getDayBills) {
            setLocalDayBills([]);
            return;
        }

        try {
            const bills = await getElectronApi().getDayBills(String(userId));
            setLocalDayBills(Array.isArray(bills) ? bills : []);
        } catch {
            setLocalDayBills([]);
        }
    };

    useEffect(() => {
        loadLocalDayBills();
    }, [mergeLocalLogs, userId, startDate, endDate]);

    useEffect(() => {
        if (!mergeLocalLogs || !userId || !navigator.onLine) return;

        void syncDayBillsToServer({ cashierId: userId })
            .then(() => refreshCashierLogs())
            .catch(() => { });
    }, [mergeLocalLogs, userId]);

    const apiLogs = cashierLogs?.data?.logs || [];
    const logs = useMemo(
        () =>
            mergeLocalLogs
                ? mergeCollectionLogs({
                    apiLogs,
                    localDayBills,
                    startDate,
                    endDate,
                })
                : apiLogs,
        [apiLogs, localDayBills, mergeLocalLogs, startDate, endDate]
    );
    const pagination = cashierLogs?.data?.pagination || {};
    const showCashierName = showCashierFilter;

    const summary = useMemo(() => {
        const closedLogs = logs.filter((log) => log.endAt);
        const openLogs = logs.filter((log) => !log.endAt);

        const totalStartCash = logs.reduce((sum, log) => sum + toNumber(log.startTotalCash), 0);
        const totalEndCash = closedLogs.reduce((sum, log) => sum + toNumber(log.endTotalCash), 0);
        const netCollection = closedLogs.reduce(
            (sum, log) => sum + toNumber(log.endTotalCash) - toNumber(log.startTotalCash),
            0
        );
        const totalAdvance = closedLogs.reduce((sum, log) => sum + toNumber(log.advanceAmount), 0);
        const totalVoucher = closedLogs.reduce((sum, log) => sum + toNumber(log.voucherAmount), 0);

        return {
            totalDays: logs.length,
            closedDays: closedLogs.length,
            openDays: openLogs.length,
            totalStartCash,
            totalEndCash,
            netCollection,
            totalAdvance,
            totalVoucher,
        };
    }, [logs]);

    const { reconciliation } = useReconciliation(
        { startDate, endDate, storeId, ...(userId && { cashierId: userId }) },
        showDaySummary
    );
    const salesTotals = reconciliation?.data?.totals;

    const summaryCards = [
        { title: "Total Days", value: summary.totalDays, color: "secondary", icon: "tabler:calendar" },
        { title: "Start Cash Total", value: priceFormat(summary.totalStartCash), color: "info", icon: "tabler:sunrise" },
        { title: "End Cash Total", value: priceFormat(summary.totalEndCash), color: "primary", icon: "tabler:sunset" },
        { title: "Net Collection", value: priceFormat(summary.netCollection), color: "success", icon: "tabler:cash" },
        { title: "Open Days", value: summary.openDays, color: "warning", icon: "tabler:clock" },
        { title: "Advance Paid", value: priceFormat(summary.totalAdvance), color: "error", icon: "tabler:arrow-up-right" },
        ...(showDaySummary
            ? [
                { title: "Orders", value: salesTotals?.noOfInvoices ?? 0, icon: "tabler:receipt" },
                { title: "Total Collection", value: priceFormat(salesTotals?.totalSales || 0), icon: "tabler:report-money" },
                { title: "Cash Collected", value: priceFormat(salesTotals?.paymentBreakdown?.cash || 0), icon: "tabler:cash-banknote" },
                { title: "UPI Collected", value: priceFormat(salesTotals?.paymentBreakdown?.upi || 0), icon: "tabler:qrcode" },
                {
                    title: "Card Collected",
                    value: priceFormat(
                        ["credit_card", "debit_card", "card"].reduce(
                            (sum, mode) => sum + Number(salesTotals?.paymentBreakdown?.[mode] || 0),
                            0
                        )
                    ),
                    icon: "tabler:credit-card",
                },
                {
                    title: "Amex / Sodexo",
                    value: priceFormat(salesTotals?.paymentBreakdown?.amex_sodexo || 0),
                    icon: "tabler:id-badge",
                },
            ]
            : []),
    ];

    const filterOptions = [
        { label: "All Cashiers", value: "" },
        ...cashierOptions,
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!logs.length) return;
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex(prev =>
                    Math.min(prev + 1, logs.length - 1)
                );
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex(prev =>
                    Math.max(prev - 1, 0)
                );
            }
            if (e.key === "Enter") {
                e.preventDefault();
                setExpanded(prev =>
                    prev === activeIndex ? null : activeIndex
                );
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [logs, activeIndex]);

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

                case "a":
                    e.preventDefault();
                    applyRef.current?.focus();
                    break;

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <>
            <Backdrop open={isCashierLogsLoading} sx={{ zIndex: 9999, color: "#fff" }}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <div className="min-h-full">
                <div className="mb-3 md:mb-4 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <KitHeader
                            title={title}
                            subtitle={subtitle}
                            icon="tabler:cash"
                            count={pagination.totalItems ?? 0}
                            countLabel="records"
                        />

                        <div className="flex flex-wrap items-center gap-2">
                            {showHomeButton && (
                                <div className="relative">
                                    <ShortcutBadge shortcut="Alt + B" />
                                    <KitButton
                                        ref={posRef}
                                        size="small"
                                        variant="outlined"
                                        className="w-auto"
                                        startIcon={<KitIcon icon="tabler:arrow-left" />}
                                        onClick={() => navigate(homePath)}
                                    >
                                        POS
                                    </KitButton>
                                </div>
                            )}
                        </div>
                    </div>

                    <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl">
                        <div className="grid grid-cols-2 items-end gap-x-2 gap-y-3 md:flex md:flex-wrap md:gap-y-7">
                            {showCashierFilter && (
                                <div className="relative w-full min-w-0 md:w-56">
                                    <ShortcutBadge shortcut="Alt + C" className="top-0 hidden md:block" />
                                    <KitSelect
                                        ref={cashierRef}
                                        label="Cashier"
                                        placeholder="All Cashiers"
                                        size="small"
                                        placeholderFontSize={14}
                                        inputFontSize={14}
                                        options={filterOptions}
                                        isDisabled={isCashierOptionsLoading}
                                        value={
                                            filterOptions.find(
                                                (option) => String(option.value) === String(selectedCashierId)
                                            ) ?? filterOptions[0]
                                        }
                                        onChange={(option) => {
                                            setPage(1);
                                            onCashierChange?.(option?.value ?? "");
                                        }}
                                    />
                                </div>
                            )}
                            <div className="relative">
                                <ShortcutBadge shortcut="Alt + S" className="top-0 hidden md:block" />
                                <KitTextField
                                    inputRef={startDateRef}
                                    size="small"
                                    height="32px"
                                    type="date"
                                    label="Start Date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setPage(1);
                                        setStartDate(e.target.value);
                                    }}
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
                                    onChange={(e) => {
                                        setPage(1);
                                        setEndDate(e.target.value);
                                    }}
                                    className="w-full md:w-44"
                                />
                            </div>
                        </div>
                    </Paper>
                </div>

                <Grid container spacing={{ xs: 1, md: 2 }} className="mb-3 md:mb-4">
                    {summaryCards.map((card) => (
                        <Grid size={{ xs: 6, sm: 6, md: 4, lg: 2 }} key={card.title}>
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

                <Paper elevation={0} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b flex items-center gap-3">
                        <Typography className="font-semibold!">Day-wise Collection Logs</Typography>
                        <Typography className="text-sm! text-third-500">
                            {pagination.totalItems ?? logs.length} record(s)
                        </Typography>
                    </div>

                    {!logs.length && !isCashierLogsLoading ? (
                        <div className="p-8 text-center text-third-500">
                            No collection logs found for selected dates.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {logs.map((log, index) => {
                                const isOpen = !log.endAt;
                                const netCash = toNumber(log.endTotalCash) - toNumber(log.startTotalCash);
                                const cashierLabel = showCashierName ? getCashierLabel(log, cashierNameMap) : null;

                                return (
                                    <Accordion
                                        key={log.id}
                                        disableGutters
                                        elevation={0}
                                        expanded={expanded === index}
                                        onChange={() => {
                                            setActiveIndex(index);
                                            setExpanded(expanded === index ? null : index);
                                        }}
                                        sx={{
                                            "&:before": { display: "none" },
                                            backgroundColor:
                                                activeIndex === index
                                                    ? "var(--mui-palette-customColors-activeBackground)"
                                                    : "transparent",
                                            transition: ".2s",
                                        }}
                                    >
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 w-full pr-2">
                                                <Typography className="font-semibold! min-w-27.5">
                                                    {format(new Date(log.date), "dd MMM yyyy")}
                                                </Typography>
                                                {cashierLabel && (
                                                    <Chip
                                                        size="small"
                                                        label={cashierLabel}
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                )}
                                                {log.source === "local" && (
                                                    <Chip size="small" label="Local" color="info" variant="outlined" />
                                                )}
                                                <Chip
                                                    size="small"
                                                    label={isOpen ? "Day Open" : "Day Closed"}
                                                    color={isOpen ? "warning" : "success"}
                                                    variant="outlined"
                                                />
                                                <Typography className="text-sm! text-third-500">
                                                    Start: {priceFormat(log.startTotalCash)} → End:{" "}
                                                    {priceFormat(log.endTotalCash)}
                                                </Typography>
                                                {!isOpen && (
                                                    <Chip
                                                        size="small"
                                                        label={`Net ${priceFormat(netCash)}`}
                                                        color={netCash >= 0 ? "success" : "error"}
                                                    />
                                                )}
                                            </div>
                                        </AccordionSummary>
                                        <AccordionDetails className="bg-third-reverse">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 md:mb-4">
                                                <Paper elevation={0} className="p-3 border rounded-lg">
                                                    <Typography className="font-semibold! mb-2">Start Day</Typography>
                                                    <div className="text-sm space-y-1">
                                                        <div>Time: {formatDateTime(log.startAt)}</div>
                                                        <div>Cash: {priceFormat(log.startTotalCash)}</div>
                                                        <div>Notes: {log.startTotalNotes ?? 0}</div>
                                                        {/* {(log.advanceCount || log.advanceAmount) && (
                                                            <div>
                                                                Advances: {log.advanceCount ?? 0} (
                                                                {priceFormat(log.advanceAmount)})
                                                            </div>
                                                        )}
                                                        {(log.voucherCount || log.voucherAmount) && (
                                                            <div>
                                                                Vouchers: {log.voucherCount ?? 0} (
                                                                {priceFormat(log.voucherAmount)})
                                                            </div>
                                                        )} */}
                                                    </div>
                                                </Paper>
                                                <Paper elevation={0} className="p-3 border rounded-lg">
                                                    <Typography className="font-semibold! mb-2">End Day</Typography>
                                                    <div className="text-sm space-y-1">
                                                        <div>Time: {formatDateTime(log.endAt)}</div>
                                                        <div>Cash: {priceFormat(log.endTotalCash)}</div>
                                                        <div>Notes: {log.endTotalNotes ?? "-"}</div>
                                                        <div>
                                                            Card: {log.totalCardCount ?? 0} (
                                                            {priceFormat(log.totalCardAmount)})
                                                        </div>
                                                        <div>
                                                            UPI: {log.totalUPICount ?? 0} (
                                                            {priceFormat(log.totalUPIAmount)})
                                                        </div>
                                                        {/* <div>Card: {log.totalCardCount ?? 0} ({priceFormat(log.totalCardAmount)})</div>
                                                        <div>UPI: {log.totalUPICount ?? 0} ({priceFormat(log.totalUPIAmount)})</div>
                                                        <div>Amex / Sodexo: {log.totalSodexoCount ?? 0} ({priceFormat(log.totalSodexoAmount)})</div> */}
                                                        {log.counterId && <div>Counter ID: {log.counterId}</div>}
                                                        {log.mobileNumber && <div>Mobile: {log.mobileNumber}</div>}
                                                    </div>
                                                </Paper>
                                            </div>

                                            {(log.advanceAmount ||
                                                log.advanceCount ||
                                                log.voucherAmount ||
                                                log.voucherCount) && (
                                                <Paper elevation={0} className="p-3 border rounded-lg mb-3 md:mb-4">
                                                    <Typography className="font-semibold! mb-2">Adjustments</Typography>
                                                    <div className="text-sm space-y-1">
                                                        {log.advanceAmount && (
                                                            <div>
                                                                Advance: {priceFormat(log.advanceAmount)}{" "}
                                                                {log.givenTo ? `(Given to ${log.givenTo})` : ""}
                                                            </div>
                                                        )}
                                                        {log.voucherAmount && (
                                                            <div>
                                                                Voucher: {priceFormat(log.voucherAmount)}{" "}
                                                                {log.voucherRemark ? `- ${log.voucherRemark}` : ""}
                                                            </div>
                                                        )}
                                                    </div>
                                                </Paper>
                                            )}

                                            <div className="flex flex-col lg:flex-row gap-4">
                                                <DenominationTable
                                                    title="Start Denominations"
                                                    denominations={log.startDenominations}
                                                    totalCash={log.startTotalCash}
                                                    totalNotes={log.startTotalNotes}
                                                />
                                                <DenominationTable
                                                    title="End Denominations"
                                                    denominations={log.endDenominations}
                                                    totalCash={log.endTotalCash}
                                                    totalNotes={log.endTotalNotes}
                                                />
                                            </div>
                                        </AccordionDetails>
                                    </Accordion>
                                );
                            })}
                        </div>
                    )}

                    {(pagination.totalPages || 0) > 1 && (
                        <div className="px-4 py-3 border-t flex justify-between items-center bg-white">
                            <KitButton
                                size="small"
                                variant="outlined"
                                className="w-auto"
                                disabled={page <= 1}
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            >
                                Previous
                            </KitButton>
                            <Typography className="text-sm!">
                                Page {pagination.page || page} of {pagination.totalPages}
                            </Typography>
                            <KitButton
                                size="small"
                                variant="outlined"
                                className="w-auto"
                                disabled={page >= (pagination.totalPages || 1)}
                                onClick={() => setPage((prev) => prev + 1)}
                            >
                                Next
                            </KitButton>
                        </div>
                    )}
                </Paper>
            </div>
        </>
    );
}
