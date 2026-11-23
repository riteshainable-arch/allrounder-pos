import { useEffect, useRef } from "react";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import ShortcutBadge from "./ShortcutBadge";

/**
 * Loyalty points box on the billing screen. Points are not used as rupees - the cashier opens the reward
 * list and gives the customer products free for points.
 */
export default function LoyaltyRewardPanel({
    balance,
    balanceLoading = false,
    previewLoading = false,
    earnedPoints = 0,
    rewardRows = [],
    onOpen,
    disabled = false,
    disabledReason = "",
}) {
    const buttonRef = useRef(null);
    const pointsBalance = Number(balance?.balance ?? 0);
    const usedPoints = rewardRows.reduce(
        (sum, row) => sum + Number(row.rewardPointsPerUnit || 0) * Number(row.quantity || 0),
        0
    );
    const remaining = Math.max(0, Math.round((pointsBalance - usedPoints) * 1000) / 1000);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey && e.key.toLowerCase() === "u") {
                e.preventDefault();
                if (disabled) return;
                buttonRef.current?.click();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [disabled]);

    return (
        <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-evenly gap-2 px-3 py-3 text-center">
                <div className="flex flex-col items-center gap-0.5">
                    <div className="text-sm font-semibold text-third-500">Customer Loyalty Points</div>
                    <div className="text-base text-third font-semibold">
                        {balanceLoading ? "..." : `${pointsBalance} pts`}
                    </div>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                    <div className="text-sm font-semibold text-third-500">Earned on this bill</div>
                    <div className="text-base text-primary font-semibold">
                        {previewLoading ? "..." : `+${earnedPoints}`}
                    </div>
                </div>
                {rewardRows.length > 0 && (
                    <div className="w-full rounded-md bg-green-50 px-2 py-1.5 text-left text-xs text-green-800">
                        <div className="font-semibold">Free for points ({usedPoints} pts)</div>
                        {rewardRows.map((row) => (
                            <div key={row.id} className="flex justify-between gap-2">
                                <span className="truncate">{row.productName}</span>
                                <span className="shrink-0">x{row.quantity}</span>
                            </div>
                        ))}
                        <div className="mt-0.5 text-green-700">Left after bill: {remaining} pts</div>
                    </div>
                )}
                <div className="relative">
                    <ShortcutBadge shortcut="Alt + U" className="-top-2! -right-3! z-10" />
                    <KitButton
                        ref={buttonRef}
                        size="small"
                        variant="contained"
                        className="w-full md:w-auto"
                        disabled={disabled}
                        title={disabled ? disabledReason : undefined}
                        onClick={onOpen}
                    >
                        {rewardRows.length > 0 ? "Change Reward Items" : "Reward Items"}
                    </KitButton>
                </div>
                {disabled && disabledReason && <div className="text-xs text-third-400">{disabledReason}</div>}
            </div>
        </div>
    );
}
