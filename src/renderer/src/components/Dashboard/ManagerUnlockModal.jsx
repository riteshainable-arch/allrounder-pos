import { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Backdrop,
    Chip,
    CircularProgress,
    Divider,
    FormControl,
    FormControlLabel,
    Paper,
    Radio,
    RadioGroup,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import KitModal from "../../../../kit/components/KitModal";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitSelect from "../../../../kit/components/KitSelect";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import {
    useCreateSaleReturn,
    useVerifySaleReturnManager,
} from "../../../../kit/hooks/data/saleReturn";
import { useUsersDropdown } from "../../../../kit/hooks/data/users";
import useUser from "../../../../kit/hooks/useUser";
import { parseApiList, buildUserLabel } from "../../../../kit/utils/parseApiList";
import { toast } from "react-toastify";

const DEFAULT_STORE_ID = 1;

export default function ManagerUnlockModal({ isOpen, onClose, onSuccess }) {
    const userData = useUser();
    const printRef = useRef(null);
    const managerSelectRef = useRef(null);
    const storeId = userData?.storeId || DEFAULT_STORE_ID;

    const [managerId, setManagerId] = useState("");
    const [unlockPassword, setUnlockPassword] = useState("");
    const [loadedInvoiceNo, setLoadedInvoiceNo] = useState("");
    const [invoiceData, setInvoiceData] = useState({ bill: {}, items: [], offerBundles: [] });
    const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
    const [selectedQty, setSelectedQty] = useState({});
    const [preview, setPreview] = useState({ isValid: false, errors: [], refundAmount: 0, items: [] });
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [approveOpen, setApproveOpen] = useState(false);
    const [approvePassword, setApprovePassword] = useState("");
    const [notes, setNotes] = useState("");
    const [printPayload, setPrintPayload] = useState(null);
    const [bannerError, setBannerError] = useState("");
    const [refundMode, setRefundMode] = useState("cash");

    const { verifyManager, isVerifyingManager } = useVerifySaleReturnManager();
    const { createSaleReturn, isCreatingSaleReturn } = useCreateSaleReturn();
    const { usersDropdown, isUsersDropdownLoading } = useUsersDropdown(
        { role: "manager" },
        isOpen
    );

    const managerOptions = useMemo(
        () =>
            parseApiList(usersDropdown).map((user) => ({
                label: buildUserLabel(user),
                value: user.id,
                user,
            })),
        [usersDropdown]
    );

    const selectedManager = managerOptions.find(
        (option) => String(option.value) === String(managerId)
    )?.user;

    const handleUnlock = async () => {
        if (!selectedManager) {
            toast.warning("Select a manager.");
            return;
        }
        if (!unlockPassword.trim()) {
            toast.warning("Enter manager password.");
            return;
        }

        try {
            const response = await verifyManager({
                userId: selectedManager.id,
                password: unlockPassword,
            });
            const payload = response?.data ?? response;
            if (!payload?.verified && !payload?.manager) {
                throw new Error(response?.message || "Manager verification failed.");
            }
            setUnlockPassword("");
            toast.success("Sale return unlocked.");
            onSuccess?.();
            onClose();
        } catch (error) {
            toast.error(error?.message || "Invalid manager credentials.");
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            managerSelectRef.current?.focus();
        }, 100);

        return () => clearTimeout(timer);
    }, [isOpen]);

    return (
        <KitModal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="sm"
            title={<div className="text-base font-semibold">Manager Authentication</div>}
            titleClass="p-3! border-b!"
        >
            <div className="p-4 flex flex-col gap-4 max-h-[78vh] overflow-y-auto">
                <Alert severity="info">
                    Manager must unlock the return panel before processing a sale return.
                </Alert>
                <KitSelect
                    ref={managerSelectRef}
                    label="Manager"
                    placeholder="Select manager"
                    size="small"
                    placeholderFontSize={14}
                    inputFontSize={14}
                    options={managerOptions}
                    isDisabled={isUsersDropdownLoading}
                    value={managerOptions.find((o) => String(o.value) === String(managerId)) ?? null}
                    onChange={(option) => setManagerId(option?.value ?? "")}
                />
                <KitTextField
                    label="Manager Password"
                    type="password"
                    size="small"
                    value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                />
                <div className="flex justify-end gap-2">
                    <KitButton variant="outlined" size="small" className="w-auto" onClick={onClose}>
                        Cancel
                    </KitButton>
                    <KitButton
                        variant="contained"
                        size="small"
                        className="w-auto"
                        isLoading={isVerifyingManager}
                        onClick={handleUnlock}
                    >
                        Unlock Return
                    </KitButton>
                </div>
            </div>
        </KitModal>
    );
}
