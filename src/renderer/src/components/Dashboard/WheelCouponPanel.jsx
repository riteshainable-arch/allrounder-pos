import { useCallback, useEffect, useState } from "react";
import { Chip, Tooltip } from "@mui/material";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import { API_VERSION } from "../../../../kit/hooks/data/fetchers";
import API from "../../../../kit/hooks/data/services/axiosService";
import { priceFormat } from "../../../../kit/utils/priceFormat";

const WHEEL_PATH = `${API_VERSION}/admin/coupons/wheel`;
const PHONE_RE = /^[0-9]{10}$/;

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

/** Collection screen: the customer's wheel coupons (apply / why not) + assign a new one. */
export default function WheelCouponPanel({ customerPhone, storeId, items, appliedCode, disabled, isApplying, onApply }) {
    const phone = String(customerPhone || "").trim();
    const hasPhone = PHONE_RE.test(phone);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [showAssign, setShowAssign] = useState(false);
    const [activeCoupons, setActiveCoupons] = useState([]);
    const [assignId, setAssignId] = useState("");
    const [assigning, setAssigning] = useState(false);
    const [assignMessage, setAssignMessage] = useState({ text: "", isError: false });

    const load = useCallback(async () => {
        if (!hasPhone) {
            setCoupons([]);
            return;
        }
        setLoading(true);
        try {
            const res = await API.post(`${WHEEL_PATH}/customer`, { customerPhone: phone, storeId, items });
            setCoupons(res?.data?.coupons ?? []);
            setMessage("");
        } catch (error) {
            setCoupons([]);
            setMessage(errorText(error, "Unable to load wheel coupons."));
        } finally {
            setLoading(false);
        }
    }, [hasPhone, phone, storeId, items]);

    useEffect(() => {
        load();
    }, [load]);

    const openAssign = async () => {
        const next = !showAssign;
        setShowAssign(next);
        setAssignMessage({ text: "", isError: false });
        if (!next) return;
        try {
            const res = await API.get(`${WHEEL_PATH}/active`, { storeId });
            const list = res?.data ?? [];
            setActiveCoupons(list);
            setAssignId(list[0] ? String(list[0].id) : "");
        } catch (error) {
            setActiveCoupons([]);
            setAssignMessage({ text: errorText(error, "Unable to load wheel coupons."), isError: true });
        }
    };

    const assign = async () => {
        if (!assignId || !hasPhone) return;
        setAssigning(true);
        try {
            const res = await API.post(`${WHEEL_PATH}/assign`, {
                couponId: Number(assignId),
                customerPhone: phone,
                storeId,
                assignedFrom: "POS",
            });
            const skipped = res?.data?.skipped?.[0];
            setAssignMessage(
                skipped
                    ? { text: skipped.reason, isError: true }
                    : { text: res?.message || "Coupon assigned.", isError: false }
            );
            if (!skipped) setShowAssign(false);
            load();
        } catch (error) {
            setAssignMessage({ text: errorText(error, "Unable to assign coupon."), isError: true });
        } finally {
            setAssigning(false);
        }
    };

    if (!hasPhone) return null;

    return (
        <div data-shortcut-ignore className="rounded-lg border border-dashed border-app-border bg-calendar-bg px-3 py-2">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="text-sm font-semibold text-third-800">Wheel coupons</div>
                    <div className="text-[11px] text-third-500">
                        {loading ? "Checking..." : coupons.length ? `${coupons.length} assigned to this customer` : "None assigned"}
                    </div>
                </div>
                <KitButton variant="outlined" size="small" className="w-auto" onClick={openAssign}>
                    {showAssign ? "Close" : "+ Assign"}
                </KitButton>
            </div>

            {showAssign && (
                <div className="mt-2 flex items-center gap-2">
                    <select
                        value={assignId}
                        onChange={(e) => setAssignId(e.target.value)}
                        className="h-8 flex-1 rounded-md border border-app-border bg-app-paper px-2 text-sm text-third-800 outline-none"
                    >
                        {!activeCoupons.length && <option value="">No wheel coupon to assign</option>}
                        {activeCoupons.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.code} — {c.name} ({discountText(c)})
                                {c.remainingToAssign != null ? ` · ${c.remainingToAssign} left` : ""}
                            </option>
                        ))}
                    </select>
                    <KitButton
                        variant="contained"
                        size="small"
                        className="w-auto"
                        disabled={!assignId || assigning}
                        isLoading={assigning}
                        onClick={assign}
                    >
                        Assign
                    </KitButton>
                </div>
            )}
            {assignMessage.text && (
                <div className={`mt-1 text-xs ${assignMessage.isError ? "text-red-600" : "text-green-700"}`}>{assignMessage.text}</div>
            )}

            {coupons.length > 0 && (
                <div className="mt-2 flex flex-col gap-1.5">
                    {coupons.map((c) => {
                        const isApplied = appliedCode && appliedCode.toUpperCase() === String(c.code).toUpperCase();
                        return (
                            <div
                                key={c.assignment?.id ?? c.id}
                                className="flex items-center justify-between gap-2 rounded-md border border-app-border bg-app-paper px-2 py-1.5"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 text-sm font-semibold text-third-800">
                                        <span>{c.code}</span>
                                        <span className="truncate font-normal text-third-500">{c.name}</span>
                                    </div>
                                    <div className={`text-[11px] ${c.isApplicable ? "text-green-700" : "text-red-600"}`}>
                                        {discountText(c)}
                                        {c.minBillAmount ? ` · min bill ${priceFormat(c.minBillAmount)}` : ""}
                                        {" · "}
                                        {c.isApplicable ? `Save ${priceFormat(c.discountAmount)}` : c.errors?.[0] || c.message}
                                    </div>
                                </div>
                                {isApplied ? (
                                    <Chip size="small" color="success" label="Applied" />
                                ) : (
                                    <Tooltip title={c.isApplicable ? "" : c.errors?.[0] || ""}>
                                        <span>
                                            <KitButton
                                                variant="contained"
                                                size="small"
                                                className="w-auto"
                                                disabled={!c.isApplicable || disabled || isApplying}
                                                onClick={() => onApply?.(c.code)}
                                            >
                                                Apply
                                            </KitButton>
                                        </span>
                                    </Tooltip>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            {message && <div className="mt-1 text-xs text-red-600">{message}</div>}
        </div>
    );
}

/** Small chip next to the customer phone: how many wheel coupons the customer has. */
export function WheelCouponBadge({ customerPhone, storeId }) {
    const phone = String(customerPhone || "").trim();
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        if (!PHONE_RE.test(phone)) {
            setSummary(null);
            return;
        }
        let active = true;
        API.get(`${WHEEL_PATH}/customer`, { customerPhone: phone, storeId })
            .then((res) => active && setSummary(res?.data ?? null))
            .catch(() => active && setSummary(null));
        return () => {
            active = false;
        };
    }, [phone, storeId]);

    if (!summary?.totalAssigned) return null;
    const codes = (summary.coupons || []).map((c) => `${c.code} (${discountText(c)})`).join(", ");
    return (
        <Tooltip title={`Apply at Collect Payment: ${codes}`}>
            <Chip
                size="small"
                color="secondary"
                variant="outlined"
                label={`Wheel coupon: ${summary.totalAssigned}`}
                className="text-xs!"
            />
        </Tooltip>
    );
}
