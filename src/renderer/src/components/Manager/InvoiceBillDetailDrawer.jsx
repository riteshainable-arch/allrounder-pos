import { useEffect, useMemo, useState } from "react";
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
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import { useInvoiceBillDetail } from "../../../../kit/hooks/data/invoice";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import {
    formatBillPaymentsSummary,
    getPaymentModeLabel,
    normalizeBillPayments,
} from "../../../../kit/utils/billPayments";
import {
    getInvoiceItemCode,
    getInvoiceItemMrp,
    getInvoiceItemName,
    getInvoiceItemQty,
    getInvoiceItemRate,
    getInvoiceItemTotal,
    getPersonDisplayName,
    isInvoiceFreeItem,
    mergeInvoiceBillWithLocal,
    normalizeInvoiceBillResponse,
} from "../../../../kit/utils/invoiceBill";
import { paymentMethodConst } from "../../../../kit/configs/general";
import ShortcutBadge from "../Dashboard/ShortcutBadge";
import KitButton from "../../../../kit/components/KitButton/KitButton";

const formatBillDateTime = (date, createdAt) => {
    const datePart = date || (createdAt ? format(parseISO(createdAt), "yyyy-MM-dd") : "-");
    const timePart = createdAt ? format(parseISO(createdAt), "hh:mm a") : "";
    return timePart ? `${datePart}, ${timePart}` : datePart;
};

const getCustomerLabel = (customer = {}) =>
    customer.displayName || getPersonDisplayName(customer);

const SettlementSection = ({ settlement }) => {
    if (!settlement || typeof settlement !== "object") return null;

    return (
        <Paper elevation={0} className="p-3 border border-gray-200 rounded-lg">
            <Typography className="font-semibold! mb-2">Settlement</Typography>
            <div className="grid grid-cols-2 gap-2 text-sm">
                {settlement.isSettled != null && (
                    <div>
                        <span className="text-third-500">Status: </span>
                        {settlement.isSettled ? "Settled" : "Unsettled"}
                    </div>
                )}
                {settlement.settledAt && (
                    <div>
                        <span className="text-third-500">Settled At: </span>
                        {formatBillDateTime(null, settlement.settledAt)}
                    </div>
                )}
                {settlement.receivedAmount != null && (
                    <div>
                        <span className="text-third-500">Received: </span>
                        {priceFormat(settlement.receivedAmount)}
                    </div>
                )}
                {settlement.settledBy?.displayName && (
                    <div>
                        <span className="text-third-500">Settled By: </span>
                        {settlement.settledBy.displayName}
                    </div>
                )}
            </div>
        </Paper>
    );
};

