import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash/debounce";
import {
    getApiErrorMessage,
    getLoyaltyBalance,
    previewLoyalty,
} from "./data/loyalty";
import {
    buildLoyaltyPreviewPayload,
    getExcludedItemCodes,
} from "../utils/loyalty";

export default function useLoyaltyCart({ phone, cartRows, totalPay, isOnline = true }) {
    const [loyaltyBalance, setLoyaltyBalance] = useState(null);
    const [loyaltyPreview, setLoyaltyPreview] = useState(null);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [redeemEnabled, setRedeemEnabled] = useState(false);
    const [redeemPointsInput, setRedeemPointsInput] = useState("");
    const [requestedRedeemPoints, setRequestedRedeemPoints] = useState(0);
    const phoneRef = useRef(phone);

    phoneRef.current = phone;

    const resetRedeem = useCallback(() => {
        setRedeemEnabled(false);
        setRedeemPointsInput("");
        setRequestedRedeemPoints(0);
    }, []);

    useEffect(() => {
        if (phone?.length !== 10 || !isOnline) {
            setLoyaltyBalance(null);
            resetRedeem();
            return undefined;
        }

        let cancelled = false;
        setBalanceLoading(true);

        getLoyaltyBalance(phone)
            .then((data) => {
                if (!cancelled) setLoyaltyBalance(data);
            })
            .catch(() => {
                if (!cancelled) {
                    setLoyaltyBalance({
                        phone,
                        balance: 0,
                        rupeeValueAtCurrentRate: 0,
                        pointsToRupeeRate: 0.5,
                        customer: null,
                    });
                }
            })
            .finally(() => {
                if (!cancelled) setBalanceLoading(false);
            });

        resetRedeem();

        return () => {
            cancelled = true;
        };
    }, [phone, isOnline, resetRedeem]);

    const runPreview = useMemo(
        () =>
            debounce(async (currentPhone, rows, redeemPoints, payable) => {
                if (currentPhone?.length !== 10 || !rows.length || !isOnline) {
                    setLoyaltyPreview(null);
                    setPreviewLoading(false);
                    return;
                }

                try {
                    const data = await previewLoyalty(
                        buildLoyaltyPreviewPayload({
                            customerPhone: currentPhone,
                            cartRows: rows,
                            redeemPoints,
                            payableAmount: payable,
                        })
                    );
                    setLoyaltyPreview(data);
                } catch (error) {
                    setLoyaltyPreview({
                        earnedPoints: 0,
                        redeemPoints: 0,
                        redeemDiscount: 0,
                        errors: [{ message: getApiErrorMessage(error) }],
                    });
                } finally {
                    setPreviewLoading(false);
                }
            }, 300),
        [isOnline]
    );

    useEffect(() => {
        if (phone?.length !== 10 || !cartRows.length || !isOnline) {
            setLoyaltyPreview(null);
            return () => runPreview.cancel();
        }

        setPreviewLoading(true);
        runPreview(phone, cartRows, requestedRedeemPoints, totalPay);

        return () => runPreview.cancel();
    }, [phone, cartRows, requestedRedeemPoints, totalPay, isOnline, runPreview]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setRequestedRedeemPoints(redeemEnabled ? Number(redeemPointsInput || 0) : 0);
        }, 150);

        return () => clearTimeout(timer);
    }, [redeemEnabled, redeemPointsInput]);

    const redeemDiscount = Number(loyaltyPreview?.redeemDiscount ?? 0);
    const redeemPoints = Number(loyaltyPreview?.redeemPoints ?? 0);
    const netPayable = Math.max(0, totalPay - redeemDiscount);
    const excludedItemCodes = useMemo(
        () => getExcludedItemCodes(loyaltyPreview),
        [loyaltyPreview]
    );

    const handleRedeemAll = useCallback(() => {
        const maxPoints = Number(loyaltyBalance?.balance ?? 0);
        setRedeemEnabled(true);
        setRedeemPointsInput(maxPoints);
        setRequestedRedeemPoints(maxPoints);
    }, [loyaltyBalance?.balance]);

    return {
        loyaltyBalance,
        loyaltyPreview,
        balanceLoading,
        previewLoading,
        redeemEnabled,
        setRedeemEnabled,
        redeemPointsInput,
        setRedeemPointsInput,
        redeemDiscount,
        redeemPoints,
        netPayable,
        excludedItemCodes,
        resetRedeem,
        handleRedeemAll,
    };
}
