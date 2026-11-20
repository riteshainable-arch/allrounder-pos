import { priceFormat } from "./priceFormat";

export const formatPaymentModeLabel = (mode = "") => {
    const normalized = String(mode || "")
        .trim()
        .toLowerCase();
    const labels = {
        cash: "Cash",
        online: "Online",
        sodexo: "Sodexo",
        amex_sodexo: "Amex / Sodexo",
        upi: "UPI",
        voucher: "Voucher",
        credit_card: "Credit Card",
        debit_card: "Debit Card",
        wallet: "Wallet",
        gift_voucher: "Gift Voucher",
        credit_sale: "Credit Sale",
    };

    if (labels[normalized]) return labels[normalized];

    return normalized
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
};

/** POS checkout modes, always shown in reports even when nothing was collected. */
export const BASE_PAYMENT_MODES = ["cash", "upi", "credit_card", "amex_sodexo"];

export const withBasePaymentModes = (modes = []) => [
    ...BASE_PAYMENT_MODES,
    ...modes.filter((mode) => !BASE_PAYMENT_MODES.includes(mode)),
];

export const getSettlementStatusColor = (status = "") => {
    switch (String(status || "").toUpperCase()) {
        case "OK":
            return "success";
        case "EXCESS":
            return "warning";
        case "SHORT":
            return "error";
        case "NA":
            return "default";
        case "PENDING":
        default:
            return "default";
    }
};

export const getExpectedCash = (row = {}) => Number(row.expectedCash ?? 0);

export const getAlreadyReceived = (row = {}) => Number(row.alreadyReceived ?? row.amountReceived ?? 0);

export const getRemainingCash = (row = {}) => Number(row.remainingCash ?? row.idealCash ?? 0);

export const getIdealCashTooltip = (row = {}) => {
    const expectedCash = getExpectedCash(row);
    const alreadyReceived = getAlreadyReceived(row);
    const remainingCash = getRemainingCash(row);

    return `Expected ${priceFormat(expectedCash)} − Already received ${priceFormat(alreadyReceived)} = ${priceFormat(remainingCash)} still owed`;
};

export const computeDraftDifference = (draftReceived = 0, idealCash = 0) =>
    Number(draftReceived || 0) - Number(idealCash || 0);

export const computeDraftStatus = (draftReceived = 0, idealCash = 0, apiStatus = "PENDING") => {
    const api = String(apiStatus || "").toUpperCase();

    if (api === "NA") return "NA";

    const draft = Number(draftReceived || 0);
    const remaining = Number(idealCash || 0);

    if (draft <= 0 && remaining > 0) return "PENDING";

    if (remaining <= 0 && draft <= 0) return "OK";

    const difference = computeDraftDifference(draft, remaining);
    if (Math.abs(difference) < 0.01) return "OK";
    if (difference > 0) return "EXCESS";
    return "SHORT";
};

export const getDefaultReceivedAmount = (row = {}) => {
    const status = String(row.status || "").toUpperCase();

    if (status === "NA") return 0;

    return getRemainingCash(row);
};

export const canSettleRow = (row = {}, draftReceived = 0) => {
    const status = String(row.status || "").toUpperCase();
    return status !== "NA" && Number(draftReceived || 0) > 0;
};
