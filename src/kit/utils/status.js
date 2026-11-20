export function purchaseOrderStatus(item) {
    const poValidDate = new Date(item.poValidTillDate).toISOString().slice(0, 10);
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastDateUpdate = item.lastPurchaseDate
        ? new Date(item.lastPurchaseDate).toISOString().slice(0, 10)
        : null;
    const referenceDate = lastDateUpdate ?? todayStr;
    const adjustmentNum = Number(item.Adjustment);
    const finalPOQtyNum = Number(item.finalPOQuantity);

    if (
        poValidDate >= todayStr &&
        item.Adjustment === null &&
        item.lastPurchaseDate === null
    ) {
        return "Pending";
    }
    if (
        poValidDate >= (lastDateUpdate ?? "") &&
        adjustmentNum < finalPOQtyNum &&
        item.Adjustment !== null
    ) {
        return "Partially Fulfilled";
    }
    if (poValidDate >= (lastDateUpdate ?? "") && adjustmentNum >= finalPOQtyNum) {
        return "Fully fulfilled";
    }
    if (poValidDate < (lastDateUpdate ?? "") && adjustmentNum === finalPOQtyNum) {
        return "Fulfilled Post Validity";
    }
    if (
        poValidDate < referenceDate &&
        (item.Adjustment === null || adjustmentNum !== finalPOQtyNum)
    ) {
        return "Unfulfilled";
    }
    return "Unknown";
}
