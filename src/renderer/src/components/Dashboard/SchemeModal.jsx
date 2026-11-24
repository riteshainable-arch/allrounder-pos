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

export default function SchemeModal({
    open,
    onClose,
    storeId,
    items,
    customerPhone = "",
    selectedSchemeIds = [],
    onSelectionChange,
    onApply,
}) {
    const { AvailableScheme, isAvailableScheme, AvailableSchemeError } = useAvailableScheme();

    const [availableSchemeList, setAvailableSchemeList] = useState([]);
    // Bill amount, and the part of it the schemes' min-bill is checked on (without the items a scheme gives).
    const [billSummary, setBillSummary] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
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
        if (!open || isAvailableScheme) return;

        // Item offers are always selectable: when the item is not on the bill yet, applying the offer adds it.
        const selectableSchemeIds = new Set(
            availableSchemeList.filter((scheme) => scheme.isEligible).map((scheme) => Number(scheme.id))
        );
        const validSelection = selectedSchemeIds.filter((id) => selectableSchemeIds.has(id));

        if (validSelection.length !== selectedSchemeIds.length) {
            onSelectionChange(validSelection);
        }
    }, [availableSchemeList, isAvailableScheme, onSelectionChange, open, selectedSchemeIds]);

    // The eligible amount is only a guide for the cashier (what is ticked does not change what a scheme gives):
    // every ticked scheme takes its min-bill amount off the eligible amount, and only the schemes whose min-bill
    // still fits in what is left can be ticked. Item offers and bill discounts each count on their own amount.
    const minBillOf = (scheme) => Number(scheme.minBillAmount) || 0;
    const isBillScheme = (scheme) => scheme.schemeType === "BILL_DISCOUNT";
    const tickedSchemes = availableSchemeList.filter((scheme) => selectedSchemeIds.includes(Number(scheme.id)));
    const poolStart = (scheme) => (isBillScheme(scheme) ? billSummary?.billAmount : billSummary?.eligibleAmount) ?? 0;
    const poolLeft = (scheme) => {
        const taken = tickedSchemes
            .filter((ticked) => isBillScheme(ticked) === isBillScheme(scheme))
            .reduce((sum, ticked) => sum + minBillOf(ticked), 0);
        return Math.max(0, roundToDecimals(poolStart(scheme) - taken));
    };
    const canTick = (scheme) => minBillOf(scheme) <= poolLeft(scheme) + 0.0001;

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
            availableSchemeList.filter((scheme) => selectedSchemeIds.includes(Number(scheme.id)))
        );
        onClose();
    }, [availableSchemeList, onApply, onClose, selectedSchemeIds]);

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
                {isAvailableScheme && availableSchemeList.length === 0 ? (
                    <div className="py-8 text-center text-sm text-third-500">Loading active schemes...</div>
                ) : AvailableSchemeError ? (
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
                        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-app-border bg-app-paper px-3 py-2 text-xs text-third-700">
                            <span>
                                Bill: <b>₹{billSummary.billAmount.toFixed(2)}</b>
                            </span>
                            <span>
                                Eligible amount: <b>₹{billSummary.eligibleAmount.toFixed(2)}</b>
                            </span>
                            <span>
                                Picked offers take: <b className="text-green-700">₹{tickedSchemes.filter((t) => !isBillScheme(t)).reduce((sum, t) => sum + minBillOf(t), 0).toFixed(2)}</b>
                            </span>
                            <span>
                                Eligible amount left:{" "}
                                <b>
                                    ₹
                                    {Math.max(
                                        0,
                                        billSummary.eligibleAmount -
                                            tickedSchemes.filter((t) => !isBillScheme(t)).reduce((sum, t) => sum + minBillOf(t), 0)
                                    ).toFixed(2)}
                                </b>
                            </span>
                        </div>
                    )}
                    <div ref={schemesGridRef} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableSchemeList.map((scheme, index) => {
                            const id = Number(scheme.id);
                            const isSelected = selectedSchemeIds.includes(id);
                            const isSelectable = canTick(scheme);
                            const pickOrder = isSelected ? selectedSchemeIds.indexOf(id) + 1 : 0;
                            const blockedMessage = `Needs bill of ₹${minBillOf(scheme).toFixed(2)} - only ₹${poolLeft(scheme).toFixed(2)} eligible amount left`;
                            const itemNames = (scheme.items || []).map((item) => item.itemName).filter(Boolean);
                            const discountAmount = Number(scheme.discountAmount) || 0;
                            const willAddItem = scheme.itemInCart === false || (scheme.autoAddItems?.length > 0 && Number(scheme.eligibleQty) > 0);
                            const message = scheme.message?.replace(/^Applied:\s*/i, "");

                            return (
                                <div
                                    key={scheme.id}
                                    className={`relative rounded-xl border p-4 pr-14 transition-colors focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-1 ${
                                        isSelected
                                            ? "border-green-500 bg-green-50 ring-1 ring-green-200 shadow-sm"
                                            : !isSelectable
                                              ? "border-app-border bg-gray-50 opacity-60"
                                              : "border-app-border bg-app-paper hover:border-green-300 hover:bg-green-50/40"
                                    }`}
                                >
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
                                        sx={{ position: "absolute", top: 8, right: 8 }}
                                    />
                                    <div className="mb-3 flex flex-wrap items-center gap-2 pr-2">
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${
                                                willAddItem
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-green-100 text-green-800"
                                            }`}
                                        >
                                            {!isSelectable && !isSelected
                                                ? "NOT AVAILABLE NOW"
                                                : willAddItem
                                                  ? scheme.itemInCart === false
                                                      ? "ITEM ADDED ON APPLY"
                                                      : `+${scheme.autoAddItems?.[0]?.qty || 1} QTY ADDED ON APPLY`
                                                  : "READY TO APPLY"}
                                        </span>
                                        {pickOrder > 0 && (
                                            <span className="rounded-full bg-gray-800 px-2 py-1 text-[10px] font-bold text-white">
                                                PICKED #{pickOrder}
                                            </span>
                                        )}
                                        {discountAmount > 0 && (
                                            <span className="rounded-lg bg-green-100 px-2.5 py-1 text-sm font-bold text-green-800">
                                                Save ₹{discountAmount.toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                    <Typography className="font-semibold! text-third-950!">
                                        {initialLettersCapitalize(scheme.schemeName || scheme.schemeCode)}
                                    </Typography>
                                    {scheme.schemeCode && (
                                        <div className="text-xs text-third-500">{scheme.schemeCode}</div>
                                    )}
                                    {minBillOf(scheme) > 0 && (
                                        <div className="mt-1 text-xs text-third-600">
                                            Min bill: ₹{minBillOf(scheme).toFixed(2)}
                                        </div>
                                    )}
                                    {!isSelectable && !isSelected && (
                                        <div className="mt-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">
                                            {blockedMessage}
                                        </div>
                                    )}
                                    {message && (isSelectable || isSelected) && (
                                        <div
                                            className={`mt-1 rounded-lg border px-2 py-1 text-xs ${
                                                !isSelectable && !isSelected
                                                    ? "border-amber-200 bg-amber-50 text-amber-900"
                                                    : willAddItem
                                                      ? "border-blue-200 bg-blue-50 text-blue-900"
                                                      : "border-green-200 bg-white text-green-800"
                                            }`}
                                        >
                                            {message}
                                        </div>
                                    )}
                                    {scheme.description && (
                                        <div className="mt-1 text-xs text-third-600">{scheme.description}</div>
                                    )}
                                    {itemNames.length > 0 && (
                                        <div className="mt-3">
                                            <div className="mb-1 text-xs font-semibold text-third-700">
                                                Eligible Items ({itemNames.length})
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {itemNames.map((name, index) => (
                                                    <span
                                                        key={`${name}-${index}`}
                                                        className="rounded-md bg-gray-100 px-2 py-1 text-xs text-third-700"
                                                    >
                                                        {name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
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
