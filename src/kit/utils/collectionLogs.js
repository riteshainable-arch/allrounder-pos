import { format } from "date-fns";

const toNumber = (value) => Number(value || 0);

export const getLogDateKey = (log = {}) => {
    if (log.date) return log.date;

    const timestamp = log.startAt || log.createdAt || log.sessionDate;
    if (!timestamp) return null;

    try {
        return format(new Date(timestamp), "yyyy-MM-dd");
    } catch {
        return null;
    }
};

export const localDayBillToCollectionLog = (bill = {}) => {
    const end = bill.end ?? {};
    const endSummary = end.submittedSummary ?? end.counterSummary ?? end;
    const advances = end.advances ?? {};
    const voucher = end.voucher ?? {};
    const cardPayment = end.totalCardPayment ?? {};
    const upiPayment = end.totalUpiPayment ?? {};

    return {
        id: `local-${bill.userId}-${bill.date}`,
        date: bill.date,
        userId: bill.userId,
        userName: bill.userName,
        counterId: bill.counterId,
        mobileNumber: bill.mobileNumber,
        startAt: bill.start?.date ?? null,
        endAt: end.date ?? null,
        startTotalCash: toNumber(bill.start?.totalCash),
        endTotalCash: toNumber(endSummary.totalCash),
        startTotalNotes: toNumber(bill.start?.totalNotes),
        endTotalNotes: toNumber(endSummary.totalNotes),
        startDenominations: bill.start?.denominations ?? [],
        endDenominations: endSummary.denominations ?? [],
        advanceCount: toNumber(bill.start?.advanceCount ?? advances.count ?? end.advanceCount),
        advanceAmount: toNumber(bill.start?.advanceAmount ?? advances.amount ?? end.advanceAmount),
        voucherCount: toNumber(bill.start?.voucherCount ?? voucher.count ?? end.voucherCount),
        voucherAmount: toNumber(bill.start?.voucherAmount ?? voucher.amount ?? end.voucherAmount),
        givenTo: bill.start?.givenTo ?? end.givenTo ?? "",
        voucherRemark: bill.start?.voucherRemark ?? voucher.remark ?? end.voucherRemark ?? "",
        totalCardAmount: toNumber(cardPayment.amount ?? end.totalCardAmount),
        totalCardCount: toNumber(cardPayment.count ?? end.totalCardCount),
        totalUPIAmount: toNumber(upiPayment.amount ?? end.totalUPIAmount),
        totalUPICount: toNumber(upiPayment.count ?? end.totalUPICount),
        totalSodexoAmount: toNumber(end.totalSodexoPayment?.amount),
        totalSodexoCount: toNumber(end.totalSodexoPayment?.count),
        source: "local",
    };
};

export const mergeCollectionLogs = ({
    apiLogs = [],
    localDayBills = [],
    startDate,
    endDate,
}) => {
    const mergedByDate = new Map();

    apiLogs.forEach((log) => {
        const dateKey = getLogDateKey(log);
        if (!dateKey) return;
        if (startDate && dateKey < startDate) return;
        if (endDate && dateKey > endDate) return;
        mergedByDate.set(dateKey, { ...log, source: log.source || "server" });
    });

    localDayBills.forEach((bill) => {
        const dateKey = bill.date;
        if (!dateKey) return;
        if (startDate && dateKey < startDate) return;
        if (endDate && dateKey > endDate) return;
        if (mergedByDate.has(dateKey)) return;

        mergedByDate.set(dateKey, localDayBillToCollectionLog(bill));
    });

    return Array.from(mergedByDate.values()).sort((left, right) => {
        const leftDate = getLogDateKey(left) || "";
        const rightDate = getLogDateKey(right) || "";
        return rightDate.localeCompare(leftDate);
    });
};
