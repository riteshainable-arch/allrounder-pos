import { toast } from "react-toastify";
import { offerTypes } from "../configs/general";
import { getOfferDistribution, parseOfferRatio } from "../utils/offers";

export const applyBuyXGetY = (cart, row, quantity) => {
    const { paidQty, freeQty } = getOfferDistribution(quantity, row.offers[0].offerTypeName);
    const { buy, free } = parseOfferRatio(row.offers[0].offerTypeName);
    const mrp = Number(row.latestMRP);
    const sale = Number(row.price);
    // Paid groups that have already earned free items
    const mrpPaidQty =
        buy === 1
            ? Math.min(paidQty, Math.ceil(freeQty / free))
            : Math.floor(freeQty / free) * buy;
    // Remaining paid items
    const salePaidQty = paidQty - mrpPaidQty;
    const totalPrice = mrpPaidQty * mrp + salePaidQty * sale;

    const paidRow = {
        ...row,
        quantity: paidQty,
        totalPrice,
        isOfferItem: false,
    };

    const freeRow = {
        ...row,
        id: `${row.id}-offer`,
        quantity: freeQty,
        price: 0,
        salePrice: 0,
        latestSalePrice: 0,
        isOfferItem: true,
        offerForId: row.id,
    };

    // const withoutOld = cart.filter(
    //     (item) =>
    //         item.id !== row.id &&
    //         item.offerForId !== row.id
    // );

    // return freeQty > 0
    //     ? [...withoutOld, paidRow, freeRow]
    //     : [...withoutOld, paidRow];

    return freeQty > 0
        ? insertRowsWhilePreservingOrder(cart, paidRow, freeRow)
        : insertRowsWhilePreservingOrder(cart, paidRow);
};

export const applyBuyXGetYChoice = (cart, row, quantity, selectedAlternate) => {
    const offer = row.offers[0];
    const chargeableQty = Number(offer.requiredItem?.chargeableQty || 1);
    const freeItemQty = Number(offer.reward?.freeItemQty || 1);
    const offerSets = Math.floor(quantity / chargeableQty);
    const freeQty = offerSets * freeItemQty;
    const withoutOfferPrice = row.withoutOfferPrice ?? row.bkdAmount ?? row.salePrice;

    const paidRow = {
        ...row,
        quantity: quantity,
        latestSalePrice: row.latestMRP,
        salePrice: row.latestMRP,
        price: row.latestMRP,
        withoutOfferPrice,
        offerChoiceStatus: "WITH_OFFER",
        selectedAlternate,
    };

    const freeRow = {
        ...selectedAlternate,
        productName: selectedAlternate.itemName,
        productCode: selectedAlternate.itemCode,
        id: `${row.id}-offer`,
        quantity: freeQty,
        price: 0,
        salePrice: 0,
        latestSalePrice: 0,
        latestMRP: selectedAlternate.mrp,
        isOfferItem: true,
        offerForId: row.id,
    };

    // const withoutOld = cart.filter(
    //     item =>
    //         item.id !== row.id &&
    //         item.offerForId !== row.id
    // );

    // return [...withoutOld, paidRow, freeRow];

    return insertRowsWhilePreservingOrder(cart, paidRow, freeRow);
};

