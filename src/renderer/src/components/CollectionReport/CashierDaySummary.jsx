import { Chip, CircularProgress, Paper, Typography } from "@mui/material";
import { useReconciliation } from "../../../../kit/hooks/data/settlement";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import {
    BASE_PAYMENT_MODES,
    formatPaymentModeLabel,
    getSettlementStatusColor,
    withBasePaymentModes,
} from "../../../../kit/utils/settlement";

const Stat = ({ label, value, className = "" }) => (
    <div className="min-w-[120px]">
        <Typography className="text-xs! text-third-500">{label}</Typography>
        <Typography className={`text-sm! font-semibold! ${className}`}>{value}</Typography>
    </div>
);

/** One cashier's bills and collection for one day (manager / admin only: reconciliation API). */
export default function CashierDaySummary({ cashierId, date, storeId }) {
    const day = String(date || "").slice(0, 10);
    const { reconciliation, isReconciliationLoading, reconciliationError } = useReconciliation(
        { startDate: day, endDate: day, storeId, cashierId },
        Boolean(cashierId && day)
    );

    const row = (reconciliation?.data?.rows || []).find((r) => String(r.userId) === String(cashierId));
    const breakdown = row?.paymentBreakdown || {};
    const modes = withBasePaymentModes(Object.keys(breakdown))
        .map((mode) => [mode, Number(breakdown[mode] || 0)])
        .filter(([mode, amount]) => BASE_PAYMENT_MODES.includes(mode) || amount !== 0);

    return (
        <Paper elevation={0} className="p-3 border rounded-lg mb-4">
            <div className="flex items-center gap-2 mb-2">
                <Typography className="font-semibold!">Day Report</Typography>
                {row?.status && (
                    <Chip
                        size="small"
                        variant="outlined"
                        label={row.status}
                        color={getSettlementStatusColor(row.status)}
                    />
                )}
                {isReconciliationLoading && <CircularProgress size={14} />}
            </div>

            {reconciliationError ? (
                <Typography className="text-sm! text-red-600!">
                    {reconciliationError?.message || "Unable to load the day report."}
                </Typography>
            ) : !row ? (
                !isReconciliationLoading && (
                    <Typography className="text-sm! text-third-500">No bills for this cashier on this day.</Typography>
                )
            ) : (
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-4">
                        <Stat label="Orders" value={row.noOfInvoices ?? 0} />
                        <Stat label="Sale Returns" value={row.noOfSaleReturns ?? 0} />
                        <Stat label="Total Collection" value={priceFormat(row.totalSales || 0)} />
                        {modes.map(([mode, amount]) => (
                            <Stat key={mode} label={formatPaymentModeLabel(mode)} value={priceFormat(amount)} />
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-4 border-t pt-3">
                        <Stat label="Advance" value={priceFormat(row.advanceAmount || 0)} />
                        <Stat label="Voucher" value={priceFormat(row.voucherAmount || 0)} />
                        <Stat label="Expected Cash" value={priceFormat(row.expectedCash || 0)} />
                        <Stat label="Already Received" value={priceFormat(row.alreadyReceived || 0)} />
                        <Stat
                            label="Remaining Cash"
                            value={priceFormat(row.idealCash || 0)}
                            className={Number(row.idealCash) > 0 ? "text-red-600!" : "text-green-600!"}
                        />
                    </div>
                </div>
            )}
        </Paper>
    );
}
