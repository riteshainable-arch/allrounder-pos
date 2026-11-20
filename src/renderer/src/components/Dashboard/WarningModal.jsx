import KitModal from "../../../../kit/components/KitModal";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import { useEffect } from "react";

export default function WarningModal({ isOpen, onClose, product }) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === "Enter" || e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    return (
        <KitModal
            maxWidth="xs"
            isOpen={isOpen}
            onClose={onClose}
            title={<div className="text-base font-semibold text-third-950">Price Warning</div>}
            titleClass='!p-3 border-b'
        >
            <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <KitIcon icon="tabler:alert-triangle" className="text-red-600" />
                    <div>
                        <p className="text-sm font-medium text-third-950">Invalid Product Price</p>
                        <p className="text-sm text-third-600 mt-1">Sale Price is greater than MRP.</p>
                    </div>
                </div>

                <div className="rounded-md bg-red-50 border border-red-100 p-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-third-600">Product</span>
                        <span className="font-medium text-third-950">{product?.productName}</span>
                    </div>

                    <div className="flex justify-between mt-2">
                        <span className="text-third-600">Sale Price</span>
                        <span className="font-medium text-red-600">{priceFormat(product?.latestSalePrice)}</span>
                    </div>

                    <div className="flex justify-between mt-2">
                        <span className="text-third-600">MRP</span>
                        <span className="font-medium text-third-950">{priceFormat(product?.latestMRP)}</span>
                    </div>
                </div>
            </div>

            <div className="px-4 py-3 flex justify-end gap-3">
                <KitButton
                    variant="outlined"
                    className="w-auto"
                    size="small"
                    onClick={onClose}
                >
                    Cancel
                </KitButton>
            </div>
        </KitModal>
    );
}