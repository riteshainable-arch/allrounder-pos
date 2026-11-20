export const generateNextIndexNo = (bills = [], cashierId) => {
    const prefix = String(cashierId).padStart(2, "0");

    const lastBill = bills
        .filter((bill) => String(bill.indexNo || "").startsWith(prefix))
        .sort((a, b) => {
            const aNo = Number(a.indexNo);
            const bNo = Number(b.indexNo);
            return bNo - aNo;
        })[0];

    const lastSequence = lastBill
        ? Number(String(lastBill.indexNo).slice(-4))
        : 0;

    const nextSequence = lastSequence + 1;

    return `${prefix}${String(nextSequence).padStart(4, "0")}`;
};