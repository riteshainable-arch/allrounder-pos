const ITEM_LIST_KEYS = ["items", "saleItems", "lineItems", "billItems", "products"];

const parseBillJson = (value) => {
    if (!value) return null;
    if (typeof value === "object") return value;

    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

export const getPersonDisplayName = (person) => {
    if (!person || typeof person !== "object") return "-";

    if (person.displayName) return person.displayName;

    const name = [person.firstName, person.lastName].filter(Boolean).join(" ");
    if (name) return name;

    return person.email || person.name || "-";
};

export const normalizeInvoiceItems = (source = {}) => {
    for (const key of ITEM_LIST_KEYS) {
        const value = source?.[key];
        if (Array.isArray(value) && value.length > 0) {
            return value;
        }
    }

    return [];
};

export const isInvoiceFreeItem = (item = {}) =>
    Boolean(item.isOfferFreeItem ?? item.is_offer_free_item);

export const getInvoiceItemCode = (item = {}) =>
    item.item_code || item.itemCode || "";

export const getInvoiceItemName = (item = {}) =>
    item.item_name ||
    item.itemName ||
    item.productName ||
    item.name ||
    item.title ||
    "-";

export const getInvoiceItemQty = (item = {}) =>
    Number(item.qty ?? item.quantity ?? item.qtyPcs ?? 0);

export const getInvoiceItemMrp = (item = {}) =>
    Number(item.mrp ?? item.latestMRP ?? item.price ?? 0);

export const getInvoiceItemRate = (item = {}) => {
    if (isInvoiceFreeItem(item)) {
        return 0;
    }

    return Number(
        item.sale_price ??
        item.salePrice ??
        item.rate ??
        item.price ??
        item.mrp ??
        item.latestMRP ??
        0
    );
};

export const getInvoiceItemTotal = (item = {}) => {
    if (isInvoiceFreeItem(item)) {
        return 0;
    }

    const qty = getInvoiceItemQty(item);
    const rate = getInvoiceItemRate(item);

    return Number(
        item.totalAmount ??
        item.amount ??
        item.lineTotal ??
        item.total ??
        qty * rate
    );
};

export const dedupeInvoiceLineItems = (items = []) => {
    const seen = new Set();

    return items.filter((item) => {
        const lineId = item.id ?? item.lineItemId ?? item.line_id;
        const key =
            lineId != null
                ? `id:${lineId}`
                : `${getInvoiceItemCode(item)}|${getInvoiceItemName(item)}|${getInvoiceItemQty(item)}|${isInvoiceFreeItem(item)}|${getInvoiceItemRate(item)}`;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
};

export const normalizeInvoiceBillResponse = (response = {}) => {
    const payload = response?.data ?? response ?? {};
    const parsedBillJson = parseBillJson(payload.billJson);
    const nestedBill = payload?.bill && typeof payload.bill === "object" ? payload.bill : null;

    const siblingItems = Array.isArray(payload.items) ? payload.items : [];
    const bill = {
        ...(parsedBillJson || {}),
        ...(nestedBill || payload),
    };

    const billItems = normalizeInvoiceItems(bill);
    let items = siblingItems.length > 0 ? siblingItems : billItems;

    if (!items.length) {
        const itemSources = [payload, parsedBillJson, nestedBill].filter(Boolean);

        for (const source of itemSources) {
            items = normalizeInvoiceItems(source);
            if (items.length > 0) break;
        }
    }

    items = dedupeInvoiceLineItems(items);

    const rawCreatedBy = bill.createdBy || bill.cashier;
    const createdBy = rawCreatedBy
        ? {
            ...rawCreatedBy,
            displayName: getPersonDisplayName(rawCreatedBy),
        }
        : bill.cashierId || bill.cashierName
            ? {
                id: bill.cashierId,
                displayName: bill.cashierName,
                role: "cashier",
            }
            : null;

    const itemCount =
        bill.itemCount ??
        bill.totalItems ??
        items.length ??
        0;

    return {
        ...bill,
        createdBy,
        customer: bill.customer
            ? { ...bill.customer, displayName: getPersonDisplayName(bill.customer) }
            : bill.customer,
        items,
        itemCount,
        totalQty: bill.totalQty ?? items.reduce((sum, item) => sum + getInvoiceItemQty(item), 0),
    };
};

export const mergeInvoiceBillWithLocal = (apiBill = {}, localBill = {}) => {
    if (!localBill || typeof localBill !== "object") {
        return apiBill;
    }

    const localItems = normalizeInvoiceItems(localBill);
    const hasApiItems = Array.isArray(apiBill.items) && apiBill.items.length > 0;

    return {
        ...apiBill,
        items: hasApiItems ? dedupeInvoiceLineItems(apiBill.items) : dedupeInvoiceLineItems(localItems),
        itemCount: apiBill.itemCount || localBill.totalItems || localItems.length,
        createdBy:
            apiBill.createdBy ||
            (localBill.cashierName
                ? { displayName: localBill.cashierName, role: "cashier" }
                : null),
        saleItems: hasApiItems ? apiBill.items : localBill.saleItems || localItems,
    };
};
