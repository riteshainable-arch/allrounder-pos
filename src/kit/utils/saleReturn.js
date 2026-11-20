export const REFUND_MODE_OPTIONS = [
    { label: "Cash", value: "cash" },
    { label: "UPI", value: "upi" },
    { label: "Card", value: "card" },
    { label: "Wallet", value: "wallet" },
    { label: "Bank", value: "bank" },
];

export const parseOriginalInvoiceResponse = (response = {}) => {
    const payload = response?.data ?? response ?? {};
    return {
        bill: payload.bill || {},
        items: payload.items || [],
        offerBundles: payload.offerBundles || [],
    };
};

export const parsePreviewResponse = (response = {}) => {
    const payload = response?.data ?? response ?? {};
    return {
        isValid: Boolean(payload.isValid),
        errors: payload.errors || [],
        refundAmount: Number(payload.refundAmount || 0),
        items: payload.items || [],
    };
};

export const parseSaleReturnDetailResponse = (response = {}) => {
    const payload = response?.data ?? response ?? {};
    return {
        adjustmentConsumptions: payload.adjustmentConsumptions || [],
        srn: payload.srn || {},
        items: payload.items || [],
        refundPayments: payload.refundPayments || [],
        refundPayment: payload.refundPayment || payload.refundPayments?.[0] || {},
        originalBill: payload.originalBill || {},
    };
};

export const buildSelectionItems = (selectedQty = {}) =>
    Object.entries(selectedQty)
        .filter(([, qty]) => Number(qty) > 0)
        .map(([id, qty]) => ({ id: Number(id), qty: Number(qty) }));

export const getItemMaxReturnable = (item = {}) =>
    Number(item.maxReturnableQty ?? item.qty ?? 0);

export const getBundleRowIds = (bundle = {}) => bundle.rowIds || [];

export const getBundleItems = (bundle = {}, items = []) =>
    getBundleRowIds(bundle)
        .map((rowId) => items.find((row) => row.id === rowId))
        .filter(Boolean);

export const getBundleMaxReturnQty = (bundle = {}, items = []) =>
    getBundleItems(bundle, items).reduce((sum, item) => sum + getItemMaxReturnable(item), 0);

export const getBundleSelectedTotalQty = (bundle = {}, items = [], selectedQty = {}) =>
    getBundleItems(bundle, items).reduce(
        (sum, item) => sum + Number(selectedQty[item.id] || 0),
        0
    );

/** For 1+1 style offers: return qty must step by paid+free per set (e.g. 2, 4). */
export const getOfferReturnStep = (bundle = {}, items = []) => {
    const bundleItems = getBundleItems(bundle, items);
    if (!bundleItems.length) return 1;

    const paidItems = bundleItems.filter((item) => !item.isOfferFreeItem);
    const freeItems = bundleItems.filter((item) => item.isOfferFreeItem);

    if (paidItems.length && freeItems.length) {
        const totalMax = getBundleMaxReturnQty(bundle, items);
        const paidMax = paidItems.reduce((sum, item) => sum + getItemMaxReturnable(item), 0);
        if (paidMax > 0 && totalMax >= paidMax) {
            return Math.max(1, Math.round(totalMax / paidMax));
        }
    }

    return Math.max(1, Number(bundle.totalQty) || 1);
};

export const snapBundleReturnQty = (qty, step, max) => {
    const clamped = Math.max(0, Math.min(max, Number(qty) || 0));
    if (!step || step <= 1) return clamped;
    return Math.round(clamped / step) * step;
};

export const applyBundleReturnQty = (bundle = {}, items = [], totalReturnQty = 0) => {
    const bundleItems = getBundleItems(bundle, items);
    const maxTotal = getBundleMaxReturnQty(bundle, items);
    const step = getOfferReturnStep(bundle, items);
    const snapped = snapBundleReturnQty(totalReturnQty, step, maxTotal);
    const patch = {};

    if (!snapped) {
        bundleItems.forEach((item) => {
            patch[item.id] = 0;
        });
        return patch;
    }

    bundleItems.forEach((item) => {
        const itemMax = getItemMaxReturnable(item);
        patch[item.id] = maxTotal > 0 ? Math.round((itemMax / maxTotal) * snapped) : 0;
    });

    let sum = Object.values(patch).reduce((acc, qty) => acc + qty, 0);
    if (sum !== snapped && bundleItems.length) {
        patch[bundleItems[0].id] += snapped - sum;
    }

    return patch;
};

