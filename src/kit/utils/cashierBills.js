export const getLoggedInCashier = (userData = {}) => ({
    id: userData?.userId ?? userData?.id ?? null,
    email: String(userData?.email || "").trim().toLowerCase(),
    name: `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim().toLowerCase(),
});

export const billBelongsToCashier = (bill, cashier) => {
    if (!cashier?.id && !cashier?.email) return false;

    if (bill?.cashierId != null && bill?.cashierId !== "") {
        return String(bill.cashierId) === String(cashier.id);
    }

    const billEmail = String(bill?.cashierEmail || "").trim().toLowerCase();
    if (billEmail && cashier.email) {
        return billEmail === cashier.email;
    }

    return false;
};

export const filterBillsForCashier = (bills = [], userData = {}) => {
    const cashier = getLoggedInCashier(userData);
    return (Array.isArray(bills) ? bills : []).filter((bill) =>
        billBelongsToCashier(bill, cashier)
    );
};