export default function InvoiceBillDetailDrawer({ invoiceNo, open, onClose, listRow = null, onReprint }) {
    const { invoiceBillDetail, isInvoiceBillDetailLoading } = useInvoiceBillDetail(
        invoiceNo,
        open && Boolean(invoiceNo)
    );
    const [localBill, setLocalBill] = useState(null);

    useEffect(() => {
        if (!open || !invoiceNo) {
            setLocalBill(null);
            return;
        }

        let cancelled = false;

        const loadLocalBill = async () => {
            if (!window.api?.getBills) return;

            try {
                const bills = await window.api.getBills();
                const match = bills.find(
                    (bill) =>
                        bill.billNumber === invoiceNo ||
                        bill.invoiceNo === invoiceNo
                );

                if (!cancelled && match) {
                    setLocalBill(match);
                }
            } catch {
                if (!cancelled) {
                    setLocalBill(null);
                }
            }
        };

        loadLocalBill();

        return () => {
            cancelled = true;
        };
    }, [open, invoiceNo]);

    const bill = useMemo(() => {
        const apiBill = normalizeInvoiceBillResponse(invoiceBillDetail);
        const merged = mergeInvoiceBillWithLocal(apiBill, localBill);

        if (listRow && !merged.items?.length) {
            return mergeInvoiceBillWithLocal(merged, listRow);
        }

        return merged;
    }, [invoiceBillDetail, listRow, localBill]);

    const items = bill.items || [];
    const payments = normalizeBillPayments(bill);
    const settlement = bill.settlement;

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
                            {invoiceNo || "Bill Detail"}
                        </Typography>
                        <Typography className="text-sm! text-third-500">
                            {formatBillDateTime(bill.date, bill.createdAt)}
                        </Typography>
                    </div>
                    <IconButton onClick={onClose} size="small" aria-label="Close">
                        <KitIcon icon="tabler:x" />
                    </IconButton>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    {isInvoiceBillDetailLoading ? (
                        <div className="flex justify-center py-12">
                            <CircularProgress size={32} />
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-wrap gap-2">
                                <Chip
                                    size="small"
                                    label={bill.isReturnBill ? "Return" : "Sale"}
                                    color={bill.isReturnBill ? "warning" : "primary"}
                                    variant="outlined"
                                />
                                <Chip
                                    size="small"
                                    label={bill.isSettled ? "Settled" : "Unsettled"}
                                    color={bill.isSettled ? "success" : "error"}
                                    variant="outlined"
                                />
                                {bill.paymentMethod && (
                                    <Chip
                                        size="small"
                                        label={getPaymentModeLabel(bill.paymentMethod)}
                                        variant="outlined"
                                    />
                                )}
                            </div>

                            <Paper elevation={0} className="p-3 border border-gray-200 rounded-lg">
                                <Typography className="font-semibold! mb-2">Customer</Typography>
                                <Typography className="text-sm!">{getCustomerLabel(bill.customer)}</Typography>
                                <Typography className="text-sm! text-third-500">
                                    {bill.customer?.phone || "-"}
                                </Typography>
                            </Paper>

                            <Paper elevation={0} className="p-3 border border-gray-200 rounded-lg">
                                <Typography className="font-semibold! mb-2">Cashier</Typography>
                                <Typography className="text-sm!">
                                    {getPersonDisplayName(bill.createdBy)}
                                </Typography>
                                {bill.createdBy?.role && (
                                    <Typography className="text-sm! text-third-500 capitalize">
                                        {bill.createdBy.role}
                                    </Typography>
                                )}
                            </Paper>

                            <Paper elevation={0} className="p-3 border border-gray-200 rounded-lg">
                                <Typography className="font-semibold! mb-2">Amounts</Typography>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-third-500">Total: </span>
                                        <span className="font-semibold">{priceFormat(bill.totalAmount || 0)}</span>
                                    </div>
                                    <div>
                                        <span className="text-third-500">Cash Portion: </span>
                                        {priceFormat(bill.cashPortion || 0)}
                                    </div>
                                    <div>
                                        <span className="text-third-500">Items: </span>
                                        {bill.itemCount ?? items.length}
                                        {bill.totalQty != null ? ` (${bill.totalQty} pcs)` : ""}
                                    </div>
                                    {bill.payAmount != null && (
                                        <div>
                                            <span className="text-third-500">Paid: </span>
                                            {priceFormat(bill.payAmount)}
                                        </div>
                                    )}
                                    {bill.savingAmount != null && Number(bill.savingAmount) > 0 && (
                                        <div>
                                            <span className="text-third-500">Saving: </span>
                                            {priceFormat(bill.savingAmount)}
                                        </div>
                                    )}
                                    {bill.storeId != null && (
                                        <div>
                                            <span className="text-third-500">Store: </span>
                                            {bill.storeId}
                                        </div>
                                    )}
                                </div>
                            </Paper>

                            {payments.length > 0 && (
                                <Paper elevation={0} className="p-3 border border-gray-200 rounded-lg">
                                    <Typography className="font-semibold! mb-2">Payments</Typography>
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {payments.map((payment, index) => (
                                            <Chip
                                                key={`${payment.paymentMode}-${index}`}
                                                size="small"
                                                variant="outlined"
                                                color={
                                                    payment.paymentMode === paymentMethodConst.CASH
                                                        ? "warning"
                                                        : "success"
                                                }
                                                label={`${getPaymentModeLabel(payment.paymentMode)} ${priceFormat(payment.amount)}`}
                                            />
                                        ))}
                                    </div>
                                    <Typography className="text-sm! text-third-500">
                                        {formatBillPaymentsSummary(bill)}
                                    </Typography>
                                </Paper>
                            )}

                            <SettlementSection settlement={settlement} />

                            <Divider />

                            <div>
                                <Typography className="font-semibold! mb-2">Line Items</Typography>
                                {!items.length ? (
                                    <Typography className="text-sm! text-third-500">
                                        No line items returned.
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
                                                    <TableCell align="right">Total</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {items.map((item, index) => {
                                                    const isFree = isInvoiceFreeItem(item);
                                                    const itemCode = getInvoiceItemCode(item);
                                                    const mrp = getInvoiceItemMrp(item);

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
                                                                {item.offerProduct && (
                                                                    <Typography className="text-xs! text-third-500">
                                                                        Offer: {getInvoiceItemName(item.offerProduct)}
                                                                    </Typography>
                                                                )}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                {getInvoiceItemQty(item)}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                {isFree ? (
                                                                    <div>
                                                                        <Typography className="text-sm! text-green-600!">
                                                                            Free
                                                                        </Typography>
                                                                        {mrp > 0 && (
                                                                            <Typography className="text-xs! text-third-500 line-through">
                                                                                MRP {priceFormat(mrp)}
                                                                            </Typography>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    priceFormat(getInvoiceItemRate(item))
                                                                )}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                {isFree ? (
                                                                    <Typography className="text-sm! text-green-600!">
                                                                        Free
                                                                    </Typography>
                                                                ) : (
                                                                    priceFormat(getInvoiceItemTotal(item))
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
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
                            disabled={!items.length}
                            onClick={() => onReprint?.(bill)}
                        >
                            Reprint Invoice
                        </KitButton>
                    </div>
                </div>
            </div>

            <Backdrop
                open={isInvoiceBillDetailLoading && Boolean(invoiceNo)}
                sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, color: "#fff" }}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
        </Drawer>
    );
}
