import { useEffect, useRef, useState } from "react";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitModal from "../../../../kit/components/KitModal";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";

export default function RemarkModal({ isOpen, onClose, remark, setRemark }) {
    const saveButtonRef = useRef(null);
    const remarkRef = useRef(null);
    const [error, setError] = useState("");

    const handleSave = () => {
        if (!remark.trim()) {
            setError("Remark is required.");
            return;
        }

        setError("");
        onClose();
    };

    const handleCancel = () => {
        setRemark("");
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
    }, [isOpen, remark]);

    return (
        <KitModal
            maxWidth='xs'
            isOpen={isOpen}
            onClose={onClose}
            title={<div className="text-base font-semibold">Remark</div>}
            titleClass='p-3! border-b'
        >
            <div className="p-4">
                <KitTextField
                    inputRef={remarkRef}
                    label="Remark"
                    multiline
                    minRows={4}
                    fullWidth
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Write customer remark..."
                    error={!!error}
                    helperText={error}
                />
            </div>
            <div className="p-4 pt-0 flex justify-end gap-3">
                <KitButton
                    className='w-auto'
                    variant="outlined"
                    size='small'
                    onClick={handleCancel}
                >
                    Cancel
                </KitButton>
                <KitButton
                    ref={saveButtonRef}
                    variant="contained"
                    className="w-auto"
                    size='small'
                    onClick={handleSave}
                >
                    Save
                </KitButton>
            </div>
        </KitModal>
    );
}