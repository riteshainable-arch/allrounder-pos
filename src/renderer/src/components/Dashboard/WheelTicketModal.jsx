import { useEffect, useRef, useState } from "react";
import KitModal from "../../../../kit/components/KitModal";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import { API_VERSION } from "../../../../kit/hooks/data/fetchers";
import API from "../../../../kit/hooks/data/services/axiosService";
import { priceFormat } from "../../../../kit/utils/priceFormat";

const VERIFY_PATH = `${API_VERSION}/admin/coupons/wheel/ticket/verify`;
const PHONE_RE = /^[0-9]{10}$/;
const TICKET_PREFIX = "TKT";

// The "TKT" prefix is shown in the field already, so the cashier only types the rest (e.g. 1021).
// A pasted full ticket number ("TKT1021") is accepted too - the prefix is stripped.
const cleanTicketSuffix = (value) => {
    const upper = String(value ?? "").toUpperCase().replace(/\s+/g, "");
    return upper.startsWith(TICKET_PREFIX) ? upper.slice(TICKET_PREFIX.length) : upper;
};

const errorText = (error, fallback) =>
    Array.isArray(error)
        ? error[0]?.detail || error[0]?.message || fallback
        : typeof error === "string"
          ? error
          : error?.response?.data?.message || error?.message || fallback;

const discountText = (c) =>
    c?.discountType === "PERCENTAGE"
        ? `${c.discountValue}% off${c.maxDiscountAmount ? ` (max ${priceFormat(c.maxDiscountAmount)})` : ""}`
        : `${priceFormat(c?.discountValue || 0)} off`;

/**
 * Wheel coupon bill. The customer shows the wheel ticket printed with an earlier bill. The cashier enters the
 * customer number + ticket number, the server checks them (own ticket, unused, valid today) and returns every
 * wheel coupon. The wheel itself is played offline - the cashier just picks the coupon the customer won.
 */
