export const roundToDecimals = (value, digits = 2) => {
    const factor = Math.pow(10, digits);

    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
};

/** Nearest whole rupee — used for cash/UPI collection (no paise). */
export const roundToWholeRupee = (value) => roundToDecimals(value, 0);

export const sanitizeWholeRupeeInput = (raw) => {
    if (raw === "" || raw === null || raw === undefined) return "";
    const digits = String(raw).replace(/\D/g, "");
    if (digits === "") return "";
    return Math.max(0, parseInt(digits, 10));
};

export const priceFinalAmountFormat = (value, options = {}) => {
    if (value === null || value === undefined || isNaN(Number(value))) {
        return "₹0/-";
    }

    const {
        locale = "en-IN",
        currency = true,
    } = options;

    const formattedValue = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        ...(currency && {
            style: "currency",
            currency: "INR",
        }),
    }).format(roundToDecimals(Number(value), 0));

    return `${formattedValue}/-`;
};

export const priceFormat = (value, options = {}) => {

    if (value === null || value === undefined || isNaN(Number(value))) {
        return "₹0.00/-";
    }

    const {
        locale = "en-IN",
        currency = true,
        minimumFractionDigits = 2,
        maximumFractionDigits = 2,
    } = options;

    const finalValue = roundToDecimals(Number(value), maximumFractionDigits);

    const formattedValue = new Intl.NumberFormat(locale, {
        minimumFractionDigits,
        maximumFractionDigits,
        ...(currency && {
            style: "currency",
            currency: "INR",
        }),
    }).format(finalValue);

    return `${formattedValue}/-`;
};