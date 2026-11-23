import { useEffect, useMemo, useState } from "react";
import KitModal from "../../../../kit/components/KitModal";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import { getLoyaltyRewards } from "../../../../kit/hooks/data/loyalty";

const errorText = (error, fallback) =>
    Array.isArray(error)
        ? error[0]?.detail || error[0]?.message || fallback
        : typeof error === "string"
          ? error
          : error?.response?.data?.message || error?.message || fallback;

const roundPoints = (n) => Math.round(Number(n || 0) * 1000) / 1000;

/**
 * Reward items the customer can take FREE for loyalty points. The server decides which items the balance can
 * afford; the cashier picks the quantities. `current` = reward rows already on the bill (so they can be changed).
 */
export default function LoyaltyRewardModal({ open, onClose, customerPhone, storeId, current = [], onApply }) {
    // Mounted only while open, so it starts in the loading state.
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [data, setData] = useState(null);
    const [qtyById, setQtyById] = useState({});

    useEffect(() => {
        if (!open) return undefined;
        let active = true;
        getLoyaltyRewards(customerPhone, storeId)
            .then((result) => {
                if (!active) return;
                setData(result);
                const initial = {};
                current.forEach((row) => {
                    initial[row.rewardId] = Number(row.quantity) || 0;
                });
                setQtyById(initial);
            })
            .catch((err) => active && setError(errorText(err, "Unable to load loyalty reward items.")))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, customerPhone, storeId]);

    // The collect-payment screen / billing shortcuts must not fire while this dialog is open.
    useEffect(() => {
        if (!open) return undefined;
        const handler = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                onClose?.();
            }
        };
        window.addEventListener("keydown", handler, true);
        return () => window.removeEventListener("keydown", handler, true);
    }, [open, onClose]);

    const balance = Number(data?.balance ?? 0);
    const rewards = useMemo(() => data?.rewards ?? [], [data]);

    const usedPoints = useMemo(
        () =>
            roundPoints(
                rewards.reduce((sum, reward) => sum + Number(reward.pointsRequired) * Number(qtyById[reward.id] || 0), 0)
            ),
        [rewards, qtyById]
    );
    const left = roundPoints(balance - usedPoints);

    const maxFor = (reward) => {
        const others = usedPoints - Number(reward.pointsRequired) * Number(qtyById[reward.id] || 0);
        const byPoints = Math.floor(roundPoints(balance - others + 1e-9) / Number(reward.pointsRequired));
        const cap = reward.maxQtyPerBill ? Math.min(reward.maxQtyPerBill, byPoints) : byPoints;
        return Math.max(0, cap);
    };

    const setQty = (reward, next) => {
        const qty = Math.max(0, Math.min(maxFor(reward), Math.floor(Number(next) || 0)));
        setQtyById((prev) => ({ ...prev, [reward.id]: qty }));
    };

    const selected = rewards.filter((reward) => Number(qtyById[reward.id] || 0) > 0);

    const apply = () => {
        onApply?.(selected.map((reward) => ({ reward, qty: Number(qtyById[reward.id]) })));
    };

    return (
        <KitModal
            maxWidth="sm"
            isOpen={open}
            onClose={onClose}
            title={
                <div className="min-w-0">
                    <div className="text-lg font-bold leading-tight text-third-950">Loyalty reward items</div>
                    <div className="mt-0.5 text-xs text-third-500">
                        Customer takes these items free by spending loyalty points.
                    </div>
                </div>
            }
            titleClass="px-4! py-2! border-b"
        >
            <div data-shortcut-ignore className="flex flex-col gap-3 px-4 py-3">
                {loading && <div className="py-6 text-center text-sm text-third-500">Loading reward items...</div>}

                {error && (
                    <div
                        className="flex items-start gap-2 rounded-md border-2 border-red-400 bg-red-50 px-3 py-2.5 text-red-700"
                        role="alert"
                    >
                        <i className="tabler-alert-circle mt-0.5 text-lg" />
                        <div className="text-sm font-semibold">{error}</div>
                    </div>
                )}

                {data && (
                    <>
                        <div className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-2 text-sm">
                            <span>
                                Available points: <b>{balance}</b>
                            </span>
                            <span className={left < 0 ? "text-red-600" : "text-green-700"}>
                                Using <b>{usedPoints}</b> · Left <b>{left}</b>
                            </span>
                        </div>

                        {!rewards.length && (
                            <div className="rounded-md border border-dashed border-gray-300 px-3 py-6 text-center text-sm text-third-500">
                                No reward items are set up right now. Admin can add them in Loyalty &gt; Reward Items.
                            </div>
                        )}

                        <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto custom-scroll">
                            {rewards.map((reward) => {
                                const qty = Number(qtyById[reward.id] || 0);
                                const max = maxFor(reward);
                                const affordable = reward.canRedeem || qty > 0;
                                return (
                                    <div
                                        key={reward.id}
                                        className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${
                                            qty > 0 ? "border-green-400 bg-green-50" : "border-gray-200"
                                        } ${affordable ? "" : "opacity-60"}`}
                                    >
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-semibold text-third-900">
                                                {reward.itemName || reward.itemCode}
                                            </div>
                                            <div className="text-xs text-third-500">
                                                {reward.pointsRequired} pts each
                                                {reward.maxQtyPerBill ? ` · max ${reward.maxQtyPerBill} per bill` : ""}
                                                {!reward.canRedeem && qty === 0 ? ` · ${reward.pointsShort} more pts needed` : ""}
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1.5">
                                            <KitButton
                                                variant="outlined"
                                                size="small"
                                                className="w-auto! min-w-8!"
                                                disabled={qty <= 0}
                                                onClick={() => setQty(reward, qty - 1)}
                                            >
                                                -
                                            </KitButton>
                                            <span className="w-7 text-center text-sm font-bold">{qty}</span>
                                            <KitButton
                                                variant="outlined"
                                                size="small"
                                                className="w-auto! min-w-8!"
                                                disabled={qty >= max}
                                                onClick={() => setQty(reward, qty + 1)}
                                            >
                                                +
                                            </KitButton>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                <div className="flex justify-end gap-2 pt-1">
                    <KitButton variant="outlined" size="small" className="w-auto" onClick={onClose}>
                        Cancel
                    </KitButton>
                    {current.length > 0 && selected.length === 0 && data && (
                        <KitButton variant="outlined" color="error" size="small" className="w-auto" onClick={() => onApply?.([])}>
                            Remove reward items
                        </KitButton>
                    )}
                    <KitButton variant="contained" size="small" className="w-auto" disabled={!selected.length} onClick={apply}>
                        {selected.length ? `Add to bill (${usedPoints} pts)` : "Add to bill"}
                    </KitButton>
                </div>
            </div>
        </KitModal>
    );
}
