import { normalizeBillPayments } from "./billPayments";

const toNumber = (value) => Number(value || 0);
const round2 = (value) => Math.round(toNumber(value) * 100) / 100;

const ENTRY_MODE_GROUPS = {
    cash: "cash",
    credit_card: "card",
    debit_card: "card",
    card: "card",
    upi: "upi",
    amex_sodexo: "sodexo",
};

/** Cash / Card / UPI / Amex totals for one day from local bills (count = sale bills using that mode, amount = net of returns). */
export const localPaymentTotals = (bills = [], date) => {
    const totals = {
        orders: 0,
        cash: { count: 0, amount: 0 },
        card: { count: 0, amount: 0 },
        upi: { count: 0, amount: 0 },
        sodexo: { count: 0, amount: 0 },
    };
    for (const bill of bills) {
        if (String(bill?.date || "").slice(0, 10) !== date) continue;
        if (!bill.isReturnBill) totals.orders += 1;
        const counted = new Set();
        for (const payment of normalizeBillPayments(bill)) {
            const group = ENTRY_MODE_GROUPS[String(payment.paymentMode || "").toLowerCase()];
            if (!group) continue;
            const value = group === "cash" ? payment.amount - toNumber(bill.balanceToReturn) : payment.amount;
            totals[group].amount += bill.isReturnBill ? -value : value;
            if (!bill.isReturnBill && !counted.has(group)) {
                totals[group].count += 1;
                counted.add(group);
            }
        }
    }
    ["cash", "card", "upi", "sodexo"].forEach((group) => (totals[group].amount = round2(totals[group].amount)));
    return totals;
};

const positiveInt = (value) => {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : undefined;
};

/**
 * Query for GET admin/collections/day-end scoped to one cashier.
 * The server only locks the `cashier` role to itself; an admin / manager running the
 * counter would otherwise get every user's payments for the day.
 */
export const dayEndParams = ({ date, cashierId }) => ({
    date,
    cashierId: positiveInt(cashierId),
});

export const denominationNotes = (denominations = []) =>
    denominations.reduce((sum, item) => sum + toNumber(item.count), 0);

/**
 * Cashier end-of-day settlement figures.
 * System totals come from GET admin/collections/day-end; cash counts are what the cashier entered.
 * Drawer check: (counter + submitted) vs (opening + cash sales − advances − vouchers).
 */
export const buildSettlementSummary = ({
    dayEnd = {},
    openingCash = 0,
    counter = {},
    submitted = {},
    advanceAmount = 0,
    advanceCount = 0,
    voucherAmount = 0,
    voucherCount = 0,
    cardEntered = 0,
    upiEntered = 0,
    sodexoEntered = 0,
}) => {
    const saleReturn = round2(dayEnd.refunds?.total);
    const totalAmount = round2(dayEnd.totalBillValue);
    // dayEnd.cash / card / upi / sodexo are net of return refunds; the slip shows sales and the return on its own line.
    const cash = round2(dayEnd.cash);
    const cashRefund = round2(dayEnd.refunds?.cash);

    const expectedCash = round2(toNumber(openingCash) + cash - toNumber(advanceAmount) - toNumber(voucherAmount));
    const actualCash = round2(toNumber(counter.totalCash) + toNumber(submitted.totalCash));
    const difference = round2(actualCash - expectedCash);

    return {
        totalBills: toNumber(dayEnd.totalOrders),
        returnBills: toNumber(dayEnd.returnOrders),
        cash,
        cashRefund,
        cashSale: round2(cash + cashRefund),
        cardSale: round2(toNumber(dayEnd.card) + toNumber(dayEnd.refunds?.card)),
        upiSale: round2(toNumber(dayEnd.upi) + toNumber(dayEnd.refunds?.upi)),
        sodexoSale: round2(toNumber(dayEnd.sodexo) + toNumber(dayEnd.refunds?.sodexo)),
        otherSale: round2(toNumber(dayEnd.other) + toNumber(dayEnd.refunds?.other)),
        card: round2(dayEnd.card),
        cardEntered: round2(cardEntered),
        upi: round2(dayEnd.upi),
        upiEntered: round2(upiEntered),
        sodexo: round2(dayEnd.sodexo),
        sodexoEntered: round2(sodexoEntered),
        other: round2(dayEnd.other),
        loyalty: round2(dayEnd.loyalty),
        coupon: round2(dayEnd.coupon),
        srnAdjustment: round2(dayEnd.srnAdjustment),
        billAmount: round2(totalAmount + saleReturn),
        saleReturn,
        totalAmount,
        totalCollection: round2(dayEnd.totalCollection),
        openingCash: round2(openingCash),
        counterCash: round2(counter.totalCash),
        submittedCash: round2(submitted.totalCash),
        advanceAmount: round2(advanceAmount),
        advanceCount: toNumber(advanceCount),
        voucherAmount: round2(voucherAmount),
        voucherCount: toNumber(voucherCount),
        expectedCash,
        actualCash,
        shortage: difference < 0 ? -difference : 0,
        excess: difference > 0 ? difference : 0,
    };
};

/** Slip data from a saved local day bill (start + end), so the slip can be printed again after closing. */
export const buildSlipFromDayBill = (dayBill = {}, userData = {}) => {
    const start = dayBill.start || {};
    const end = dayBill.end || {};
    const counter = end.counterSummary || {};
    const submitted = end.submittedSummary || {};
    return {
        date: dayBill.date,
        endAt: end.date,
        userId: dayBill.userId,
        cashierName: dayBill.userName || dayBill.cashier || "",
        userName: userData?.email || userData?.userName || "",
        mobile: dayBill.mobileNumber || userData?.phone || userData?.mobile || userData?.mobileNumber || "",
        gstNumber: userData?.gstNumber || "",
        counterId: dayBill.counterId,
        givenTo: [start.givenTo, end.givenTo].filter(Boolean).join(", "),
        voucherRemark: [start.voucherRemark, end.voucher?.remark].filter(Boolean).join(", "),
        counterDenominations: counter.denominations || [],
        submittedDenominations: submitted.denominations || [],
        inputs: {
            openingCash: toNumber(start.totalCash),
            counter: { totalCash: toNumber(counter.totalCash) },
            submitted: { totalCash: toNumber(submitted.totalCash) },
            advanceAmount: toNumber(start.advanceAmount) + toNumber(end.advances?.amount),
            advanceCount: toNumber(start.advanceCount) + toNumber(end.advances?.count),
            voucherAmount: toNumber(start.voucherAmount) + toNumber(end.voucher?.amount),
            voucherCount: toNumber(start.voucherCount) + toNumber(end.voucher?.count),
            cardEntered: toNumber(end.totalCardPayment?.amount),
            upiEntered: toNumber(end.totalUpiPayment?.amount),
            sodexoEntered: toNumber(end.totalSodexoPayment?.amount),
        },
    };
};

export const denominationRows = (denominations = []) =>
    denominations
        .map((item) => ({
            denomination: toNumber(item.denomination),
            count: toNumber(item.count),
            value: round2(toNumber(item.denomination) * toNumber(item.count)),
        }));
