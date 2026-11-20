import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Chip,
    Collapse,
    Tooltip,
    Typography,
    useTheme,
} from "@mui/material";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import { priceFinalAmountFormat, priceFormat } from "../../../../kit/utils/priceFormat";
import ShortcutBadge from "./ShortcutBadge";

export default function LoyaltyRedeemPanel({
    balance,
    balanceLoading = false,
    preview,
    previewLoading = false,
    redeemEnabled,
    onRedeemEnabledChange,
    redeemPointsInput,
    onRedeemPointsInputChange,
    onRedeemAll,
    totalPay = 0,
    netPayable = 0,
}) {
    const theme = useTheme();
    const redeemButtonRef = useRef(null);
    const redeemInputRef = useRef(null);
    const [redeemOpen, setRedeemOpen] = useState(false);

    const pointsBalance = Number(balance?.balance ?? 0);
    const rupeeValue = Number(balance?.rupeeValueAtCurrentRate ?? 0);
    const rate = Number(preview?.pointsToRupeeRate ?? balance?.pointsToRupeeRate ?? 0.5);
    const earnedPoints = Number(preview?.earnedPoints ?? 0);
    const redeemDiscount = Number(preview?.redeemDiscount ?? 0);
    const appliedRedeemPoints = Number(preview?.redeemPoints ?? 0);
    const tierName = preview?.tier?.name;
    const tierPercent = preview?.tier?.percentagePoints;
    const excludedValue = Number(preview?.excludedInvoiceValue ?? 0);
    const previewErrors = preview?.errors ?? [];
    const canRedeem = pointsBalance > 0;

    const showEarnBanner = Boolean(tierName && earnedPoints > 0);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey && e.key.toLowerCase() === "u") {
                e.preventDefault();
                if (!canRedeem) return;
                redeemButtonRef.current?.click();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [canRedeem]);

    return (
        <div className="flex flex-1 flex-col">
            {/* <div className="flex flex-wrap items-center gap-2 px-1">
                <Chip
                    size="small"
                    color="primary"
                    variant="outlined"
                    label={
                        balanceLoading
                            ? "Loyalty: loading..."
                            : `Loyalty: ${pointsBalance} pts (≈ ${priceFormat(rupeeValue)})`
                    }
                />
                {balance?.customer?.customerCategory && (
                    <Chip
                        size="small"
                        label={balance.customer.customerCategory}
                        className="text-xs!"
                    />
                )}
            </div> */}

            {/* {showEarnBanner && (
                <Alert severity="info" className="text-xs! py-1!">
                    {previewLoading
                        ? "Calculating loyalty..."
                        : `You'll earn ${earnedPoints} pts (${tierName} tier — ${tierPercent}%)`}
                </Alert>
            )}

            {excludedValue > 0 && (
                <Typography className="text-xs! text-third-500 px-1">
                    {priceFormat(excludedValue)} of the cart doesn&apos;t earn points.
                </Typography>
            )} */}

            <div className="flex flex-1 flex-col items-center justify-evenly gap-2 px-3 py-3 text-center">
                <div className="flex flex-col items-center gap-0.5">
                    <div className="text-sm font-semibold text-third-500">Customer Loyalty Points</div>
                    <div className="text-base text-third font-semibold">
                        {balanceLoading ? "..." : pointsBalance} (≈ {priceFormat(rupeeValue)})
                    </div>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                    <div className="text-sm font-semibold text-third-500">Earned</div>
                    <div className="text-base text-primary font-semibold">
                        {previewLoading ? "..." : `+${earnedPoints}`}
                    </div>
                </div>
                <div className="relative">
                    <ShortcutBadge shortcut="Alt + U" className="-top-2! -right-3! z-10" />
                    <KitButton
                        ref={redeemButtonRef}
                        size="small"
                        variant="contained"
                        className="w-full md:w-auto"
                        disabled={!canRedeem}
                        onClick={() => {
                            const next = !redeemOpen;
                            setRedeemOpen(next);
                            onRedeemEnabledChange?.(next);
                        }}
                    >
                        {redeemOpen ? "Hide Redeem" : "Use Points"}
                    </KitButton>
                </div>
            </div>

            <Collapse
                in={redeemOpen && canRedeem}
                onEntered={() => {
                    redeemInputRef.current?.focus();
                }}
            >
                <div className="px-3 pb-3 flex flex-col gap-2 border-t border-gray-200 pt-3">
                    <Typography className="text-sm! font-semibold!">Redeem loyalty points</Typography>
                    <Chip
                        size="small"
                        variant="outlined"
                        label={`${pointsBalance} pts available (≈ ${priceFormat(rupeeValue)})`}
                    />
                    <div className="w-full! flex gap-2 items-end">
                        <div className="flex-1">
                            <KitTextField
                                inputRef={redeemInputRef}
                                size="small"
                                type="number"
                                label="Points to redeem"
                                placeholder="Enter points"
                                placeholderFontSize={14}
                                className="w-full"
                                value={redeemPointsInput ?? ""}
                                disabled={!redeemEnabled}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    onRedeemPointsInputChange?.(
                                        value === "" ? "" : Math.max(0, Math.min(pointsBalance, Number(value)))
                                    );
                                }}
                            />
                        </div>
                        <KitButton
                            size="small"
                            variant="outlined"
                            className="w-auto shrink-0"
                            onClick={onRedeemAll}
                        >
                            Redeem all
                        </KitButton>
                    </div>
                    <Typography
                        className={`text-xs! ${appliedRedeemPoints > 0 ? "text-green-700" : "text-third-400"}`}
                    >
                        Discount = {appliedRedeemPoints} pts × {priceFormat(rate)} ={" "}
                        {priceFormat(redeemDiscount)}
                    </Typography>
                    {previewErrors.map((error, index) => (
                        <Typography key={index} className="text-xs! text-red-600">
                            {typeof error === "string" ? error : error.message}
                        </Typography>
                    ))}
                </div>
                <div className="flex flex-col gap-1 px-2 pb-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-third-600">Total</span>
                        <span className="font-semibold">{priceFormat(totalPay)}</span>
                    </div>
                    {redeemDiscount > 0 && (
                        <div className="flex justify-between text-green-700">
                            <span>Loyalty redeem</span>
                            <span className="font-semibold">
                                −{priceFormat(redeemDiscount)} ({appliedRedeemPoints} pts)
                            </span>
                        </div>
                    )}
                </div>
            </Collapse>

            {/* <div
                className="sticky bottom-0 flex shrink-0 justify-center items-center gap-2 border-t border-gray-300 p-2"
                style={{ backgroundColor: theme.palette.background.paper }}
            >
                <div className="text-base font-semibold text-third-500">Net Payable</div>
                <div className="text-lg text-third font-semibold">{priceFinalAmountFormat(netPayable)}</div>
            </div> */}
        </div>
    );
}

export function LoyaltyExcludedBadge() {
    return (
        <Tooltip title="This item is not eligible for loyalty points">
            <Chip size="small" label="No loyalty" color="warning" variant="outlined" className="text-xs!" />
        </Tooltip>
    );
}
