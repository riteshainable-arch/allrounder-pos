import { useCallback, useEffect, useRef, useState } from "react";
import { Checkbox, Typography } from "@mui/material";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitModal from "../../../../kit/components/KitModal";
import { useAvailableScheme } from "../../../../kit/hooks/data/globalCoupon";
import { roundToDecimals } from "../../../../kit/utils/priceFormat";
import { initialLettersCapitalize } from "../../../../kit/utils/capital";

const buildCouponItems = (cartRows) =>
    cartRows.map((item) => ({
        itemCode: item.itemCode || item.productCode,
        itemName: item.productName || item.itemName,
        qty: Number(item.quantity || 0),
        salePrice: roundToDecimals(item.isOfferItem ? 0 : (item.latestSalePrice ?? item.salePrice ?? item.price ?? 0)),
    }));

const money = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const rewardText = (scheme) => {
    const value = Number(scheme.discountValue) || 0;
    if (scheme.discountType === "PERCENTAGE") return `${value}% off`;
    if (scheme.discountType === "FLAT") return `${money(value)} off`;
    if (scheme.discountType === "PRICE") return `At ${money(value)}`;
    return "";
};

export default function SchemeModal({
    open,
    onClose,
    storeId,
    items,
    customerPhone = "",
    selectedSchemeIds = [],
    appliedSchemes = [],
    onSelectionChange,
    onApply,
}) {
    const { AvailableScheme, isAvailableScheme, AvailableSchemeError } = useAvailableScheme();

    const [availableSchemeList, setAvailableSchemeList] = useState([]);
    // Bill amount, and the part of it the schemes' min-bill is checked on (without the items a scheme gives).
    const [billSummary, setBillSummary] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    // The list has been fetched at least once. This popup is mounted fresh every time it opens, so until then the
    // list is empty and the ticked offers must not be cleared (they are checked against the list once it is here).
    const [isLoaded, setIsLoaded] = useState(false);
    // Item / quantity edits made in this popup: { [schemeId]: { [itemCode]: qty } }.
    const [pickEdits, setPickEdits] = useState({});
    const checkboxRefs = useRef([]);
    const schemesGridRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        let isActive = true;

        const fetchSchemes = async () => {
            try {
                const response = await AvailableScheme({
                    storeId,
                    cartItems: buildCouponItems(items),
                    ...(customerPhone && { customerPhone }),
                });

                if (!isActive) return;
                setAvailableSchemeList((response?.data?.schemes ?? []).filter((scheme) => scheme.isEligible));
                setBillSummary({
                    billAmount: Number(response?.data?.billAmount || 0),
                    eligibleAmount: Number(response?.data?.eligibleAmount ?? response?.data?.billAmount ?? 0),
                });
                setIsLoaded(true);
            } catch (error) {
                if (!isActive) return;
                setAvailableSchemeList([]);
                setBillSummary(null);
            }
        };

        fetchSchemes();
        return () => {
            isActive = false;
        };
    }, [open, storeId, items, refreshKey, customerPhone]);

    useEffect(() => {
        if (!open || isAvailableScheme || !isLoaded) return;

        // Item offers are always selectable: when the item is not on the bill yet, applying the offer adds it.
        const selectableSchemeIds = new Set(
            availableSchemeList.filter((scheme) => scheme.isEligible).map((scheme) => Number(scheme.id))
        );
        const validSelection = selectedSchemeIds.filter((id) => selectableSchemeIds.has(id));

        if (validSelection.length !== selectedSchemeIds.length) {
            onSelectionChange(validSelection);
        }
    }, [availableSchemeList, isAvailableScheme, isLoaded, onSelectionChange, open, selectedSchemeIds]);

    // The eligible amount is only a guide for the cashier. An item offer takes its min-bill amount off it for every
    // quantity slab of its item the cashier picks (min bill 2000, 2 quantity = 4000), and only the offers whose
    // min-bill still fits in what is left can be ticked. Item offers and bill discounts each count on their own amount.
    const minBillOf = (scheme) => Number(scheme.minBillAmount) || 0;
    const isBillScheme = (scheme) => scheme.schemeType === "BILL_DISCOUNT";
    const itemKey = (item) => String(item.itemCode ?? item.barcode ?? "").trim().toLowerCase();
    const perSlabQty = (item) => Math.max(1, Number(item.qty) || 1);
    const tickedSchemes = availableSchemeList.filter((scheme) => selectedSchemeIds.includes(Number(scheme.id)));

    // Quantity picked per item: what was edited here, else what is applied on the bill, else 1 unit of the item the
    // offer would add by default (the one already on the bill, or the first). The cashier raises it with +.
    const picksOf = (scheme) => {
        const id = Number(scheme.id);
        if (pickEdits[id]) return pickEdits[id];
        const applied = appliedSchemes.find((entry) => Number(entry.id) === id);
        if (applied?.autoAddItems?.length) {
            return applied.autoAddItems.reduce((picks, item) => ({ ...picks, [itemKey(item)]: Number(item.qty) || 1 }), {});
        }
        const items = scheme.items || [];
        const defaultCode = String(scheme.autoAddItems?.[0]?.itemCode ?? "").trim().toLowerCase();
        const target = items.find((item) => itemKey(item) === defaultCode) || items[0];
        return target ? { [itemKey(target)]: 1 } : {};
    };
    const qtyOf = (scheme, item) => Number(picksOf(scheme)[itemKey(item)]) || 0;
    const totalQtyOf = (scheme) => (scheme.items || []).reduce((sum, item) => sum + qtyOf(scheme, item), 0);
    // A slab (one min-bill block) is used when any item is taken: 3 of an item that gives 2 per slab = 2 slabs.
    const slabsUsedBy = (scheme) =>
        Math.max(
            1,
            (scheme.items || []).reduce((max, item) => Math.max(max, Math.ceil(qtyOf(scheme, item) / perSlabQty(item))), 0)
        );
    const takenBy = (scheme) => (isBillScheme(scheme) ? minBillOf(scheme) : slabsUsedBy(scheme) * minBillOf(scheme));
    const poolStart = (scheme) => (isBillScheme(scheme) ? billSummary?.billAmount : billSummary?.eligibleAmount) ?? 0;
    // What is left for a scheme: the pool without what the other ticked offers take.
    const poolLeft = (scheme) => {
        const taken = tickedSchemes
            .filter((ticked) => Number(ticked.id) !== Number(scheme.id) && isBillScheme(ticked) === isBillScheme(scheme))
            .reduce((sum, ticked) => sum + takenBy(ticked), 0);
        return Math.max(0, roundToDecimals(poolStart(scheme) - taken));
    };
    const canTick = (scheme) => minBillOf(scheme) <= poolLeft(scheme) + 0.0001;
    const itemTaken = tickedSchemes.filter((t) => !isBillScheme(t)).reduce((sum, t) => sum + takenBy(t), 0);

    const slabsAvailable = (scheme) =>
        minBillOf(scheme) > 0 ? Math.max(0, Math.floor((poolLeft(scheme) + 0.0001) / minBillOf(scheme))) : 1;
    // Most of one item that can be picked: what the eligible amount lets through, within the customer limit.
    const maxQtyFor = (scheme, item) => {
        const byAmount = slabsAvailable(scheme) * perSlabQty(item);
        const hasLimit = scheme.maxQtyPerCustomer != null && scheme.customerRemainingQty != null;
        if (!hasLimit) return byAmount;
        const limit = Number(scheme.customerRemainingQty) + Number(scheme.appliedQty || 0);
        return Math.max(0, Math.min(byAmount, limit - (totalQtyOf(scheme) - qtyOf(scheme, item))));
    };
    const setPick = (scheme, item, nextQty) => {
        const next = Math.max(0, Math.min(Math.floor(nextQty), maxQtyFor(scheme, item)));
        // At least one item stays picked: an offer with nothing on the bill would give nothing.
        if (next === 0 && totalQtyOf(scheme) - qtyOf(scheme, item) <= 0) return;
        setPickEdits((prev) => ({
            ...prev,
            [Number(scheme.id)]: { ...picksOf(scheme), [itemKey(item)]: next },
        }));
    };
    // What goes to the bill for an item offer: the items picked here, with their quantity.
    const pickedItemsOf = (scheme) =>
        (scheme.items || [])
            .filter((item) => qtyOf(scheme, item) > 0)
            .map((item) => ({
                itemCode: item.itemCode,
                itemName: item.itemName,
                barcode: item.barcode,
                selectedPriceLayerIds:
                    item.selectedPriceLayerIds ??
                    scheme.autoAddItems?.find((entry) => itemKey(entry) === itemKey(item))?.selectedPriceLayerIds ??
                    null,
                qty: qtyOf(scheme, item),
            }));

    const toggleScheme = (id) => {
        if (selectedSchemeIds.includes(id)) {
            onSelectionChange(selectedSchemeIds.filter((selectedId) => selectedId !== id));
            return;
        }
        onSelectionChange([...selectedSchemeIds, id]);
    };

    const applySelectedSchemes = useCallback(() => {
        onApply(
            selectedSchemeIds,
            availableSchemeList
                .filter((scheme) => selectedSchemeIds.includes(Number(scheme.id)))
                .map((scheme) => (isBillScheme(scheme) ? scheme : { ...scheme, autoAddItems: pickedItemsOf(scheme) }))
        );
        onClose();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availableSchemeList, onApply, onClose, selectedSchemeIds, pickEdits, appliedSchemes]);

    const firstSelectableSchemeIndex = availableSchemeList.length > 0 ? 0 : -1;

    useEffect(() => {
        if (!open || isAvailableScheme) return;

        const focusFrame = window.requestAnimationFrame(() => {
            checkboxRefs.current.find((checkbox) => checkbox && !checkbox.disabled)?.focus();
        });

        return () => window.cancelAnimationFrame(focusFrame);
    }, [availableSchemeList, isAvailableScheme, open]);

    useEffect(() => {
        if (!open) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                onClose();
                return;
            }

            const target = event.target instanceof HTMLElement ? event.target : null;
            if (target?.isContentEditable || target?.matches("input:not([type='checkbox']), textarea, select")) return;

            if (event.key.toLowerCase() === "a" && !event.ctrlKey && !event.metaKey && !event.altKey && !event.repeat) {
                event.preventDefault();
                event.stopPropagation();
                applySelectedSchemes();
                return;
            }

            const activeIndex = checkboxRefs.current.findIndex((checkbox) => checkbox === document.activeElement);
            if (activeIndex < 0) return;

            if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                if (!checkboxRefs.current[activeIndex].disabled) {
                    checkboxRefs.current[activeIndex].click();
                }
                return;
            }

            const grid = schemesGridRef.current;
            const columnCount = grid
                ? window.getComputedStyle(grid).gridTemplateColumns.split(/\s+/).filter(Boolean).length
                : 1;
            const movement = {
                ArrowLeft: -1,
                ArrowRight: 1,
                ArrowUp: -columnCount,
                ArrowDown: columnCount,
            }[event.key];

            if (movement === undefined) return;

            event.preventDefault();
            event.stopPropagation();
            const currentRow = Math.floor(activeIndex / columnCount);
            let nextIndex = activeIndex + movement;

            while (nextIndex >= 0 && nextIndex < checkboxRefs.current.length) {
                if (Math.abs(movement) === 1 && Math.floor(nextIndex / columnCount) !== currentRow) {
                    break;
                }

                const nextCheckbox = checkboxRefs.current[nextIndex];
                if (nextCheckbox && !nextCheckbox.disabled) {
                    nextCheckbox.focus();
                    break;
                }

                nextIndex += movement;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose, applySelectedSchemes]);

    return (
        <KitModal
            maxWidth="md"
            isOpen={open}
            onClose={onClose}
            title={
                <div>
                    <div className="text-base font-semibold text-third-950">Available schemes</div>
                    <div className="text-xs text-third-500">
                        Select the offers to apply - several can be used together ({selectedSchemeIds.length} selected)
                    </div>
                </div>
            }
            titleClass="p-3! border-b"
        >
            <div className="max-h-[60vh] overflow-y-auto p-4">
                {(!isLoaded && !AvailableSchemeError) || (isAvailableScheme && availableSchemeList.length === 0) ? (
                    <div className="py-8 text-center text-sm text-third-500">Loading active schemes...</div>
                ) : AvailableSchemeError && !isLoaded ? (
                    <div className="py-8 text-center text-sm text-red-600" role="alert">
                        {AvailableSchemeError?.[0]?.detail ??
                            AvailableSchemeError?.message ??
                            "Unable to load active billing schemes."}
                    </div>
                ) : availableSchemeList?.length === 0 ? (
                    <div className="py-8 text-center text-sm text-third-500">
                        No active billing schemes found for this store.
                    </div>
                ) : (
                    <>
                    {billSummary && (
                        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {[
                                ["Bill amount", billSummary.billAmount, "text-third-950"],
                                ["Eligible amount", billSummary.eligibleAmount, "text-third-950"],
                                ["Picked offers take", itemTaken, "text-green-700"],
                                ["Eligible left", Math.max(0, billSummary.eligibleAmount - itemTaken), "text-blue-700"],
                            ].map(([label, value, color]) => (
                                <div key={label} className="rounded-lg border border-app-border bg-app-paper px-3 py-2">
                                    <div className="text-[11px] font-medium uppercase tracking-wide text-third-500">{label}</div>
                                    <div className={`text-sm font-bold ${color}`}>{money(value)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div ref={schemesGridRef} className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
                        {availableSchemeList.map((scheme, index) => {
                            const id = Number(scheme.id);
                            const isSelected = selectedSchemeIds.includes(id);
                            const isSelectable = canTick(scheme);
                            const isBill = isBillScheme(scheme);
                            const pickOrder = isSelected ? selectedSchemeIds.indexOf(id) + 1 : 0;
                            const schemeItems = scheme.items || [];
                            const discountAmount = Number(scheme.discountAmount) || 0;
                            const reward = rewardText(scheme);
                            const canToggle = isSelectable || isSelected;

                            return (
                                <div
                                    key={scheme.id}
                                    onClick={(event) => {
                                        if (!canToggle) return;
                                        if (event.target instanceof Element && event.target.closest("button, input, svg, .MuiCheckbox-root")) return;
                                        toggleScheme(id);
                                    }}
                                    className={`rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-blue-400 ${
                                        isSelected
                                            ? "cursor-pointer border-green-500 bg-green-50 shadow-sm"
                                            : !isSelectable
                                              ? "cursor-not-allowed border-app-border bg-gray-50 opacity-60"
                                              : "cursor-pointer border-app-border bg-app-paper hover:border-green-300 hover:bg-green-50/40"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <Typography className="break-words font-semibold! text-third-950!">
                                                    {initialLettersCapitalize(scheme.schemeName || scheme.schemeCode)}
                                                </Typography>
                                                {pickOrder > 0 && (
                                                    <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-bold text-white">
                                                        #{pickOrder}
                                                    </span>
                                                )}
                                            </div>
                                            {scheme.schemeCode && <div className="text-xs text-third-500">{scheme.schemeCode}</div>}
                                        </div>
                                        <Checkbox
                                            autoFocus={index === firstSelectableSchemeIndex}
                                            slotProps={{
                                                input: {
                                                    ref: (checkbox) => {
                                                        checkboxRefs.current[index] = checkbox;
                                                    },
                                                    "aria-label": `Select ${scheme.schemeName || scheme.schemeCode}`,
                                                },
                                            }}
                                            checked={isSelected}
                                            disabled={!isSelectable && !isSelected}
                                            onChange={() => toggleScheme(id)}
                                            sx={{ p: 0.5, mt: -0.5, mr: -0.5 }}
                                        />
                                    </div>

                                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                                        {minBillOf(scheme) > 0 && (
                                            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-third-700">
                                                Min bill {money(minBillOf(scheme))}
                                            </span>
                                        )}
                                        {reward && (
                                            <span className="rounded-md bg-blue-50 px-2 py-0.5 font-medium text-blue-800">{reward}</span>
                                        )}
                                        {discountAmount > 0 && (
                                            <span className="rounded-md bg-green-100 px-2 py-0.5 font-bold text-green-800">
                                                Save {money(discountAmount)}
                                            </span>
                                        )}
                                    </div>

                                    {!isSelectable && !isSelected && (
                                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">
                                            Not available - needs {money(minBillOf(scheme))}, only {money(poolLeft(scheme))} eligible amount left
                                        </div>
                                    )}
                                    {scheme.description && <div className="mt-2 text-xs text-third-600">{scheme.description}</div>}

                                    {!isBill && schemeItems.length > 0 && (
                                        isSelected ? (
                                            <div className="mt-2 rounded-lg border border-green-200 bg-white px-2 py-1.5">
                                                <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-third-500">
                                                    {schemeItems.length > 1 ? "Choose item & quantity" : "Quantity"}
                                                </div>
                                                {schemeItems.map((item) => {
                                                    const qty = qtyOf(scheme, item);
                                                    const max = maxQtyFor(scheme, item);
                                                    return (
                                                        <div
                                                            key={itemKey(item)}
                                                            className="flex items-center justify-between gap-2 border-t border-gray-100 py-1.5 first:border-t-0"
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <div
                                                                    className={`break-words text-xs leading-snug ${qty > 0 ? "font-semibold text-third-950" : "text-third-600"}`}
                                                                >
                                                                    {item.itemName || item.itemCode}
                                                                </div>
                                                                <div className="text-[11px] text-third-500">
                                                                    max {max}
                                                                    {perSlabQty(item) > 1 ? ` - ${perSlabQty(item)} per ${money(minBillOf(scheme))}` : ""}
                                                                </div>
                                                            </div>
                                                            <div className="flex shrink-0 items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    aria-label={`Decrease ${item.itemName || item.itemCode}`}
                                                                    className="h-7 w-7 rounded-md border border-app-border bg-app-paper text-base font-bold leading-none disabled:opacity-40"
                                                                    disabled={qty <= 0}
                                                                    onClick={() => setPick(scheme, item, qty - 1)}
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="w-7 text-center text-sm font-bold">{qty}</span>
                                                                <button
                                                                    type="button"
                                                                    aria-label={`Increase ${item.itemName || item.itemCode}`}
                                                                    className="h-7 w-7 rounded-md border border-app-border bg-app-paper text-base font-bold leading-none disabled:opacity-40"
                                                                    disabled={qty >= max}
                                                                    onClick={() => setPick(scheme, item, qty + 1)}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div className="border-t border-gray-100 pt-1 text-xs font-semibold text-green-700">
                                                    Takes {money(takenBy(scheme))} from eligible amount ({slabsUsedBy(scheme)} x{" "}
                                                    {money(minBillOf(scheme))})
                                                </div>
                                                {schemeItems.some((item) => qtyOf(scheme, item) > maxQtyFor(scheme, item)) && (
                                                    <div className="text-xs text-red-600">
                                                        Eligible amount is not enough for this quantity - reduce it.
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="mt-2 line-clamp-2 text-xs text-third-600">
                                                {schemeItems.length > 1 ? "Items: " : "Item: "}
                                                {schemeItems.map((item) => item.itemName || item.itemCode).join(" / ")}
                                            </div>
                                        )
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    </>
                )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-third-200 px-4 py-3">
                <KitButton
                    variant="outlined"
                    className="mr-auto w-auto"
                    size="small"
                    disabled={isAvailableScheme}
                    onClick={() => setRefreshKey((key) => key + 1)}
                >
                    {isAvailableScheme ? "Refreshing..." : "Refresh schemes"}
                </KitButton>
                <KitButton variant="outlined" className="w-auto" size="small" onClick={onClose}>
                    Cancel
                </KitButton>
                <KitButton variant="contained" className="w-auto" size="small" onClick={applySelectedSchemes}>
                    Apply offers (Press A)
                </KitButton>
            </div>
        </KitModal>
    );
}
