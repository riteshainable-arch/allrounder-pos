import { useEffect, useRef, useState } from "react";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitModal from "../../../../kit/components/KitModal";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";

export default function HoldModal({ isOpen, onClose, onSave }) {
    const saveButtonRef = useRef(null);
    const remarkRef = useRef(null);
    const [error, setError] = useState("");
    const [HoldBillName, setHoldBillName] = useState("");

    const handleSave = () => {
        if (!HoldBillName.trim()) {
            setError("Hold Bill Name is required.");
            return;
        }

        setError("");
        onSave?.(HoldBillName);
        setHoldBillName("");
        onClose();
    };

    const handleCancel = () => {
        setHoldBillName("");
        setError("");
        onClose();
    };

    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            remarkRef.current?.focus();
        }, 100);

        return () => clearTimeout(timer);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                saveButtonRef.current?.click();
            }

            if (e.key === "Escape") {
                e.preventDefault();
                handleCancel();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, HoldBillName]);

    return (
        <KitModal
            maxWidth="xs"
            isOpen={isOpen}
            onClose={onClose}
            title={<div className="text-base font-semibold">Hold Bill</div>}
            titleClass="p-3! border-b"
        >
            <div className="p-4">
                <KitTextField
                    inputRef={remarkRef}
                    label="Hold Bill Name"
                    fullWidth
                    required
                    value={HoldBillName}
                    onChange={(e) => setHoldBillName(e.target.value)}
                    placeholder="Write hold bill name..."
                    placeholderFontSize={14}
                    error={!!error}
                    helperText={error}
                />
            </div>
            <div className="p-4 pt-0 flex justify-end gap-3">
                <KitButton className="w-auto" variant="outlined" size="small" onClick={handleCancel}>
                    Cancel
                </KitButton>
                <KitButton ref={saveButtonRef} variant="contained" className="w-auto" size="small" onClick={handleSave}>
                    Save
                </KitButton>
            </div>
        </KitModal>
    );
}
