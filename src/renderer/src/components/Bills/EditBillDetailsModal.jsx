import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import KitModal from "../../../../kit/components/KitModal";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitSelect from "../../../../kit/components/KitSelect";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import { checkoutPaymentOptions } from "../../../../kit/configs/general";
import { editBillDetails } from "../../../../kit/hooks/data/invoice";
import { useUsersDropdown } from "../../../../kit/hooks/data/users";
import { getPaymentModeLabel, normalizeBillPayments } from "../../../../kit/utils/billPayments";
import { buildUserLabel, parseApiList } from "../../../../kit/utils/parseApiList";
import { priceFormat } from "../../../../kit/utils/priceFormat";

const PHONE_RE = /^[0-9]{10}$/;
const EDITABLE_MODES = new Set([...checkoutPaymentOptions.map((o) => o.value), "online", "card"]);

const errorText = (error, fallback) =>
    Array.isArray(error)
        ? error[0]?.detail || error[0]?.message || fallback
        : typeof error === "string"
          ? error
          : error?.response?.data?.message || error?.message || fallback;

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

/**
 * Edit bill details (manager approved): customer name, mobile, GST name / number and every part of the
 * payment split. The server does the real checks (settled bill, BUSY, SRN, loyalty ...) and the change is
 * mirrored into the locally stored bill so reprints show the corrected details.
 */
