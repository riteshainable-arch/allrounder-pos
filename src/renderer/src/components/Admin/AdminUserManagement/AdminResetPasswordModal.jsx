import { useEffect, useRef, useState } from "react";
import KitModal from "../../../../../kit/components/KitModal";
import KitTextField from "../../../../../kit/components/KitTextField/KitTextField";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import { useUpdateUserPassword } from "../../../../../kit/hooks/data/users";

export default function AdminResetPasswordModal({ isOpen, onClose, selectedItem, onRefresh }) {
    const saveButtonRef = useRef(null);
    const remarkRef = useRef(null);
    const [error, setError] = useState("");
    const [password, setPassword] = useState("");

    const { update: onUpdateUserPassword, isUpdatingUserPassword } = useUpdateUserPassword(String(selectedItem?.id));

    const handleSave = async () => {
        if (!password.trim()) {
            setError("Password is required.");
            return;
        }

        if (password.trim().length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        try {
            await onUpdateUserPassword({ password: password });
            toast.success("User Password Updated successfully!");
            setError("");
            onRefresh?.();
            onClose();
        } catch (error) {
            toast.error("Failed to Update");
        } finally {
            setError("");
            onRefresh?.();
            onClose();
        }
    };

    const handleCancel = () => {
        setPassword("");
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
    }, [isOpen, password]);

    return (
        <KitModal
            maxWidth="xs"
            isOpen={isOpen}
            onClose={onClose}
            title={<div className="text-base font-semibold">Enter New Password</div>}
            titleClass="p-3! border-b"
        >
            <div className="p-4">
                <KitTextField
                    inputRef={remarkRef}
                    label="New Password"
                    fullWidth
                    placeholderFontSize={14}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter New Password"
                    error={!!error}
                    helperText={error}
                />
            </div>
            <div className="p-4 pt-0 flex justify-end gap-3">
                <KitButton
                    className="w-auto"
                    variant="outlined"
                    size="small"
                    disabled={isUpdatingUserPassword}
                    onClick={handleCancel}
                >
                    Cancel
                </KitButton>
                <KitButton
                    ref={saveButtonRef}
                    disabled={isUpdatingUserPassword}
                    loading={isUpdatingUserPassword}
                    variant="contained"
                    className="w-auto"
                    size="small"
                    onClick={handleSave}
                >
                    Save
                </KitButton>
            </div>
        </KitModal>
    );
}
