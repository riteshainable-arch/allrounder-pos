import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import debounce from "lodash/debounce";
import { mutate } from "swr";
import KitModal from "../../../../kit/components/KitModal";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitSelect from "../../../../kit/components/KitSelect";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import NumberSpinner from "../../../../kit/components/KitNumberSpinner";
import {
    useCreateSaleReturn,
    useVerifySaleReturnManager,
    getOriginalInvoice,
    previewSaleReturn,
} from "../../../../kit/hooks/data/saleReturn";
import { useUsersDropdown } from "../../../../kit/hooks/data/users";
import useUser from "../../../../kit/hooks/useUser";
import { parseApiList, buildUserLabel } from "../../../../kit/utils/parseApiList";
import { getPersonDisplayName } from "../../../../kit/utils/invoiceBill";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import { formatBillPaymentsSummary } from "../../../../kit/utils/billPayments";
import {
    applyPaidItemReturnQty,
    buildReturnDisplayRows,
    buildSelectionItems,
    getItemMaxReturnable,
    getPreviewErrorForBundle,
    invalidateSettlementCaches,
    parseOriginalInvoiceResponse,
    parsePreviewResponse,
} from "../../../../kit/utils/saleReturn";
import SrnPrintModal from "./SrnPrintModal";
import SaleReturnInvoicePicker from "./SaleReturnInvoicePicker";
import { toast } from "react-toastify";
import ShortcutBadge from "../Dashboard/ShortcutBadge";

const DEFAULT_STORE_ID = 1;

