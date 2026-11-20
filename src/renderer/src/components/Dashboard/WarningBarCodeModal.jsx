import KitModal from "../../../../kit/components/KitModal";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import { useEffect } from "react";

export default function WarningBarcodeModal({ isOpen, onClose, barcode }) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    return (
        <KitModal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="xs"
            title={<div className="text-base font-semibold text-text-primary">Product Not Found</div>}
            titleClass="!p-3 border-b border-border"
            actions={
                <KitButton variant="contained" size="small" onClick={onClose}>
                    OK
                </KitButton>
            }
        >
            <div className="p-4">
                <p className="text-sm text-text-secondary">
                    Product with barcode <strong className="text-text-primary">{barcode}</strong> is not available in
                    the product list.
                </p>

                <p className="mt-2 text-sm text-text-secondary">
                    Please add the product or sync the product list before scanning again.
                </p>
            </div>
        </KitModal>
    );
}
