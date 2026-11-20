export const buildLoyaltyPreviewItems = (cartRows = []) =>
    cartRows
        .filter((row) => !row.isOfferItem)
        .map((row) => ({
            itemCode: row.itemCode,
            qty: Number(row.quantity || 0),
            salePrice: Number(row.latestSalePrice ?? row.salePrice ?? row.price ?? 0),
        }))
        .filter((item) => item.itemCode && item.qty > 0);

export const buildLoyaltyPreviewPayload = ({
    customerPhone,
    cartRows,
    redeemPoints = 0,
    payableAmount = 0,
}) => ({
    customerPhone,
    items: buildLoyaltyPreviewItems(cartRows),
    redeemPoints: Number(redeemPoints || 0),
    payableAmount: Number(payableAmount || 0),
});

export const getExcludedItemCodes = (preview) =>
    new Set(
        (preview?.items ?? [])
            .filter((item) => item.isExcluded)
            .map((item) => item.itemCode)
    );

export const mergeServerLoyaltyBill = (localBill, serverBill = {}) => ({
    ...localBill,
    ...serverBill,
    invoiceNo: serverBill.invoiceNo || serverBill.orderNo || localBill.invoiceNo,
    orderNo: serverBill.orderNo || serverBill.invoiceNo || localBill.orderNo,
    payAmount: serverBill.payAmount ?? localBill.payAmount,
    payments: serverBill.payments ?? localBill.payments,
    billPayments: serverBill.payments ?? localBill.billPayments,
    loyalty: serverBill.loyalty ?? localBill.loyalty,
    syncStatus: "SYNCED",
});