export default function SaleReturnModal({ open, onClose, onSuccess }) {
    const userData = useUser();
    const managerSelectRef = useRef(null);
    const backButtonRef = useRef(null);
    const approveRefundButtonRef = useRef(null);
    const spinnerRefs = useRef([]);
    const notesRef = useRef(null);
    const storeId = userData?.storeId || DEFAULT_STORE_ID;

    const [step, setStep] = useState("unlock");
    const [managerId, setManagerId] = useState("");
    const [unlockPassword, setUnlockPassword] = useState("");
    const [initiatedBy, setInitiatedBy] = useState(null);
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
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [bannerError, setBannerError] = useState("");
    const [refundMode, setRefundMode] = useState("cash");

    const { verifyManager, isVerifyingManager } = useVerifySaleReturnManager();
    const { createSaleReturn, isCreatingSaleReturn } = useCreateSaleReturn();
    const { usersDropdown, isUsersDropdownLoading } = useUsersDropdown(
        { role: "manager" },
        open
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

    const { bill, items, offerBundles } = invoiceData;

    const resetAll = useCallback(() => {
        setStep("unlock");
        setManagerId("");
        setUnlockPassword("");
        setInitiatedBy(null);
        setLoadedInvoiceNo("");
        setInvoiceData({ bill: {}, items: [], offerBundles: [] });
        setSelectedQty({});
        setPreview({ isValid: false, errors: [], refundAmount: 0, items: [] });
        setApproveOpen(false);
        setApprovePassword("");
        setNotes("");
        setBannerError("");
    }, []);

    useEffect(() => {
        if (!open) {
            resetAll();
        }
    }, [open, resetAll]);

    const runPreview = useMemo(
        () =>
            debounce(async (invoice, selection, currentStoreId) => {
                const selectionItems = buildSelectionItems(selection);
                if (!selectionItems.length) {
                    setPreview({ isValid: false, errors: [], refundAmount: 0, items: [] });
                    setIsPreviewLoading(false);
                    return;
                }

                try {
                    const response = await previewSaleReturn({
                        originalInvoiceNo: invoice,
                        storeId: currentStoreId,
                        items: selectionItems,
                    });
                    setPreview(parsePreviewResponse(response));
                } catch (error) {
                    setPreview({
                        isValid: false,
                        errors: [{ message: error?.message || "Preview failed." }],
                        refundAmount: 0,
                        items: [],
                    });
                } finally {
                    setIsPreviewLoading(false);
                }
            }, 400),
        []
    );

    useEffect(() => {
        if (step !== "select" || !loadedInvoiceNo) return;

        setIsPreviewLoading(true);
        runPreview(loadedInvoiceNo, selectedQty, storeId);

        return () => runPreview.cancel();
    }, [loadedInvoiceNo, runPreview, selectedQty, step, storeId]);

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
            setInitiatedBy(payload.manager || selectedManager);
            setUnlockPassword("");
            setStep("search");
            toast.success("Sale return unlocked.");
        } catch (error) {
            toast.error(error?.message || "Invalid manager credentials.");
        }
    };

    const handleProceedReturn = async (invoiceNo) => {
        const trimmed = invoiceNo?.trim();
        if (!trimmed) return;

        setIsLoadingInvoice(true);
        setBannerError("");
        try {
            const response = await getOriginalInvoice(trimmed, { storeId });
            const parsed = parseOriginalInvoiceResponse(response);

            if (parsed.bill.fullyReturned) {
                toast.info("This invoice is fully returned.");
            }

            setInvoiceData(parsed);
            setLoadedInvoiceNo(trimmed);
            setSelectedQty({});
            setStep("select");
        } catch (error) {
            toast.error(error?.message || "Unable to load invoice for return.");
        } finally {
            setIsLoadingInvoice(false);
        }
    };

    const displayRows = useMemo(
        () => buildReturnDisplayRows(items, offerBundles),
        [items, offerBundles]
    );

    const handleItemQtyChange = (item, qty, rowMeta = {}) => {
        const max = getItemMaxReturnable(item);

        if (rowMeta.isOfferFree) {
            return;
        }

        if (rowMeta.bundle) {
            const patch = applyPaidItemReturnQty(item, items, rowMeta.bundle, qty);
            setSelectedQty((prev) => ({ ...prev, ...patch }));
            return;
        }

        setSelectedQty((prev) => ({
            ...prev,
            [item.id]: Math.max(0, Math.min(max, qty)),
        }));
    };

    const handleClosePrintModal = () => {
        setPrintModalOpen(false);
        setPrintPayload(null);
    };

    const handleApproveSubmit = async () => {
        if (!approvePassword.trim()) {
            toast.warning("Enter manager password to approve.");
            return;
        }

        const selectionItems = buildSelectionItems(selectedQty);
        setBannerError("");

        try {
            const response = await createSaleReturn({
                originalInvoiceNo: loadedInvoiceNo,
                storeId,
                items: selectionItems,
                managerEmail: initiatedBy?.email || selectedManager?.email,
                managerPassword: approvePassword,
                initiatedById: initiatedBy?.id,
                refundMode: refundMode,
                notes: notes.trim() || undefined,
            });

            const payload = response?.data ?? response;
            setPrintPayload(payload);
            setApproveOpen(false);
            toast.success(`SRN ${payload?.srn?.srnNumber || ""} created. Refund ${priceFormat(payload?.srn?.refundAmount || preview.refundAmount)}.`);

            await invalidateSettlementCaches(mutate);
            onSuccess?.(payload);

            onClose?.();
            setPrintModalOpen(true);
        } catch (error) {
            setBannerError(error?.message || "Unable to create sale return.");
        }
    };

    const isLoading = isVerifyingManager || isLoadingInvoice || isCreatingSaleReturn;

    useEffect(() => {
        if (!open) return;

        const timer = setTimeout(() => {
            managerSelectRef.current?.focus();
        }, 100);

        return () => clearTimeout(timer);
    }, [open]);

    useEffect(() => {
        if (step !== "select") return;

        const timer = setTimeout(() => {
            const firstSpinner = spinnerRefs.current.find(Boolean);
            firstSpinner?.focus();
        }, 100);

        return () => clearTimeout(timer);
    }, [step, displayRows]);

    useEffect(() => {
        if (!approveOpen) return;

        const timer = setTimeout(() => {
            notesRef.current?.focus();
        }, 100);

        return () => clearTimeout(timer);
    }, [approveOpen]);

    useEffect(() => {
        if (step !== "select") return;

        const handleKeyDown = (e) => {
            if (!e.altKey) return;

            switch (e.key.toLowerCase()) {
                case "b":
                    e.preventDefault();
                    backButtonRef.current?.click();
                    break;

                case "s":
                    e.preventDefault();
                    approveRefundButtonRef.current?.click();
                    break;

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [step]);

    useEffect(() => {
        if (!approveOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleApproveSubmit();
            }

            if (e.key === "Escape") {
                e.preventDefault();
                setApproveOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [approveOpen, handleApproveSubmit]);

    return (
        <>
            <Backdrop open={isLoading || isPreviewLoading} sx={{ zIndex: 10000, color: "#fff" }}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <KitModal
                isOpen={open}
                onClose={onClose}
                maxWidth="lg"
                title={<div className="text-base font-semibold">Sale Return (SRN)</div>}
                titleClass="border-b p-3!"
            >
                <div className="p-4 flex flex-col gap-4 max-h-[78vh] overflow-y-auto">
                    {step === "unlock" && (
                        <>
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
                        </>
                    )}

                    {step === "search" && (
                        <SaleReturnInvoicePicker
                            initiatedBy={initiatedBy}
                            onProceed={handleProceedReturn}
                            onCancel={onClose}
                            isLoadingOriginal={isLoadingInvoice}
                        />
                    )}

                    {step === "select" && (
                        <>
                            {bannerError && <Alert severity="error">{bannerError}</Alert>}

                            <Alert severity="info" className="text-sm!">
                                Select return qty for each item. Free offer items are added automatically when you
                                return the paid item. Manager password is required on approve.
                            </Alert>

                            <Paper elevation={0} className="p-3 border border-gray-200 rounded-lg bg-transparent!">
                                <Typography className="font-semibold!">{bill.invoiceNo || loadedInvoiceNo}</Typography>
                                <Typography className="text-sm! text-third-500">
                                    {bill.date} · Customer: {getPersonDisplayName(bill.customer)} · Cashier:{" "}
                                    {getPersonDisplayName(bill.cashier)}
                                </Typography>
                                <Typography className="text-sm!">
                                    Total: {priceFormat(bill.totalAmount || 0)} · Returnable qty:{" "}
                                    {bill.totalReturnableQty ?? "-"}
                                </Typography>
                                <Typography className="text-xs! text-third-500 mt-1">
                                    {formatBillPaymentsSummary({ payments: bill.payments })}
                                </Typography>
                            </Paper>

                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Item</TableCell>
                                            <TableCell align="right">Original</TableCell>
                                            <TableCell align="right">Max Return</TableCell>
                                            <TableCell align="center" width={140}>
                                                Return Qty
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {displayRows.map((row, index) => {
                                            const { item, bundle, isOfferFree, isOfferPaid } = row;
                                            const max = getItemMaxReturnable(item);
                                            const disabled = max <= 0 || isOfferFree;
                                            const bundleError =
                                                bundle &&
                                                getPreviewErrorForBundle(
                                                    preview.errors,
                                                    bundle.offerGroupId
                                                );

                                            return (
                                                <TableRow
                                                    key={item.id}
                                                    className={isOfferFree ? "bg-slate-50" : undefined}
                                                >
                                                    <TableCell>
                                                        <div>{item.itemName || item.item_name}</div>
                                                        <Typography className="text-xs! text-third-500">
                                                            {item.itemCode || item.item_code}
                                                            {isOfferFree
                                                                ? " · Free (auto with offer)"
                                                                : isOfferPaid
                                                                    ? " · Offer item"
                                                                    : ""}
                                                        </Typography>
                                                        {bundleError && isOfferPaid && (
                                                            <Typography className="text-xs! text-red-600 mt-1">
                                                                {bundleError.message}
                                                            </Typography>
                                                        )}
                                                        {Number(item.alreadyReturnedQty) > 0 && (
                                                            <Chip
                                                                size="small"
                                                                variant="outlined"
                                                                label={`Returned: ${item.alreadyReturnedQty} of ${item.qty}`}
                                                                className="mt-1!"
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right">{item.qty}</TableCell>
                                                    <TableCell align="right">{max}</TableCell>
                                                    <TableCell align="center">
                                                        {isOfferFree ? (
                                                            <Typography className="text-sm! font-medium! text-third-500">
                                                                {selectedQty[item.id] || 0}
                                                            </Typography>
                                                        ) : (
                                                            <NumberSpinner
                                                                ref={(el) => {
                                                                    spinnerRefs.current[index] = el;
                                                                }}
                                                                value={selectedQty[item.id] || 0}
                                                                min={0}
                                                                max={max}
                                                                disabled={disabled}
                                                                onValueChange={(qty) =>
                                                                    handleItemQtyChange(item, qty, row)
                                                                }
                                                            />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {preview.errors
                                .filter((error) => !error.offerGroupId)
                                .map((error, index) => (
                                    <Alert key={index} severity="warning">
                                        {error.message}
                                    </Alert>
                                ))}

                            <Divider />

                            <div className="flex justify-between items-center">
                                <div>
                                    <Typography className="text-sm!">
                                        Refund: <b>{priceFormat(preview.refundAmount || 0)}</b>
                                    </Typography>
                                    {!preview.isValid && buildSelectionItems(selectedQty).length > 0 && (
                                        <Typography className="text-xs! text-red-600">
                                            Fix selection errors to approve.
                                        </Typography>
                                    )}
                                </div>
                                <div className="flex gap-2 pt-3">
                                    <KitButton variant="outlined" size="small" className="w-auto" onClick={onClose}>
                                        Cancel
                                    </KitButton>
                                    <div className="relative">
                                        <ShortcutBadge shortcut="Alt + B" className="-top-5" />
                                        <KitButton ref={backButtonRef} variant="outlined" size="small" className="w-auto" onClick={() => setStep("search")}>
                                            Back
                                        </KitButton>
                                    </div>
                                    <div className="relative">
                                        <ShortcutBadge shortcut="Alt + S" className="-top-5" />
                                        <KitButton
                                            ref={approveRefundButtonRef}
                                            variant="contained"
                                            color="warning"
                                            size="small"
                                            className="w-auto"
                                            disabled={!preview.isValid || preview.refundAmount <= 0}
                                            onClick={() => {
                                                setApprovePassword("");
                                                setApproveOpen(true);
                                            }}
                                        >
                                            Approve & Refund
                                        </KitButton>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </KitModal>

            <KitModal
                isOpen={approveOpen}
                onClose={() => setApproveOpen(false)}
                maxWidth="sm"
                title={<div className="text-base font-semibold">Approve & Refund</div>}
                titleClass="border-b p-3!"
            >
                <div className="p-4 flex flex-col gap-3">
                    <Typography className="text-sm!">
                        Refund amount: <b>{priceFormat(preview.refundAmount || 0)}</b> ({refundMode === "adjustment" ? "Adjustment" : "Cash"})
                    </Typography>
                    <KitTextField
                        ref={notesRef}
                        label="Notes (optional)"
                        size="small"
                        multiline
                        minRows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                    <FormControl>
                        <Typography className="text-sm! font-medium! mb-1">Refund Mode</Typography>
                        <RadioGroup
                            row
                            value={refundMode}
                            onChange={(e) => setRefundMode(e.target.value)}
                        >
                            <FormControlLabel
                                value="cash"
                                control={<Radio size="small" />}
                                label="Cash"
                            />

                            <FormControlLabel
                                value="adjustment"
                                control={<Radio size="small" />}
                                label="Adjustment"
                            />
                        </RadioGroup>
                    </FormControl>
                    <KitTextField
                        label="Manager Email"
                        size="small"
                        value={initiatedBy?.email || selectedManager?.email || ""}
                        disabled
                    />
                    <KitTextField
                        label="Manager Password"
                        type="password"
                        size="small"
                        value={approvePassword}
                        onChange={(e) => setApprovePassword(e.target.value)}
                    />
                    {bannerError && <Alert severity="error">{bannerError}</Alert>}
                    <div className="flex justify-end gap-2">
                        <KitButton variant="outlined" size="small" className="w-auto" onClick={() => setApproveOpen(false)}>
                            Cancel
                        </KitButton>
                        <KitButton
                            variant="contained"
                            color="warning"
                            size="small"
                            className="w-auto"
                            isLoading={isCreatingSaleReturn}
                            onClick={handleApproveSubmit}
                        >
                            Confirm Return
                        </KitButton>
                    </div>
                </div>
            </KitModal>

            <SrnPrintModal
                isOpen={printModalOpen}
                onClose={handleClosePrintModal}
                payload={printPayload}
            />
        </>
    );
}
