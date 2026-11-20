export const CouponType = {
    ITEM: "ITEM",
    BRAND: "BRAND",
    CUSTOMER: "CUSTOMER",
    TIME_DURATION: "TIME_DURATION",
    BULK: "BULK",
    LOYALTY: "LOYALTY",
};

export const CouponDiscountType = {
    PERCENTAGE: "PERCENTAGE",
    FLAT: "FLAT",
};

export const CouponSource = {
    MANUAL: "MANUAL",
    LOYALTY: "LOYALTY",
};

export const CouponStatus = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    EXPIRED: "EXPIRED",
    UPCOMING: "UPCOMING",
    EXHAUSTED: "EXHAUSTED",
};

export const COUPON_TYPE_OPTIONS = [
    { label: "Item Coupon", value: CouponType.ITEM },
    { label: "Brand Coupon", value: CouponType.BRAND },
    { label: "Customer Coupon", value: CouponType.CUSTOMER },
    { label: "Time Duration Coupon", value: CouponType.TIME_DURATION },
    { label: "Bulk Coupon", value: CouponType.BULK },
    { label: "Loyalty Coupon", value: CouponType.LOYALTY },
];

export const COUPON_DISCOUNT_OPTIONS = [
    { label: "Percentage", value: CouponDiscountType.PERCENTAGE },
    { label: "Flat Amount", value: CouponDiscountType.FLAT },
];

export const VALID_DAYS_OPTIONS = [
    { label: "Sunday", value: "0" },
    { label: "Monday", value: "1" },
    { label: "Tuesday", value: "2" },
    { label: "Wednesday", value: "3" },
    { label: "Thursday", value: "4" },
    { label: "Friday", value: "5" },
    { label: "Saturday", value: "6" },
];

export const BULK_THRESHOLD_OPTIONS = [
    { label: "Quantity", value: "QUANTITY" },
    { label: "Amount", value: "AMOUNT" },
];
