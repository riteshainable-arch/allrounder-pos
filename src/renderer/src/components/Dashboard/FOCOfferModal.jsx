import { DialogActions, DialogContent } from "@mui/material";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitModal from "../../../../kit/components/KitModal";
import KitIcon from "../../../../kit/components/KitIcon";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import { useEffect, useState } from "react";

export default function FOCOfferModal({ open, onClose, selectedProduct, onApply, onBuyWithoutOffer }) {
    const applyButtonRef = useRef(null);
    const withoutOfferButtonRef = useRef(null);

    const [selectedAlternateId, setSelectedAlternateId] = useState(null);

    const offer = selectedProduct?.offers?.[0];
    const hasAlternateItems = (offer?.alternateItems?.length || 0) > 0;
    const freeItem = offer?.reward?.freeItem;
    const buyPrice = Number(offer?.reward?.comboSalesPrice ?? offer?.requiredItem?.offerUnitPrice ?? selectedProduct?.salePrice ?? 0);
    const hasComboPrice = buyPrice > 0;
    const comboSameAsSalePrice = buyPrice === Number(selectedProduct?.salePrice);
    const showWithoutOfferButton = hasComboPrice && !comboSameAsSalePrice;

    useEffect(() => {
        if (open) {
            setSelectedAlternateId(null);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const timer = setTimeout(() => {
            if (!hasAlternateItems || selectedAlternateId) {
                applyButtonRef.current?.focus();
            } else {
                withoutOfferButtonRef.current?.focus();
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [open, hasAlternateItems, selectedAlternateId]);

    useEffect(() => {
        if (!open) return;
    
        const handleKeyDown = (event) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
                return;
            }
    
            const applyButton = applyButtonRef.current;
            const withoutOfferButton = withoutOfferButtonRef.current;
    
            if (!applyButton || !withoutOfferButton) return;
    
            event.preventDefault();
    
            const activeElement = document.activeElement;
    
            if (event.key === "ArrowDown") {
                if (activeElement === applyButton) {
                    withoutOfferButton.focus();
                } else {
                    applyButton.focus();
                }
            }
    
            if (event.key === "ArrowUp") {
                if (activeElement === withoutOfferButton) {
                    applyButton.focus();
                } else {
                    withoutOfferButton.focus();
                }
            }
        };
    
        document.addEventListener("keydown", handleKeyDown);
    
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    return (
        <KitModal
            maxWidth="xs"
            isOpen={open}
            onClose={onClose}
            title={
                <div className="flex flex-col gap-0.5">
                    <div className="text-base font-semibold text-third-950">Available Free Offer</div>
                    <div className="text-sm text-third-950">{offer?.offerName}</div>
                    <div className="text-xs text-third-600">Select the free item to apply this completed offer.</div>
                </div>
            }
            titleClass="border-b p-3"
        >
            <DialogContent sx={{ px: 2, pt: 2, pb: 0 }}>
                <div className="mb-4 text-sm font-medium text-third-800">
                    Buy at <span className="font-bold">{priceFormat(buyPrice)}</span>
                    {" + "}
                    <span className="text-green-600">
                        Free Item
                    </span>
                </div>

                <div className="flex-1">
                    {!hasAlternateItems ? (
                        <div className="rounded-lg border border-green-300 bg-green-50 p-3">
                            <div className="flex gap-3">
                                <KitIcon icon="tabler:gift" className="mt-1 text-2xl text-green-600" />
                                <div className="flex flex-col">
                                    <div className="text-sm font-medium">
                                        {freeItem?.productName || freeItem?.itemName}
                                    </div>

                                    <div className="mt-1 text-sm text-third-500">
                                        Worth{" "}
                                        <span className="line-through">
                                            {priceFormat(freeItem?.latestMRP ?? freeItem?.mrp)}
                                        </span>{" "}
                                        <span className="font-semibold text-green-600">
                                            FREE
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {offer.alternateItems.map((item) => {
                                const value = String(item.id ?? item.itemCode);
                                const selected = selectedAlternateId === value;

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setSelectedAlternateId(value)}
                                        className={`flex w-full items-start gap-3 rounded-lg border p-3 transition ${selected
                                            ? "border-green-500 bg-third-100"
                                            : "border-gray-200"
                                            }`}
                                    >
                                        <span
                                            className={`mt-1 h-4 w-4 rounded-full border ${selected
                                                ? "border-green-600 bg-green-600"
                                                : "border-gray-300"
                                                }`}
                                        />

                                        <div className="flex-1 text-left">
                                            <div className="text-sm font-medium">
                                                {item.itemName}
                                            </div>

                                            <div className="text-xs text-third-500 mt-1">
                                                Worth{" "}
                                                <span className="line-through">
                                                    {priceFormat(item.latestMRP ?? item.mrp)}
                                                </span>{" "}
                                                <span className="font-semibold text-green-600">
                                                    FREE
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>

            <DialogActions
                sx={{
                    px: 2,
                    py: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                }}
            >
                   <KitButton
                       ref={applyButtonRef}
                       fullWidth
                       variant="contained"
                       disabled={hasAlternateItems && !selectedAlternateId}
                       onClick={() => {
                           const selectedItem = hasAlternateItems
                               ? offer.alternateItems.find(
                                     (item) =>
                                         String(item.id ?? item.itemCode) === selectedAlternateId
                                 )
                               : null;
                   
                           onApply(selectedItem);
                       }}
                   >
                       Buy at ₹ {priceFormat(buyPrice, { currency: false })} + Get Free Item
                   </KitButton>

                {/* {showWithoutOfferButton && ( */}
                  <KitButton
                      ref={withoutOfferButtonRef}
                      fullWidth
                      variant="outlined"
                      onClick={onBuyWithoutOffer}
                  >
                      Buy at Combo Price ₹
                      {priceFormat(selectedProduct.salePrice, { currency: false })}
                  </KitButton>
                {/* )} */}
            </DialogActions>
        </KitModal>
    );
}