import { useEffect, useMemo, useState } from "react";
import KitModal from "../../../../kit/components/KitModal";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import { priceFormat } from "../../../../kit/utils/priceFormat";

export default function CashModal({ open, onClose, totalPay, onSave }) {
    const [customerCash, setCustomerCash] = useState("");

    const changeAmount = useMemo(
        () => Number(customerCash || 0) - Number(totalPay || 0),
        [customerCash, totalPay]
    );

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                return;
            }

            if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();

                if (changeAmount >= 0) {
                    onSave(Number(customerCash));
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose, onSave, changeAmount, customerCash]);

    return (
        <KitModal
            maxWidth="xs"
            isOpen={open}
            onClose={onClose}
            title={<div className="text-base font-semibold text-third-950">Cash Collection</div>}
            titleClass='p-3 border-b'
        >
            <div className="p-4 flex flex-col gap-4">
                <div className="flex justify-between">
                    <span>Total Amount</span>
                    <span className="font-semibold">{priceFormat(totalPay)}</span>
                </div>
                <KitTextField
                    fullWidth
                    size="small"
                    height="32px"
                    type="number"
                    label="Customer Given Cash"
                    placeholder="Enter cash amount"
                    placeholderFontSize={14}
                    value={customerCash}
                    onChange={(e) => {
                        const value = e.target.value;
                        setCustomerCash(value === "" ? "" : value);
                    }}
                />
                <div className="flex justify-between">
                    <span>
                        {changeAmount >= 0 ? "Change Return" : "Remaining"}
                    </span>
                    <span
                        className={
                            changeAmount >= 0
                                ? "font-semibold text-green-600"
                                : "font-semibold text-red-600"
                        }
                    >
                        {priceFormat(Math.abs(changeAmount))}
                    </span>
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

                <KitButton
                    variant="contained"
                    className="w-auto"
                    size="small"
                    disabled={changeAmount < 0}
                    onClick={() => onSave(Number(customerCash))}
                >
                    Save Bill
                </KitButton>
            </div>
        </KitModal>
    );
}