export const applyComboOffer = (cart, product, totalQty) => {
    const requiredQty = Number(product.offers[0].requiredItem.chargeableQty);
    const comboPrice = Number(product.offers[0].reward.comboSalesPrice);
    const comboQty = Math.floor(totalQty / requiredQty) * requiredQty;
    const existingNormal = cart.find(
        x =>
            x.id === (product.parentId || product.id) &&
            x.comboStatus === "WITHOUT_COMBO"
    );
    const normalQty =
        product.comboStatus === "WITH_COMBO"
            ? (existingNormal?.quantity || 0)
            : totalQty % requiredQty;

    const productId = product.parentId || product.id;

    // Remove existing combo + normal rows
    let next = cart.filter(
        x =>
            !(
                (x.id === productId && x.comboStatus === "WITHOUT_COMBO") ||
                (x.id === `${productId}-combo` && x.comboStatus === "WITH_COMBO")
            )
    );

    // Add combo row
    if (comboQty > 0) {
        next.push({
            ...product,
            id: `${productId}-combo`,
            parentId: productId,
            quantity: comboQty,
            comboStatus: "WITH_COMBO",
            comboQty: requiredQty,
            comboPrice: comboPrice,
            price: comboPrice / requiredQty,
            salePrice: comboPrice / requiredQty,
            latestSalePrice: comboPrice / requiredQty,
        });
    }

    // Add normal row
    if (normalQty > 0) {
        next = updateNormalRow(
            next,
            {
                ...product,
                id: productId,
                parentId: undefined,
                comboStatus: "WITHOUT_COMBO",
                price: product.bkdAmount ?? product.salePrice,
                salePrice: product.bkdAmount ?? product.salePrice,
                latestSalePrice: product.bkdAmount ?? product.salePrice,
            },
            normalQty
        );
    }

    return next;
};

// export const applyComboOffer = (cart, row, quantity) => {
//     const comboPrice = Number(row.offers[0].reward.comboSalesPrice);
//     const comboQty = Number(row.offers[0].requiredItem.chargeableQty);

//     const comboId = row.parentId || row.id;
//     const id = `${comboId}-combo`;

//     const paidRow = {
//         ...row,
//         id,
//         parentId: comboId,
//         quantity,
//         comboStatus: "WITH_COMBO",
//         comboQty,
//         comboPrice,
//         price: comboPrice / comboQty,
//         salePrice: comboPrice / comboQty,
//         latestSalePrice: comboPrice / comboQty,
//     };

//     const existing = cart.findIndex(
//         x => x.id === id
//     );

//     if (existing === -1) {
//         return [...cart, paidRow];
//     }

//     return cart.map(item =>
//         item.id === id ? paidRow : item
//     );
// };

// export const syncComboRows = (cart, productId) => {
//     const normalRow = cart.find(
//         x =>
//             x.id === productId &&
//             x.comboStatus === "WITHOUT_COMBO"
//     );

//     const comboRow = cart.find(
//         x =>
//             x.parentId === productId &&
//             x.comboStatus === "WITH_COMBO"
//     );

//     const normalSource = normalRow;
//     const comboSource = comboRow;
//     const source = normalSource ?? comboSource;

//     const row = normalRow || comboRow;

//     if (!row) return cart;

//     const requiredQty = Number(row.offers[0].requiredItem.chargeableQty);
//     const comboQty = comboRow?.quantity || 0;
//     const normalQty = normalRow?.quantity || 0;
//     const totalQty = comboQty + normalQty;
//     const comboTotal = Math.floor(totalQty / requiredQty) * requiredQty;
//     const normalTotal = totalQty - comboTotal;

//     let next = cart;

//     if (comboTotal > 0) {
//         next = applyComboOffer(next, comboSource ?? source, comboTotal);
//     } else {
//         next = next.filter(
//             x => x.id !== `${productId}-combo`
//         );
//     }

//     if (normalTotal > 0) {
//         next = updateNormalRow(
//             next,
//             {
//                 ...(normalSource ?? source),
//                 id: productId,
//                 comboStatus: "WITHOUT_COMBO",
//                 price: normalSource?.latestSalePrice ?? source.latestSalePrice,
//                 salePrice: normalSource?.latestSalePrice ?? source.latestSalePrice,
//                 latestSalePrice: normalSource?.latestSalePrice ?? source.latestSalePrice,
//             },
//             normalTotal
//         );
//     } else {
//         next = next.filter(
//             x => !(x.id === productId && x.comboStatus === "WITHOUT_COMBO")
//         );
//     }

//     return next;
// };

