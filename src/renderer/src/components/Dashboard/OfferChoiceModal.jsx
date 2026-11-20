import { Dialog, DialogTitle, DialogContent, List, ListItemButton, ListItemText, DialogActions, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitModal from "../../../../kit/components/KitModal";

export default function OfferChoiceModal({ open, offer, onClose, onApply, onBuyWithoutOffer, showBuyWithoutOffer = true }) {
    const [selectedAlternateId, setSelectedAlternateId] = useState(null);

    const applyButtonRef = useRef(null);
    const buyWithoutOfferButtonRef = useRef(null);
    const alternateItemRefs = useRef([]);

    useEffect(() => {
        if (open) {
            const firstItem = offer?.alternateItems?.[0];
            setSelectedAlternateId(firstItem ? String(firstItem.id ?? firstItem.itemCode) : null);
        }
    }, [open, offer]);

    useEffect(() => {
        if (open) {
            setSelectedAlternateId(null);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const timer = setTimeout(() => {
            if (alternateItemRefs.current[0]) {
                alternateItemRefs.current[0].focus();
            } else if (showBuyWithoutOffer) {
                buyWithoutOfferButtonRef.current?.focus();
            } else {
                applyButtonRef.current?.focus();
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [open, offer, showBuyWithoutOffer]);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event) => {
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const itemCount = offer?.alternateItems?.length ?? 0;
            const totalCount = itemCount + 1 + (showBuyWithoutOffer ? 1 : 0);

            if (totalCount === 0) return;

            const focusableElements = [
                ...alternateItemRefs.current.slice(0, itemCount),
                applyButtonRef.current,
                ...(showBuyWithoutOffer ? [buyWithoutOfferButtonRef.current] : []),
            ].filter(Boolean);

            const currentIndex = focusableElements.indexOf(document.activeElement);

            let nextIndex;

            if (currentIndex === -1) {
                nextIndex = event.key === "ArrowDown" ? 0 : focusableElements.length - 1;
            } else if (event.key === "ArrowDown") {
                nextIndex = Math.min(currentIndex + 1, focusableElements.length - 1);
            } else {
                nextIndex = Math.max(currentIndex - 1, 0);
            }

            focusableElements[nextIndex]?.focus();
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, offer, showBuyWithoutOffer]);

    return (
        <KitModal
            maxWidth='xs'
            isOpen={open}
            onClose={onClose}
            title={
                <div className="flex flex-col gap-0.5">
                    <div className="text-base font-semibold text-third-950">Available Free Offer</div>
                    <div className="text-sm text-third-950">{offer?.offerName}</div>
                    <div className="text-xs text-third-500">Pick the free item to apply this offer.</div>
                </div>
            }
            titleClass='p-3 border-b'
        >
            <div className="px-4 pt-4 pb-0">
                <div className="flex flex-col gap-3">
                    {(offer?.alternateItems || []).map((item, index) => {
                        const value = String(item.id ?? item.itemCode);
                        const selected = selectedAlternateId === value;

                        return (
                            <button
                                key={value}
                                ref={(el) => {
                                    alternateItemRefs.current[index] = el;
                                }}
                                type="button"
                                className={`flex w-full items-start gap-3 rounded-md border px-3 py-3 text-left transition ${selected
                                        ? "border-green-400 bg-third-100"
                                        : "border-gray-200 hover:border-green-200 hover:bg-green-50/40"
                                }`}
                                onClick={() => setSelectedAlternateId(value)}
                            >
                                <span
                                    className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full border ${selected
                                            ? "border-green-600 bg-green-600"
                                            : "border-gray-300"
                                    }`}
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold text-third-950">
                                        {item.itemName || item.itemCode}
                                    </span>
                                    <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-third-500">
                                        <span>Code: {item.itemCode}</span>
                                        <span>Qty: {item.qty}</span>
                                        <span>Stock: {item.stockQty ?? "-"}</span>
                                        <span>MRP: Rs. {item.mrp ?? "-"}</span>
                                    </span>
                                </span>
                                <span className="shrink-0 text-xs font-semibold text-green-600">
                                    FREE
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>
            <div className="p-4 flex flex-col gap-2">
                <KitButton
                    ref={applyButtonRef}
                    variant="contained"
                    size="small"
                    disabled={!selectedAlternateId}
                    onClick={() => {
                        const selectedItem = offer?.alternateItems?.find(
                            (item) => String(item.id ?? item.itemCode) === selectedAlternateId
                        );

                        onApply(selectedItem);
                    }}
                >
                    Apply Selected Free Item
                </KitButton>
                {showBuyWithoutOffer && (
                    <KitButton
                        ref={buyWithoutOfferButtonRef}
                        variant="outlined"
                        size="small"
                        onClick={onBuyWithoutOffer}
                    >
                        Buy Without Offer
                    </KitButton>
                )}
            </div>
        </KitModal>
    );
}