export const normalizeOfferGroups = (items = [], offerBundles = []) => {
    const groupMap = new Map();

    items.forEach((item) => {
        const groupId = item.offerGroupId ?? item.offer_group_id;
        if (!groupId) return;

        if (!groupMap.has(groupId)) {
            groupMap.set(groupId, {
                offerGroupId: groupId,
                offerName: item.offerName || item.offer_name || "Offer",
                rowIds: [],
            });
        }

        const group = groupMap.get(groupId);
        if (!group.rowIds.includes(item.id)) {
            group.rowIds.push(item.id);
        }
        if (item.offerName || item.offer_name) {
            group.offerName = item.offerName || item.offer_name;
        }
    });

    offerBundles.forEach((bundle) => {
        const groupId = bundle.offerGroupId;
        if (!groupId) return;

        if (!groupMap.has(groupId)) {
            groupMap.set(groupId, {
                offerGroupId: groupId,
                offerName: bundle.offerName || "Offer",
                rowIds: [...getBundleRowIds(bundle)],
                totalQty: bundle.totalQty,
            });
            return;
        }

        const group = groupMap.get(groupId);
        getBundleRowIds(bundle).forEach((rowId) => {
            if (!group.rowIds.includes(rowId)) {
                group.rowIds.push(rowId);
            }
        });
        if (bundle.totalQty) group.totalQty = bundle.totalQty;
        if (bundle.offerName) group.offerName = bundle.offerName;
    });

    return Array.from(groupMap.values());
};

export const isRealOfferBundle = (bundle = {}, items = []) => {
    const bundleItems = getBundleItems(bundle, items);
    if (bundleItems.length <= 1) return false;

    const hasFree = bundleItems.some((item) => item.isOfferFreeItem);
    const hasPaid = bundleItems.some((item) => !item.isOfferFreeItem);
    return hasFree && hasPaid;
};

export const findBundleForItem = (item, offerGroups = []) =>
    offerGroups.find((group) => getBundleRowIds(group).includes(item.id));

export const applyPaidItemReturnQty = (item, items = [], bundle = {}, qty = 0) => {
    const bundleItems = getBundleItems(bundle, items);
    const paidMax = getItemMaxReturnable(item);
    const clampedPaid = Math.max(0, Math.min(paidMax, Number(qty) || 0));
    const ratio = paidMax > 0 ? clampedPaid / paidMax : 0;
    const patch = {};

    bundleItems.forEach((bundleItem) => {
        patch[bundleItem.id] = Math.round(getItemMaxReturnable(bundleItem) * ratio);
    });

    let sum = Object.values(patch).reduce((acc, value) => acc + value, 0);
    const expectedTotal = Math.round(
        getBundleMaxReturnQty(bundle, items) * ratio
    );

    if (sum !== expectedTotal && bundleItems.length) {
        const paidItem = bundleItems.find((row) => !row.isOfferFreeItem) || bundleItems[0];
        patch[paidItem.id] += expectedTotal - sum;
    }

    return patch;
};

export const buildReturnDisplayRows = (items = [], offerBundles = []) => {
    const normalizedGroups = normalizeOfferGroups(items, offerBundles);

    return items.map((item) => {
        const bundle = findBundleForItem(item, normalizedGroups);
        const inOffer = Boolean(bundle && isRealOfferBundle(bundle, items));

        return {
            type: "item",
            item,
            bundle: inOffer ? bundle : null,
            isOfferFree: inOffer && Boolean(item.isOfferFreeItem),
            isOfferPaid: inOffer && !item.isOfferFreeItem,
        };
    });
};

export const getOfferReturnHint = (bundle = {}, items = []) => {
    const step = getOfferReturnStep(bundle, items);
    const max = getBundleMaxReturnQty(bundle, items);
    if (step <= 1 || max <= step) {
        return "Paid and free items return together.";
    }
    const validQtys = [];
    for (let qty = step; qty <= max; qty += step) {
        validQtys.push(qty);
    }
    return `Return paid + free together in qty: ${validQtys.join(" or ")}.`;
};

export const isItemInBundle = (item, offerGroups = []) =>
    offerGroups.some((group) => getBundleRowIds(group).includes(item.id));

export const applyBundleSelection = (bundle, items, enabled) =>
    applyBundleReturnQty(bundle, items, enabled ? getBundleMaxReturnQty(bundle, items) : 0);

export const getPreviewErrorForBundle = (errors = [], offerGroupId) =>
    errors.find((error) => error.offerGroupId === offerGroupId);

export const getPreviewErrorForRow = (errors = [], rowId) =>
    errors.find((error) => Array.isArray(error.missingRowIds) && error.missingRowIds.includes(rowId));

export const invalidateSettlementCaches = async (mutate) => {
    if (!mutate) return;

    await mutate(
        (key) =>
            Array.isArray(key) &&
            typeof key[0] === "string" &&
            (key[0].includes("settlement") || key[0].includes("invoice/bills")),
        undefined,
        { revalidate: true }
    );
};
