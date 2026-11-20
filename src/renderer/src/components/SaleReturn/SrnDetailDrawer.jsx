import { useEffect, useMemo } from "react";
import {
    Backdrop,
    Chip,
    CircularProgress,
    Divider,
    Drawer,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { format, parseISO } from "date-fns";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import { useSaleReturnDetail } from "../../../../kit/hooks/data/saleReturn";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import { getPaymentModeLabel } from "../../../../kit/utils/billPayments";
import {
    getInvoiceItemCode,
    getInvoiceItemName,
    getInvoiceItemQty,
    getInvoiceItemRate,
    getPersonDisplayName,
    isInvoiceFreeItem,
} from "../../../../kit/utils/invoiceBill";
import { parseSaleReturnDetailResponse } from "../../../../kit/utils/saleReturn";
import ShortcutBadge from "../Dashboard/ShortcutBadge";

const formatDateTime = (dateValue, fallbackDate) => {
    if (dateValue) {
        try {
            return format(parseISO(dateValue), "yyyy-MM-dd, hh:mm a");
        } catch {
            return format(new Date(dateValue), "yyyy-MM-dd, hh:mm a");
        }
    }
    return fallbackDate || "-";
};

const getSrnLineRefund = (item = {}) => {
    const qty = getInvoiceItemQty(item);
    const rate = getInvoiceItemRate(item);
    return Number(item.lineRefund ?? item.line_refund ?? qty * rate);
};

const InfoBlock = ({ title, children }) => (
    <Paper elevation={0} className="p-3 border border-gray-200 rounded-lg bg-transparent!">
        <Typography className="font-semibold! mb-2">{title}</Typography>
        {children}
    </Paper>
);

export default function SrnDetailDrawer({ srnNumber, open, onClose, onReprint }) {
    const { saleReturnDetail, isSaleReturnDetailLoading } = useSaleReturnDetail(
        srnNumber,
        open && Boolean(srnNumber)
    );

    const detail = useMemo(
        () => parseSaleReturnDetailResponse(saleReturnDetail),
        [saleReturnDetail]
    );

    const { adjustmentConsumptions, srn, items, refundPayment, refundPayments, originalBill } = detail;
    const refundAmount = Number(srn.refundAmount ?? refundPayment.amount ?? 0);
    const refundMode = srn.refundMode || refundPayment.paymentMode || "cash";
    const totalReturnedQty = items.reduce((sum, item) => sum + getInvoiceItemQty(item), 0);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e) => {
            if (e.shiftKey && e.key.toLowerCase() === "p") {
                e.preventDefault();

                if (detail?.srn?.srnNumber || items.length) {
                    onReprint?.(detail);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, detail, items, onReprint]);

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: { width: { xs: "100%", sm: 520, md: 640 } },
            }}
        >
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div>
                        <Typography className="text-lg! font-semibold!">
                            {srn.srnNumber || srnNumber || "Sale Return Note"}
                        </Typography>
                        <Typography className="text-sm! text-third-500">
                            {formatDateTime(srn.approvedAt || srn.initiatedAt, srn.returnDate)}
                        </Typography>
                    </div>
                    <IconButton onClick={onClose} size="small" aria-label="Close">
                        <KitIcon icon="tabler:x" />
                    </IconButton>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    {isSaleReturnDetailLoading ? (
                        <div className="flex justify-center py-12">
                            <CircularProgress size={32} />
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-wrap gap-2">
                                <Chip size="small" label="Sale Return" color="warning" variant="outlined" />
                                <Chip
                                    size="small"
                                    label={srn.status || "completed"}
                                    color="success"
                                    variant="outlined"
                                    className="capitalize!"
                                />
                                <Chip
                                    size="small"
                                    label={`Refund ${getPaymentModeLabel(refundMode)}`}
                                    variant="outlined"
                                />
                            </div>

                            <InfoBlock title="Original Invoice">
                                <Typography className="text-sm! font-medium!">
                                    {srn.originalInvoiceNo || originalBill.invoiceNo || "-"}
                                </Typography>
                                <Typography className="text-sm! text-third-500">
                                    Date: {srn.originalInvoiceDate || originalBill.date || "-"}
                                </Typography>
                                {originalBill.totalAmount != null && (
                                    <Typography className="text-sm! text-third-500">
                                        Bill total: {priceFormat(originalBill.totalAmount)}
                                        {originalBill.totalItems != null
                                            ? ` · ${originalBill.totalItems} item(s)`
                                            : ""}
                                    </Typography>
                                )}
                            </InfoBlock>

                            <InfoBlock title="Customer">
                                <Typography className="text-sm!">
                                    {getPersonDisplayName(srn.customer)}
                                </Typography>
                                <Typography className="text-sm! text-third-500">
                                    {srn.customer?.phone || "-"}
                                </Typography>
                            </InfoBlock>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <InfoBlock title="Cashier">
                                    <Typography className="text-sm!">
                                        {getPersonDisplayName(srn.cashier)}
                                    </Typography>
                                </InfoBlock>
                                <InfoBlock title="Approved By">
                                    <Typography className="text-sm!">
                                        {getPersonDisplayName(srn.approvedBy || srn.initiatedBy)}
                                    </Typography>
                                </InfoBlock>
                            </div>

                            <Paper elevation={0} className="p-3 border border-orange-200 bg-third-50! rounded-lg">
                                <Typography className="font-semibold! mb-2">Refund Summary</Typography>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-third-500">Refund amount: </span>
                                        <span className="font-bold text-green-700">
                                            {priceFormat(refundAmount)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-third-500">Mode: </span>
                                        {getPaymentModeLabel(refundMode)}
                                    </div>
                                    <div>
                                        <span className="text-third-500">Returned items: </span>
                                        {items.length} ({totalReturnedQty} pcs)
                                    </div>
                                    {srn.returnInvoiceNo && (
                                        <div>
                                            <span className="text-third-500">Return invoice: </span>
                                            {srn.returnInvoiceNo}
                                        </div>
                                    )}
                                </div>
                                {(refundPayments.length > 0 || refundPayment.amount) && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {(refundPayments.length ? refundPayments : [refundPayment]).map(
                                            (payment, index) => (
                                                <Chip
                                                    key={index}
                                                    size="small"
                                                    variant="outlined"
                                                    color="warning"
                                                    label={`${getPaymentModeLabel(payment.paymentMode || refundMode)} ${priceFormat(payment.amount ?? refundAmount)}`}
                                                />
                                            )
                                        )}
                                    </div>
                                )}
                            </Paper>

                            {srn.notes && (
                                <InfoBlock title="Notes">
                                    <Typography className="text-sm! text-third-800">{srn.notes}</Typography>
                                </InfoBlock>
                            )}

                            {adjustmentConsumptions?.length > 0 &&
                                <>
                                    <Divider />
                                    <div>
                                        <Typography className="font-semibold! mb-2">
                                            Adjustment Items ({adjustmentConsumptions?.length})
                                        </Typography>
                                        {
                                            adjustmentConsumptions?.length > 0 && (
                                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell>#</TableCell>
                                                                <TableCell>Invoice No</TableCell>
                                                                <TableCell>Date</TableCell>
                                                                <TableCell align="right">Amount Used</TableCell>
                                                            </TableRow>
                                                        </TableHead>

                                                        <TableBody>
                                                            {adjustmentConsumptions?.map((item, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell>{index + 1}</TableCell>
                                                                    <TableCell>{item.invoiceNo}</TableCell>
                                                                    <TableCell>{item.date}</TableCell>
                                                                    <TableCell align="right">
                                                                        {priceFormat(item.amountUsed)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            )
                                        }
                                    </div>
                                </>
                            }

                            <Divider />

                            <div>
                                <Typography className="font-semibold! mb-2">
                                    Returned Items ({items.length})
                                </Typography>
                                {!items.length ? (
                                    <Typography className="text-sm! text-third-500">
                                        No returned items found.
                                    </Typography>
                                ) : (
                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>#</TableCell>
                                                    <TableCell>Item</TableCell>
                                                    <TableCell align="right">Qty</TableCell>
                                                    <TableCell align="right">Rate</TableCell>
                                                    <TableCell align="right">Refund</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {items.map((item, index) => {
                                                    const isFree = isInvoiceFreeItem(item);
                                                    const itemCode = getInvoiceItemCode(item);
                                                    const lineRefund = getSrnLineRefund(item);

                                                    return (
                                                        <TableRow key={item.id ?? index}>
                                                            <TableCell>{index + 1}</TableCell>
                                                            <TableCell>
                                                                <div>{getInvoiceItemName(item)}</div>
                                                                {itemCode && (
                                                                    <Typography className="text-xs! text-third-500">
                                                                        {itemCode}
                                                                    </Typography>
                                                                )}
                                                                {isFree && (
                                                                    <Chip
                                                                        size="small"
                                                                        label="Free (Offer)"
                                                                        color="success"
                                                                        variant="outlined"
                                                                        className="mt-1!"
                                                                    />
                                                                )}
                                                                {(item.offerName || item.offer_name) && (
                                                                    <Typography className="text-xs! text-third-500">
                                                                        Offer: {item.offerName || item.offer_name}
                                                                    </Typography>
                                                                )}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                {getInvoiceItemQty(item)}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                {isFree ? (
                                                                    <Typography className="text-sm! text-green-600!">
                                                                        Free
                                                                    </Typography>
                                                                ) : (
                                                                    priceFormat(getInvoiceItemRate(item))
                                                                )}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                {priceFormat(lineRefund)}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                <div className="flex justify-end mt-3 pt-3 border-t border-gray-200">
                                    <Typography className="text-base! font-bold!">
                                        Total Refund: {priceFormat(refundAmount)}
                                    </Typography>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="p-4 pt-6 border-t flex justify-end gap-2">
                    <KitButton variant="outlined" size="small" className="w-auto" onClick={onClose}>
                        Close
                    </KitButton>
                    <div className="relative">
                        <ShortcutBadge shortcut="Shift + P" className="-top-5" />
                        <KitButton
                            size="small"
                            variant="contained"
                            className="w-auto"
                            disabled={!detail.srn?.srnNumber && !items.length}
                            onClick={() => onReprint?.(detail)}
                        >
                            Reprint SRN
                        </KitButton>
                    </div>
                </div>
            </div>

            <Backdrop
                open={isSaleReturnDetailLoading && Boolean(srnNumber)}
                sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, color: "#fff" }}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
        </Drawer>
    );
}
