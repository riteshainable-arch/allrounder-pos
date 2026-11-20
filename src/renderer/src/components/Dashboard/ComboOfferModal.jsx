import { Dialog, DialogTitle, DialogContent, List, ListItemButton, ListItemText, DialogActions, Typography, Alert } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitModal from "../../../../kit/components/KitModal";
import { priceFormat } from "../../../../kit/utils/priceFormat";

export default function ComboOfferModal({ open, onClose, selectedProduct, onApply, onBuyWithoutOffer }) {
    const applyButtonRef = useRef(null);
    const withoutOfferButtonRef = useRef(null);

    const offer = selectedProduct?.offers?.[0];
    const withOffer = Number(offer?.reward?.comboSalesPrice || 0);
    const withoutOffer = Number(selectedProduct?.salePrice || 0) * Number(offer?.requiredItem?.chargeableQty || 0);
    const savings = Math.max(0, withoutOffer - withOffer);

    useEffect(() => {
        if (!open) return;

        const timer = setTimeout(() => {
            applyButtonRef.current?.focus();
        }, 100);

        return () => clearTimeout(timer);
    }, [open]);

    const handleButtonKeyDown = (event, currentButton) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();

            if (currentButton === "apply") {
                withoutOfferButtonRef.current?.focus();
            } else {
                applyButtonRef.current?.focus();
            }
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();

            if (currentButton === "without") {
                applyButtonRef.current?.focus();
            } else {
                withoutOfferButtonRef.current?.focus();
            }
        }
    };

    return (
        <KitModal
            maxWidth='xs'
            isOpen={open}
            onClose={onClose}
            title={
                <div className="flex flex-col gap-0.5">
                    <div className="text-base font-semibold text-third-950">Special Bundle Offer</div>
                    <div className="text-sm text-third-950">{offer?.offerName}</div>
                    <div className="text-xs text-third-500">Review the bundle price before applying.</div>
                </div>
            }
            titleClass='p-3 border-b'
        >
            <div className="px-4 pt-4 pb-0">
                <Alert severity="success">
                    {`Buy ${offer?.requiredItem?.chargeableQty} items for ₹${priceFormat(withOffer, { currency: false })} and save ₹${priceFormat(savings, { currency: false })}.`}
                </Alert>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-md border border-green-200 bg-green-50 px-2 py-2">
                        <div className="text-xs text-green-700">With offer</div>
                        <div className="font-semibold text-green-800">
                            Rs. {priceFormat(withOffer, { currency: false })}
                        </div>
                    </div>
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-2 py-2">
                        <div className="text-xs text-third-500">
                            Without offer
                        </div>
                        <div className="font-semibold text-third-800">
                            Rs. {priceFormat(withoutOffer, { currency: false })}
                        </div>
                    </div>
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-2">
                        <div className="text-xs text-amber-700">Savings</div>
                        <div className="font-semibold text-amber-800">
                            Rs. {priceFormat(savings, { currency: false })}
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-4 flex flex-col gap-2">
                <KitButton
                    ref={applyButtonRef}
                    variant="contained"
                    size="small"
                    onClick={onApply}
                    onKeyDown={(event) => handleButtonKeyDown(event, "apply")}
                >
                    Apply Bundle Offer
                </KitButton>
                <KitButton
                    ref={withoutOfferButtonRef}
                    variant="outlined"
                    size="small"
                    onClick={onBuyWithoutOffer}
                    onKeyDown={(event) => handleButtonKeyDown(event, "without")}
                >
                    Buy Without Bundle
                </KitButton>
            </div>
        </KitModal>
    );
}