export const applyFOCOffer = (cart, row, quantity, selectedAlternate = null) => {
    const offer = row.offers?.[0];
    const hasAlternateItems = (offer.alternateItems?.length || 0) > 0;
    const freeItem = hasAlternateItems ? selectedAlternate : offer.reward.freeItem;
    const paidPrice = Number(offer.reward?.comboSalesPrice || row.salePrice);
    const withoutOfferPrice = row.withoutOfferPrice ?? row.bkdAmount ?? row.salePrice;
    const chargeableQty = Number(offer.requiredItem?.chargeableQty || 1);
    const freeItemQty = Number(offer.reward?.freeItemQty || 1);
    const offerSets = Math.floor(quantity / chargeableQty);
    const freeQty = offerSets * freeItemQty;

    const paidRow = {
        ...row,
        quantity,
        focStatus: "WITH_OFFER",
        selectedAlternate,
        price: paidPrice,
        salePrice: paidPrice,
        latestSalePrice: paidPrice,
        withoutOfferPrice,
    };

    const freeRow = {
        ...freeItem,
        productName: freeItem.productName || freeItem.itemName,
        itemCode: freeItem.itemCode,
        // id: `${row.id}-offer`,
        id: `${row.id}-${freeItem.itemCode}-offer`,
        quantity: freeQty,
        latestMRP: freeItem.mrp,
        price: 0,
        salePrice: 0,
        latestSalePrice: 0,
        isOfferItem: true,
        offerForId: row.id,
    };

    // const withoutOld = cart.filter(
    //     item =>
    //         item.id !== row.id &&
    //         item.offerForId !== row.id
    // );

    // return [...withoutOld, paidRow, freeRow];

    return insertRowsWhilePreservingOrder(cart, paidRow, freeRow);
};

export const applyDiscountOffer = (cart, row, quantity) => {
    const offer = row.offers?.[0];

    const discountedPrice = Number(offer.appliedUnitPrice ?? offer.requiredItem?.offerUnitPrice ?? row.salePrice);

    const paidRow = {
        ...row,
        quantity,
        discountStatus: "WITH_DISCOUNT",
        originalPrice: row.salePrice,
        price: discountedPrice,
        salePrice: discountedPrice,
        latestSalePrice: discountedPrice,
    };

    const existing = cart.findIndex(
        item => item.id === row.id
    );

    if (existing === -1) {
        return [...cart, paidRow];
    }

    return cart.map(item => item.id === row.id ? paidRow : item);
};

export const updateNormalRow = (cart, row, quantity) => {
    const existingIndex = cart.findIndex(
        (item) => item.id === row.id
    );

    if (existingIndex === -1) {
        return [
            ...cart,
            {
                ...row,
                quantity,
                isOfferItem: false,
                offerChoiceStatus: row.offerChoiceStatus,
                selectedAlternate: row.selectedAlternate
            },
        ];
    }

    return cart.map((item) =>
        item.id === row.id
            ? {
                ...item,
                quantity,
                loose: Boolean(item.loose || row.loose),
            }
            : item
    );
};

export const validateStock = (quantity, stockQty, lastAlert) => {
    if (quantity <= stockQty) {
        return true;
    }

    const message = `Only ${stockQty} item(s) available in stock.`;

    if (lastAlert.current !== message) {
        lastAlert.current = message;
        toast.warning(message);

        setTimeout(() => {
            lastAlert.current = "";
        }, 300);
    }

    return false;
};

const insertRowsWhilePreservingOrder = (cart, paidRow, freeRow = null) => {
    const existingMainIndex = cart.findIndex((item) => item.id === paidRow.id);
    const existingOfferIndex = cart.findIndex((item) => item.offerForId === paidRow.id && item.isOfferItem);

    const withoutOld = cart.filter(
        (item) => item.id !== paidRow.id && item.offerForId !== paidRow.id
    );

    const baseIndex = existingMainIndex >= 0
        ? existingMainIndex
        : existingOfferIndex >= 0
            ? existingOfferIndex
            : withoutOld.length;

    const nextCart = [...withoutOld];
    nextCart.splice(baseIndex, 0, paidRow);

    if (freeRow) {
        nextCart.splice(baseIndex + 1, 0, freeRow);
    }

    return nextCart;
};