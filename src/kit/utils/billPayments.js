import { checkoutPaymentOptions, paymentMethodConst } from "../configs/general";
import { priceFormat } from "./priceFormat";

const paymentModeLabels = checkoutPaymentOptions.reduce((acc, option) => {
    acc[option.value] = option.label;
    return acc;
}, {
    [paymentMethodConst.ONLINE]: "Online",
    [paymentMethodConst.MIXED]: "Mixed",
    loyalty: "Loyalty",
    srn_adjustment: "SRN Adjustment",
});

export const getPaymentModeLabel = (mode = "") =>
    paymentModeLabels[mode] || mode?.replace(/_/g, " ")?.replace(/\b\w/g, (char) => char.toUpperCase());

export const dedupeBillPayments = (payments = []) => {
    const seen = new Set();

    return payments.filter((payment) => {
        const key = `${payment.paymentMode}|${payment.srnNumber || ""}|${Number(payment.amount || 0)}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
};

export const normalizeBillPayments = (bill = {}) => {
    let payments = [];

    if (Array.isArray(bill.payments) && bill.payments.length > 0) {
        payments = bill.payments
            .filter((payment) => Number(payment?.amount || 0) > 0)
            .map((payment) => ({
                ...payment,
                paymentMode: payment.paymentMode || payment.mode,
                amount: Number(payment.amount),
            }));
    } else if (Array.isArray(bill.billPayments) && bill.billPayments.length > 0) {
        payments = bill.billPayments
            .filter((payment) => Number(payment?.amount || 0) > 0)
            .map((payment) => ({
                ...payment,
                paymentMode: payment.paymentMode || payment.mode,
                amount: Number(payment.amount),
            }));
    } else if (bill.paymentMethod && Number(bill.payAmount || 0) > 0) {
        payments = [{
            paymentMode: bill.paymentMethod,
            amount: Number(bill.payAmount),
        }];
    }

    return dedupeBillPayments(payments);
};

export const formatBillPaymentsSummary = (bill = {}) => {
    const payments = normalizeBillPayments(bill);

    if (!payments.length) return "-";

    return payments
        .map((payment) => `${getPaymentModeLabel(payment.paymentMode)} ${priceFormat(payment.amount)}`)
        .join(", ");
};

export const formatBillForUpload = (bill = {}) => {
    const billPayments = normalizeBillPayments(bill);

    const {
        id,
        createdAt,
        ...billData
    } = bill;

    return {
        ...billData,
        paymentMethod: bill.paymentMethod || billPayments[0]?.paymentMode || paymentMethodConst.CASH,
        billPayments,
        payments: billPayments.map((payment) => ({
            mode: payment.paymentMode,
            amount: payment.amount,
            ...(payment.srnNumber && {
                srnNumber: payment.srnNumber,
            }),
        })),
        totalReceived: bill.totalReceived ?? billPayments.reduce((sum, payment) => sum + payment.amount, 0),
        netPayable: bill.netPayable ?? bill.payAmount ?? 0,
        remainingAmount: bill.remainingAmount ?? 0,
        balanceToReturn: bill.balanceToReturn ?? 0,
        isCreditSale: Boolean(bill.isCreditSale),
        ...(Number(bill.loyaltyRedeem ?? bill.loyaltyRedeemPoints ?? 0) > 0 && {
            loyaltyRedeem: Number(bill.loyaltyRedeem ?? bill.loyaltyRedeemPoints),
        }),
    };
};

export const formatBillsForUpload = (bills = []) => bills.map((bill) => formatBillForUpload(bill));

export const billHasCashPayment = (bill = {}) =>
    normalizeBillPayments(bill).some(
        (payment) => payment.paymentMode === paymentMethodConst.CASH
    ) || bill.paymentMethod === paymentMethodConst.CASH;
