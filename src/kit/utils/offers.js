export const parseOfferRatio = (offerTypeName = "") => {
    const [buy, free] = offerTypeName.split("+").map(Number);

    return {
        buy: buy || 0,
        free: free || 0,
    };
};

export const getOfferDistribution = (quantity, offerTypeName) => {
    const { buy, free } = parseOfferRatio(offerTypeName);

    if (!buy || !free) {
        return {
            paidQty: quantity,
            freeQty: 0,
        };
    }

    const setSize = buy + free;

    const fullSets = Math.floor(quantity / setSize);
    const remaining = quantity % setSize;

    return {
        paidQty: fullSets * buy + remaining,
        freeQty: fullSets * free,
    };
};