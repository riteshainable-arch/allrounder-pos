export const getIdealCash = (row) => row.cash - row.advance - row.voucher - row.saleReturnAmount;
export const getDifference = (row) => row.amountReceived - getIdealCash(row);
export const getStatus = (row) => {
    const difference = getDifference(row);
    if (difference === 0) return "OK";
    if (difference > 0) return "EXCESS";
    return "SHORT";
};