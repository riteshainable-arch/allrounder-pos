export const EXPORT_LIMIT = 100;

export const onlineTypeConst = {
    CARD: "card",
    UPI: "upi",
};

export const paymentMethodConst = {
    CASH: "cash",
    ONLINE: "online",
    UPI: "upi",
    CREDIT_CARD: "credit_card",
    DEBIT_CARD: "debit_card",
    CARD: "card",
    AMEX_SODEXO: "amex_sodexo",
    WALLET: "wallet",
    GIFT_VOUCHER: "gift_voucher",
    CREDIT_SALE: "credit_sale",
    LOYALTY: "loyalty",
    MIXED: "mixed",
};

export const checkoutPaymentOptions = [
    { label: "Cash", value: paymentMethodConst.CASH },
    { label: "UPI", value: paymentMethodConst.UPI },
    { label: "Credit Card", value: paymentMethodConst.CREDIT_CARD },
    { label: "Debit Card", value: paymentMethodConst.DEBIT_CARD },
    { label: "Amex / Sodexo", value: paymentMethodConst.AMEX_SODEXO },
    { label: "Wallet", value: paymentMethodConst.WALLET },
    { label: "Gift Voucher", value: paymentMethodConst.GIFT_VOUCHER },
    { label: "Credit Sale", value: paymentMethodConst.CREDIT_SALE },
];

export const onlineTypeOptions = [
    { label: 'Card', value: onlineTypeConst.CARD },
    { label: 'UPI', value: onlineTypeConst.UPI },
]

export const paymentTypeOptions = [
    { label: 'All', value: '' },
    { label: 'Cash', value: paymentMethodConst.CASH },
    // { label: 'Online', value: paymentMethodConst.ONLINE },
    { label: 'UPI', value: paymentMethodConst.UPI },
    // { label: 'Credit Card', value: paymentMethodConst.CREDIT_CARD },
    // { label: 'Debit Card', value: paymentMethodConst.DEBIT_CARD },
    { label: 'Card (Credit / Debit)', value: paymentMethodConst.CARD },
    { label: 'Amex / Sodexo', value: paymentMethodConst.AMEX_SODEXO },
    { label: 'Wallet', value: paymentMethodConst.WALLET },
    // { label: 'Gift Voucher', value: paymentMethodConst.GIFT_VOUCHER },
    // { label: 'Credit Sale', value: paymentMethodConst.CREDIT_SALE },
    // { label: 'Mixed', value: paymentMethodConst.MIXED },
]

export const offerTypes = {
    BUY_X_GET_Y: "Buy X Get Y",
    BUY_X_GET_Y_CHOICE: "Buy X Get Y Choice",
    FOC_WITH_OFFER_PRICE: "FOC with Offer Price",
    COMBO: "Combo Price",
    DISCOUNT: "Discount",
};

export const denominations = [
    // 2000,
    500,
    200,
    100,
    50,
    20,
    10,
    5,
    2,
    1
];

export const Role = {
    ADMIN: "Admin",
    CASHIER: "cashier",
    MANAGER: "manager",
};

export const SRNOptions = [
    { value: "SRN0001", label: "SRN0001 - ₹150", amount: 150 },
    { value: "SRN0002", label: "SRN0002 - ₹100", amount: 100 },
    { value: "SRN0003", label: "SRN0003 - ₹50", amount: 50 },
    { value: "SRN0004", label: "SRN0004 - ₹20", amount: 20 }
]

export const syncOptions = [
    { label: "Product Sync", value: "product" },
    { label: "Customer Sync", value: "customer" },
    { label: "Store Sync", value: "store" }
];

export const advanceSlipFilterOptions = [
    { label: "All", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "Cancelled", value: "cancelled" },
];

export const TABS = [
    { value: "filters", label: "Filters" },
    { value: "sorting", label: "Sorting" },
];

export const FILTER_COLUMNS = [
    { value: "product", label: "Product" },
    { value: "salePrice", label: "Sale Price" },
    { value: "mrp", label: "MRP" },
    { value: "stock", label: "Stock" },
];

export const FILTER_CONDITIONS = [
    { value: "contains", label: "Contains" },
    { value: "equals", label: "Equals" },
    { value: "notEquals", label: "Not Equals" },
    { value: "greaterThan", label: "Greater Than" },
    { value: "greaterThanOrEqual", label: "Greater Than or Equal" },
    { value: "lessThan", label: "Less Than" },
    { value: "lessThanOrEqual", label: "Less Than or Equal" },
];

export const SORT_OPTIONS = [
    { value: "nameAsc", label: "Product Name: A → Z" },
    { value: "nameDesc", label: "Product Name: Z → A" },
    { value: "salePriceAsc", label: "Sale Price: Low → High" },
    { value: "salePriceDesc", label: "Sale Price: High → Low" },
    { value: "mrpAsc", label: "MRP: Low → High" },
    { value: "mrpDesc", label: "MRP: High → Low" },
    { value: "quantityAsc", label: "Quantity: Low → High" },
    { value: "quantityDesc", label: "Quantity: High → Low" },
    { value: "stockAsc", label: "Stock: Low → High" },
    { value: "stockDesc", label: "Stock: High → Low" },
];

export const PRODUCT_FILTER_SHORTCUTS = {
    filters: "Shift + 1",
    sorting: "Shift + 2",
};