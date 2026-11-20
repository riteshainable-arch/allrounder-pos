import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Typography } from "@mui/material";
import { useReactToPrint } from "react-to-print";
import KitModal from "../../../../kit/components/KitModal";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitSelect from "../../../../kit/components/KitSelect";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import { useCreateAdvanceSlip } from "../../../../kit/hooks/data/cashierAdvance";
import { useUsersDropdown } from "../../../../kit/hooks/data/users";
import useUser from "../../../../kit/hooks/useUser";
import { parseApiList, buildUserLabel } from "../../../../kit/utils/parseApiList";
import { getPersonDisplayName } from "../../../../kit/utils/invoiceBill";
import AdvanceSlipPrintLayout from "./AdvanceSlipPrintLayout";
import { toast } from "react-toastify";

const DEFAULT_STORE_ID = 1;

export default function CreateAdvanceSlipModal({ open, onClose, onCreated }) {
    const userData = useUser();
    const printRef = useRef(null);
    const timeOfDayRef = useRef(null);
    const today = format(new Date(), "yyyy-MM-dd");

    const [managerId, setManagerId] = useState("");
    const [amount, setAmount] = useState("");
    const [timeOfDay, setTimeOfDay] = useState(format(new Date(), "hh:mm aa"));
    const [cashierRemark, setCashierRemark] = useState("");
    const [createdSlip, setCreatedSlip] = useState(null);

    const { createAdvanceSlip, isCreatingAdvanceSlip } = useCreateAdvanceSlip();
    const { usersDropdown, isUsersDropdownLoading } = useUsersDropdown(
        { role: "manager" },
        open
    );

    const managerOptions = useMemo(() => {
        return parseApiList(usersDropdown).map((user) => ({
            label: buildUserLabel(user),
            value: user.id,
        }));
    }, [usersDropdown]);

    const selectedManager = managerOptions.find(
        (option) => String(option.value) === String(managerId)
    );

    const printSlipData = useMemo(() => {
        if (!createdSlip) return null;

        return {
            ...createdSlip,
            manager: createdSlip.manager || (selectedManager
                ? { id: selectedManager.value, displayName: selectedManager.label }
                : null),
        };
    }, [createdSlip, selectedManager]);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: "Advance Slip",
    });

    const resetForm = () => {
        setManagerId("");
        setAmount("");
        setTimeOfDay(format(new Date(), "hh:mm aa"));
        setCashierRemark("");
        setCreatedSlip(null);
    };

    const handleClose = () => {
        resetForm();
        onClose?.();
    };

    const handleSubmit = async () => {
        const parsedAmount = Number(amount);
        if (!parsedAmount || parsedAmount <= 0) {
            toast.warning("Enter a valid amount.");
            return;
        }

        try {
            const response = await createAdvanceSlip({
                amount: parsedAmount,
                managerId: managerId || undefined,
                slipDate: today,
                timeOfDay,
                storeId: userData?.storeId || DEFAULT_STORE_ID,
                cashierRemark: cashierRemark.trim() || undefined,
            });

            const slip = response?.data?.slip || response?.data || response;
            setCreatedSlip(slip);
            toast.success(`Advance slip ${slip.slipNumber || ""} submitted — waiting for manager approval.`);
            onCreated?.(slip);
        } catch (error) {
            toast.error(error?.message || "Unable to create advance slip.");
        }
    };

    useEffect(() => {
        if (!open) return;

        const timer = setTimeout(() => {
            timeOfDayRef.current?.focus();
        }, 100);

        return () => clearTimeout(timer);
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                if (createdSlip) {
                    handlePrint();
                } else {
                    handleSubmit();
                }
            }

            if (e.key === "Escape") {
                e.preventDefault();
                handleClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, createdSlip, handleSubmit, handlePrint]);

    return (
        <>
            <KitModal
                isOpen={open}
                onClose={handleClose}
                maxWidth="sm"
                title={<div className="text-base font-semibold">Create Advance Slip</div>}
                titleClass="border-b p-3!"
            >
                <div className="p-4 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div className="font-semibold">Name</div>
                        <div>{getPersonDisplayName(userData)}</div>
                    </div>

                    <KitTextField
                        inputRef={timeOfDayRef}
                        label="Time of Day"
                        size="small"
                        value={timeOfDay}
                        onChange={(e) => setTimeOfDay(e.target.value)}
                    />

                    <KitSelect
                        label="Given to"
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
                        label="Amount"
                        type="number"
                        size="small"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />

                    <KitTextField
                        label="Remark (optional)"
                        size="small"
                        multiline
                        minRows={2}
                        value={cashierRemark}
                        onChange={(e) => setCashierRemark(e.target.value)}
                    />

                    {createdSlip && (
                        <Typography className="text-sm! text-amber-700">
                            Slip {createdSlip.slipNumber} is pending manager approval.
                        </Typography>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <KitButton variant="outlined" size="small" className="w-auto" onClick={handleClose}>
                            Close
                        </KitButton>
                        {createdSlip && (
                            <KitButton variant="outlined" size="small" className="w-auto" onClick={handlePrint}>
                                Print
                            </KitButton>
                        )}
                        {!createdSlip && (
                            <KitButton
                                variant="contained"
                                size="small"
                                className="w-auto"
                                isLoading={isCreatingAdvanceSlip}
                                onClick={handleSubmit}
                            >
                                Submit
                            </KitButton>
                        )}
                    </div>
                </div>
            </KitModal>

            <div className="fixed -left-[10000px] top-0 -z-10">
                <div ref={printRef}>
                    <AdvanceSlipPrintLayout slip={printSlipData || {}} userData={userData} />
                </div>
            </div>
        </>
    );
}