export default function EditBillDetailsModal({ isOpen, onClose, bill, onSaved }) {
    const billPayments = useMemo(() => normalizeBillPayments(bill), [bill]);
    // Discount-type rows (coupon, scheme, loyalty, SRN adjustment ...) are not money tendered: shown, never edited.
    const lockedParts = billPayments.filter((p) => !EDITABLE_MODES.has(p.paymentMode));
    // Cash is stored as the amount tendered; the change handed back is not part of the sale, so it is taken
    // off the cash part to get the real split.
    const changeAmount = Number(bill?.balanceToReturn || 0);
    const cashIndex = billPayments.filter((p) => EDITABLE_MODES.has(p.paymentMode)).findIndex((p) => p.paymentMode === "cash");
    const initialParts = billPayments
        .filter((p) => EDITABLE_MODES.has(p.paymentMode))
        .map((p, index) => {
            const amount = index === cashIndex ? Math.max(0, Number(p.amount) - changeAmount) : Number(p.amount);
            return { mode: p.paymentMode, amount: String(round2(amount)) };
        })
        .filter((p) => Number(p.amount) > 0);
    const splitTotal = round2(initialParts.reduce((sum, p) => sum + Number(p.amount), 0));

    const [name, setName] = useState(bill?.customerName || "");
    const [phone, setPhone] = useState(bill?.customerPhone || "");
    const [gstName, setGstName] = useState(bill?.customerGstName || "");
    const [gstNumber, setGstNumber] = useState(bill?.customerGstNumber || "");
    const [parts, setParts] = useState(initialParts.length ? initialParts : [{ mode: "cash", amount: String(splitTotal) }]);
    const [managerId, setManagerId] = useState("");
    const [managerPassword, setManagerPassword] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const { usersDropdown, isUsersDropdownLoading } = useUsersDropdown({ role: "manager" }, isOpen);
    const managerOptions = useMemo(
        () => parseApiList(usersDropdown).map((user) => ({ label: buildUserLabel(user), value: user.id })),
        [usersDropdown]
    );

    const modeOptions = useMemo(() => {
        const options = checkoutPaymentOptions.map((o) => ({ label: o.label, value: o.value }));
        initialParts.forEach((p) => {
            if (!options.some((o) => o.value === p.mode)) {
                options.push({ label: getPaymentModeLabel(p.mode), value: p.mode });
            }
        });
        return options;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bill]);

    const enteredTotal = round2(parts.reduce((sum, p) => sum + Number(p.amount || 0), 0));
    const difference = round2(splitTotal - enteredTotal);

    const setPart = (index, patch) =>
        setParts((prev) => prev.map((part, i) => (i === index ? { ...part, ...patch } : part)));

    const save = async () => {
        setError("");
        const trimmedName = name.trim();
        const trimmedPhone = phone.trim();
        if (!trimmedName) return setError("Customer name is required.");
        if (!PHONE_RE.test(trimmedPhone)) return setError("Mobile number must be exactly 10 digits.");
        const cleanParts = parts
            .map((p) => ({ mode: p.mode, amount: round2(p.amount) }))
            .filter((p) => p.amount > 0);
        if (!cleanParts.length) return setError("Add at least one payment part.");
        if (Math.abs(difference) > 0.009) {
            return setError(`Payment parts must add up to ${priceFormat(splitTotal)} (now ${priceFormat(enteredTotal)}).`);
        }
        if (!managerId) return setError("Select the approving manager.");
        if (!managerPassword) return setError("Enter the manager password.");

        const paymentsChanged =
            cleanParts.length !== initialParts.length ||
            cleanParts.some(
                (p) => !initialParts.some((i) => i.mode === p.mode && Math.abs(Number(i.amount) - p.amount) < 0.005)
            );

        const body = {
            indexNo: bill.indexNo,
            cashierId: bill.cashierId,
            ...(bill.invoiceNo && { invoiceNo: bill.invoiceNo }),
            date: bill.date,
            storeId: bill.storeId,
            customerName: trimmedName,
            customerPhone: trimmedPhone,
            ...(gstName.trim() !== (bill.customerGstName || "") && { gstName: gstName.trim() }),
            ...(gstNumber.trim().toUpperCase() !== (bill.customerGstNumber || "") && {
                gstNumber: gstNumber.trim().toUpperCase(),
            }),
            ...(paymentsChanged && { payments: cleanParts }),
            manager: { userId: managerId, password: managerPassword },
        };

        setSaving(true);
        try {
            const response = await editBillDetails(body);
            const server = response?.data?.bill;

            const payments = paymentsChanged
                ? [...lockedParts.map((p) => ({ ...p })), ...cleanParts.map((p) => ({ paymentMode: p.mode, mode: p.mode, amount: p.amount }))]
                : null;
            const cashAmount = cleanParts.filter((p) => p.mode === "cash").reduce((s, p) => s + p.amount, 0);

            const patch = {
                customerName: server?.customerName || trimmedName,
                customerPhone: server?.customerPhone || trimmedPhone,
                customerGstName: server?.gstName ?? gstName.trim(),
                customerGstNumber: server?.gstNumber ?? gstNumber.trim().toUpperCase(),
                ...(payments && {
                    payments,
                    billPayments: payments,
                    paymentMethod: payments.length === 1 ? payments[0].paymentMode : "mixed",
                    totalReceived: round2(payments.reduce((s, p) => s + Number(p.amount), 0)),
                    balanceToReturn: 0,
                    cashAmount: round2(cashAmount),
                    cashTendered: round2(cashAmount),
                    isCreditSale: cleanParts.some((p) => p.mode === "credit_sale"),
                }),
            };
            await window.api.updateBillDetails(bill.indexNo, patch);
            toast.success("Bill details updated.");
            onSaved?.({ ...bill, ...patch });
            onClose();
        } catch (err) {
            setError(errorText(err, "Unable to update the bill."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <KitModal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="sm"
            title={
                <div className="min-w-0">
                    <div className="text-base font-semibold">Edit bill details - {bill?.indexNo}</div>
                    <div className="text-xs text-third-500">Manager approval is needed to save.</div>
                </div>
            }
            titleClass="p-3! border-b!"
        >
            <div data-shortcut-ignore className="flex max-h-[78vh] flex-col gap-3 overflow-y-auto p-4">
                {error && (
                    <div className="rounded-md border-2 border-red-400 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" role="alert">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <KitTextField label="Customer Name" size="small" value={name} onChange={(e) => setName(e.target.value)} />
                    <KitTextField
                        label="Mobile Number"
                        size="small"
                        value={phone}
                        inputProps={{ maxLength: 10 }}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    />
                    <KitTextField label="GST Name" size="small" value={gstName} onChange={(e) => setGstName(e.target.value)} />
                    <KitTextField
                        label="GST Number"
                        size="small"
                        value={gstNumber}
                        inputProps={{ maxLength: 15 }}
                        onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    />
                </div>
                <div className="-mt-1 text-[11px] text-third-500">
                    Name / GST details are saved on the customer, so they update on all of this customer&apos;s bills. Changing the
                    mobile moves this bill (loyalty points, wheel ticket) to the new number.
                </div>

                <div className="rounded-md border border-gray-200 p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <div className="text-sm font-semibold">Payment</div>
                        <div className={`text-xs font-semibold ${Math.abs(difference) > 0.009 ? "text-red-600" : "text-green-700"}`}>
                            Bill {priceFormat(splitTotal)} | Entered {priceFormat(enteredTotal)}
                            {Math.abs(difference) > 0.009 ? ` | ${difference > 0 ? "Short" : "Extra"} ${priceFormat(Math.abs(difference))}` : " | OK"}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        {parts.map((part, index) => (
                            <div key={index} className="grid grid-cols-[1fr_130px_auto] items-end gap-2">
                                <KitSelect
                                    size="small"
                                    placeholderFontSize={14}
                                    inputFontSize={14}
                                    options={modeOptions}
                                    value={modeOptions.find((o) => o.value === part.mode) ?? null}
                                    onChange={(option) => setPart(index, { mode: option?.value ?? "cash" })}
                                />
                                <KitTextField
                                    size="small"
                                    type="number"
                                    value={part.amount}
                                    onChange={(e) => setPart(index, { amount: e.target.value })}
                                />
                                <KitButton
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    className="w-auto!"
                                    disabled={parts.length === 1}
                                    onClick={() => setParts((prev) => prev.filter((_, i) => i !== index))}
                                >
                                    Remove
                                </KitButton>
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <KitButton
                            variant="outlined"
                            size="small"
                            className="w-auto"
                            onClick={() =>
                                setParts((prev) => [
                                    ...prev,
                                    { mode: "upi", amount: difference > 0 ? String(difference) : "" },
                                ])
                            }
                        >
                            Add part
                        </KitButton>
                        {Math.abs(difference) > 0.009 && parts.length > 0 && (
                            <KitButton
                                variant="text"
                                size="small"
                                className="w-auto"
                                onClick={() =>
                                    setPart(parts.length - 1, {
                                        amount: String(round2(Number(parts[parts.length - 1].amount || 0) + difference)),
                                    })
                                }
                            >
                                Fix last part
                            </KitButton>
                        )}
                    </div>
                    {lockedParts.length > 0 && (
                        <div className="mt-2 text-[11px] text-third-500">
                            Not editable: {lockedParts.map((p) => `${getPaymentModeLabel(p.paymentMode)} ${priceFormat(p.amount)}`).join(", ")}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <KitSelect
                        label="Approved by (Manager)"
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
                        value={managerPassword}
                        onChange={(e) => setManagerPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !saving && save()}
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <KitButton variant="outlined" size="small" className="w-auto" onClick={onClose}>
                        Cancel
                    </KitButton>
                    <KitButton variant="contained" size="small" className="w-auto" isLoading={saving} disabled={saving} onClick={save}>
                        Save changes
                    </KitButton>
                </div>
            </div>
        </KitModal>
    );
}