export default function WheelTicketModal({ open, onClose, customerPhone, storeId, items, cartItemCodes = [], onSelect }) {
    const billPhone = String(customerPhone || "").trim();
    const [phone, setPhone] = useState(PHONE_RE.test(billPhone) ? billPhone : "");
    const [ticketNo, setTicketNo] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const phoneRef = useRef(null);
    const ticketRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const timer = window.setTimeout(() => {
            (PHONE_RE.test(billPhone) ? ticketRef : phoneRef).current?.focus();
        }, 80);
        return () => window.clearTimeout(timer);
    }, [open, billPhone]);

    // The collect-payment screen closes itself on Escape / generates on F2; keep those inside this dialog.
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                onClose?.();
            } else if (e.key === "F2") {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        window.addEventListener("keydown", handler, true);
        return () => window.removeEventListener("keydown", handler, true);
    }, [open, onClose]);

    const verify = async () => {
        const cleanPhone = phone.trim();
        const suffix = cleanTicketSuffix(ticketNo);
        const cleanTicket = suffix ? `${TICKET_PREFIX}${suffix}` : "";
        setResult(null);
        setSelectedId(null);
        if (!PHONE_RE.test(cleanPhone)) return setError("Enter the customer's 10-digit mobile number.");
        if (!cleanTicket) return setError("Enter the ticket number.");
        if (!PHONE_RE.test(billPhone)) {
            return setError("Add this customer's number on the bill first, then use the ticket.");
        }
        if (cleanPhone !== billPhone) {
            return setError(`This bill is for ${billPhone}. The ticket must belong to the same customer.`);
        }
        setLoading(true);
        setError("");
        try {
            const res = await API.post(VERIFY_PATH, {
                ticketNo: cleanTicket,
                customerPhone: cleanPhone,
                storeId,
                items,
            });
            const data = res?.data ?? null;
            setResult(data);
            const first = (data?.coupons || []).find((c) => c.isApplicable) || data?.coupons?.[0];
            setSelectedId(first ? first.id : null);
            if (!data?.coupons?.length) setError("Ticket is valid, but no wheel coupon is active right now.");
        } catch (err) {
            setError(errorText(err, "Unable to verify the ticket."));
        } finally {
            setLoading(false);
        }
    };

    const selected = result?.coupons?.find((c) => c.id === selectedId) || null;

    const confirm = () => {
        if (!selected || !result?.ticket) return;
        onSelect?.({ coupon: selected, ticketNo: result.ticket.ticketNo });
    };

    const onTicketKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            if (!loading) verify();
        }
    };

    return (
        <KitModal
            maxWidth="sm"
            isOpen={open}
            onClose={onClose}
            title={
                <div className="min-w-0">
                    <div className="text-lg font-bold leading-tight text-third-950">Wheel coupon bill</div>
                    <div className="mt-0.5 text-xs text-third-500">
                        Customer number + ticket number, then pick the coupon the customer won.
                    </div>
                </div>
            }
            titleClass="px-4! py-2! border-b"
        >
            <div data-shortcut-ignore className="flex flex-col gap-3 px-4 py-3">
                <div className="flex items-end gap-2">
                    <div className="w-40 shrink-0">
                        <KitTextField
                            inputRef={phoneRef}
                            fullWidth
                            size="small"
                            label="Customer number"
                            placeholder="10-digit mobile"
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                                setResult(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    ticketRef.current?.focus();
                                }
                            }}
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <KitTextField
                            inputRef={ticketRef}
                            fullWidth
                            size="small"
                            label="Ticket number"
                            placeholder="e.g. 1021"
                            startIcon={<span className="text-sm font-semibold text-third-700">{TICKET_PREFIX}</span>}
                            value={ticketNo}
                            onChange={(e) => {
                                setTicketNo(cleanTicketSuffix(e.target.value));
                                setResult(null);
                            }}
                            onKeyDown={onTicketKeyDown}
                        />
                    </div>
                    <KitButton variant="contained" size="small" className="w-auto" disabled={loading} isLoading={loading} onClick={verify}>
                        Verify
                    </KitButton>
                </div>

                {error && (
                    <div
                        className="flex items-start gap-2 rounded-md border-2 border-red-400 bg-red-50 px-3 py-2.5 text-red-700"
                        role="alert"
                    >
                        <i className="tabler-alert-circle mt-0.5 text-lg" />
                        <div className="min-w-0">
                            <div className="text-xs font-bold uppercase tracking-wide">Ticket not accepted</div>
                            <div className="text-sm font-semibold">{error}</div>
                        </div>
                    </div>
                )}

                {result?.ticket && (
                    <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
                        Ticket <b>{result.ticket.ticketNo}</b> · Bill {result.ticket.invoiceNo} · valid today
                        {result.ticket.customerName ? ` · ${result.ticket.customerName}` : ""}
                    </div>
                )}

                {result?.coupons?.length > 0 && (
                    <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto custom-scroll">
                        <div className="text-xs font-semibold text-third-700">Wheel coupons - select the one the customer won</div>
                        {result.coupons.map((c) => {
                            const isSelected = c.id === selectedId;
                            const codes = (c.itemCodes || []).map((code) => String(code).trim().toLowerCase());
                            const inCart = codes.some((code) => cartItemCodes.includes(code));
                            return (
                                <label
                                    key={c.id}
                                    className={`flex cursor-pointer items-start gap-2 rounded-md border px-2.5 py-2 ${
                                        isSelected ? "border-primary bg-primary/5" : "border-app-border bg-app-paper"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="wheel-coupon"
                                        className="mt-1"
                                        checked={isSelected}
                                        onChange={() => setSelectedId(c.id)}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 text-sm font-semibold text-third-800">
                                            <span>{c.code}</span>
                                            <span className="truncate font-normal text-third-500">{c.name}</span>
                                        </div>
                                        <div className="text-[11px] text-third-600">
                                            {(c.items || []).map((i) => i.itemName).join(", ")} · {discountText(c)}
                                            {c.minBillAmount ? ` · min bill ${priceFormat(c.minBillAmount)}` : ""}
                                        </div>
                                        <div className={`text-[11px] ${inCart ? "text-green-700" : "text-amber-700"}`}>
                                            {inCart ? "Item is on the bill" : "Item will be added to the bill"}
                                        </div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                    <KitButton variant="outlined" size="small" className="w-auto" onClick={onClose}>
                        Cancel
                    </KitButton>
                    <KitButton variant="contained" size="small" className="w-auto" disabled={!selected} onClick={confirm}>
                        Use selected coupon
                    </KitButton>
                </div>
            </div>
        </KitModal>
    );
}
