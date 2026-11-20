import { useEffect, useRef, useState } from "react";
import { Typography } from "@mui/material";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import KitTextField from "../../../../../kit/components/KitTextField/KitTextField";
import KitModal from "../../../../../kit/components/KitModal";
import KitIcon from "../../../../../kit/components/KitIcon/KitIcon";

export default function ManualLinkModal({ isOpen, onClose, selectedItem, onSave, loading }) {
    const saveButtonRef = useRef(null);
    const busyCodeRef = useRef(null);

    const [busyCode, setBusyCode] = useState("");
    const [error, setError] = useState("");

    const handleSave = () => {
        if (!busyCode.trim()) {
            setError("BUSY Product ID is required.");
            return;
        }

        const code = Number(busyCode);

        if (!Number.isInteger(code) || code <= 0) {
            setError("Enter a valid numeric BUSY Product ID.");
            return;
        }

        setError("");
        onSave(selectedItem, code);
    };

    const handleCancel = () => {
        setBusyCode("");
        setError("");
        onClose();
    };

    useEffect(() => {
        if (!isOpen) return;

        setBusyCode("");
        setError("");

        const timer = setTimeout(() => {
            busyCodeRef.current?.focus();
        }, 100);

        return () => clearTimeout(timer);
    }, [isOpen, selectedItem]);

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
    }, [isOpen, busyCode]);

    return (
        <KitModal
            maxWidth="xs"
            isOpen={isOpen}
            onClose={handleCancel}
            title={<div className="text-base! font-semibold!">Link BUSY Item</div>}
            titleClass="p-3! border-b"
        >
            <div className="p-4 space-y-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-2 flex items-center gap-2">
                        <KitIcon icon="tabler:package" className="text-lg! text-primary" />
                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                            SELECTED CRM ITEM
                        </Typography>
                    </div>

                    <Typography variant="body2" fontWeight={700} color="text.primary">
                        {selectedItem?.itemName || "—"}
                    </Typography>

                    <div className="mt-2 flex items-center gap-2">
                        <span className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600">
                            Code: {selectedItem?.itemCode || "—"}
                        </span>
                    </div>
                </div>

                <KitTextField
                    inputRef={busyCodeRef}
                    label="BUSY Product ID"
                    fullWidth
                    size="small"
                    value={busyCode}
                    placeholderFontSize={14}
                    onChange={(e) => {
                        setBusyCode(e.target.value);
                        setError("");
                    }}
                    placeholder="Enter BUSY product ID"
                    error={!!error}
                    helperText={error}
                />
            </div>

            <div className="p-4 pt-0 flex justify-end gap-3">
                <KitButton className="w-auto" variant="outlined" size="small" onClick={handleCancel} disabled={loading}>
                    Cancel
                </KitButton>

                <KitButton
                    ref={saveButtonRef}
                    variant="contained"
                    className="w-auto"
                    size="small"
                    onClick={handleSave}
                    loading={loading}
                >
                    Link Item
                </KitButton>
            </div>
        </KitModal>
    );
}
