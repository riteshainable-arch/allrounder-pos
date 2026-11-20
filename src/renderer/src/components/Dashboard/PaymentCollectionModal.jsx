import { useEffect, useMemo, useRef, useState } from "react";
import { IconButton, Rating, Tooltip, Typography } from "@mui/material";
import KitModal from "../../../../kit/components/KitModal";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import {
    priceFinalAmountFormat,
    priceFormat,
    roundToDecimals,
    roundToWholeRupee,
    sanitizeWholeRupeeInput,
} from "../../../../kit/utils/priceFormat";
import { paymentMethodConst } from "../../../../kit/configs/general";
import { API_VERSION } from "../../../../kit/hooks/data/fetchers";
import API from "../../../../kit/hooks/data/services/axiosService";
import ShortcutBadge from "./ShortcutBadge";
import CloseIcon from "@mui/icons-material/Close";
import { useValidateCoupon } from "../../../../kit/hooks/data/coupon";
import { useGlobalCouponEvaluate } from "../../../../kit/hooks/data/globalCoupon";
import KitShow from "../../../../kit/components/KitShow/KitShow";
import SchemeModal from "./SchemeModal";
import { format } from "date-fns";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import WheelCouponPanel from "./WheelCouponPanel";

const createDefaultPaymentRows = (netPayable) => {
    const due = roundToWholeRupee(Math.max(0, Number(netPayable || 0)));
    return [
    {
        id: 1,
        mode: paymentMethodConst.CASH,
        amount: due > 0 ? due : "",
    },
    {
        id: 2,
        mode: paymentMethodConst.UPI,
        amount: "",
    },
    {
        id: 3,
        mode: paymentMethodConst.CREDIT_CARD,
        amount: "",
    },
    {
        id: 4,
        mode: paymentMethodConst.AMEX_SODEXO,
        amount: "",
    },
];
};

const buildCouponItems = (cartRows) =>
    cartRows.map((item) => ({
        itemCode: item.itemCode || item.productCode,
        itemName: item.productName || item.itemName,
        qty: Number(item.quantity || 0),
        mrp: roundToDecimals(item.latestMRP ?? item.mrp ?? 0),
        salePrice: roundToDecimals(
            item.isOfferItem ? 0 : item.latestSalePrice ?? item.salePrice ?? item.price ?? 0
        ),
        isOfferFreeItem: Boolean(item.isOfferItem),
    }));

    const buildEvaluateCouponItems = (cartRows) =>
    cartRows.map((item) => ({
        id: item.id,
        itemCode: item.itemCode || item.productCode,
        inventoryPriceLayerId: item.inventoryPriceLayerId,
        itemName: item.productName || item.itemName,
        qty: Number(item.quantity || 0),
        mrp: roundToDecimals(item.latestMRP ?? item.mrp ?? 0),
        salePrice: roundToDecimals(
            item.isOfferItem ? 0 : item.latestSalePrice ?? item.salePrice ?? item.price ?? 0
        ),
        isOfferFreeItem: Boolean(item.isOfferItem),
    }));

export default function PaymentCollectionModal({
    open,
    onClose,
    customerName,
    invoiceTotal,
    discount,
    loyaltyRedeemPoints = 0,
    loyaltyRedeemDiscount = 0,
    netPayable,
    onGenerateInvoice,
    isSaving,
    customerPhone = "",
    rating = 0,
    onRatingChange,
    remark = "",
    onRemarkChange,
    cartRows = [],
    storeId,
}) {
    const cashRef = useRef(null);
    const upiRef = useRef(null);
    const cardRef = useRef(null);
    const amexSodexoRef = useRef(null);
    const srnRef = useRef(null);
    const couponRef = useRef(null);
    const viewSchemeRef = useRef(null);
    const schemeEvaluationRequestRef = useRef(0);
    const couponValidationRequestRef = useRef(0);

    const [paymentRows, setPaymentRows] = useState(createDefaultPaymentRows(netPayable));
    const [srnAmount, setSrnAmount] = useState(0);
    const [srnInputValue, setSrnInputValue] = useState("");
    const [couponInputValue, setCouponInputValue] = useState("");
    const [couponValidation, setCouponValidation] = useState(null);
    const [couponMessage, setCouponMessage] = useState("");
    const [couponMessageIsError, setCouponMessageIsError] = useState(false);
    const [srnAdjustmentInput, setSrnAdjustmentInput] = useState("");
    const [walletDetails, setWalletDetails] = useState(null);
    const [srnLookupLoading, setSrnLookupLoading] = useState(false);
    const [srnLookupError, setSrnLookupError] = useState("");
    const [srnAdjustmentError, setSrnAdjustmentError] = useState("");
    const [showSchemeDialog, setShowSchemeDialog] = useState(false);
    const [schemeIds, setSchemeIds] = useState([]);
    const [draftSchemeIds, setDraftSchemeIds] = useState([]);
    const [totalSchemeDiscount, setTotalSchemeDiscount] = useState(null);
    const [schemeEvaluationError, setSchemeEvaluationError] = useState("");

    const { globalCouponEvaluate, isGlobalCouponEvaluate } = useGlobalCouponEvaluate();
    const { validateCoupon, isValidateCoupon } = useValidateCoupon();
    const couponItems = useMemo(() => buildCouponItems(cartRows), [cartRows]);
    const couponDiscountAmount = Number(couponValidation?.discountAmount || 0);
    const schemeDiscountAmount = Number(totalSchemeDiscount || 0);
    const payableBeforeRounding = Math.max(
        0,
        Number(netPayable || 0) - couponDiscountAmount - schemeDiscountAmount
    );
    const payableAfterDiscounts = roundToWholeRupee(payableBeforeRounding);
    const roundedOffAmount = roundToDecimals(payableAfterDiscounts - payableBeforeRounding);
    const paymentAdjustmentsRef = useRef({ couponDiscountAmount, srnAmount });
    paymentAdjustmentsRef.current = { couponDiscountAmount, srnAmount };
    const collectionPayable = useMemo(
        () => roundToWholeRupee(Math.max(0, payableAfterDiscounts - Number(srnAmount || 0))),
        [payableAfterDiscounts, srnAmount]
    );

    const resetState = () => {
        schemeEvaluationRequestRef.current += 1;
        couponValidationRequestRef.current += 1;
        setPaymentRows(createDefaultPaymentRows(netPayable));
        setSrnAmount(0);
        setSrnInputValue("");
        setCouponInputValue("");
        setCouponValidation(null);
        setCouponMessage("");
        setCouponMessageIsError(false);
        setSrnAdjustmentInput("");
        setWalletDetails(null);
        setSrnLookupError("");
        setSrnLookupLoading(false);
        setSchemeIds([]);
        setDraftSchemeIds([]);
        setTotalSchemeDiscount(null);
        setSchemeEvaluationError("");
    };

    const toggleSchemeDialog = () => setShowSchemeDialog(!showSchemeDialog);

    const handleViewSchemes = () => {
        setDraftSchemeIds(schemeIds.slice(0, 1));
        setShowSchemeDialog(true);
    };

    const handleApplySchemeSelection = async (selectedIds) => {
        const nextSchemeIds = selectedIds.slice(0, 1);
        setSchemeIds(nextSchemeIds);
        setTotalSchemeDiscount(null);
        setSchemeEvaluationError("");

        const requestId = ++schemeEvaluationRequestRef.current;
        try {
            const response = await globalCouponEvaluate({
                storeId,
                cartItems: buildEvaluateCouponItems(cartRows),
                ...(nextSchemeIds.length > 0 && { schemeIds: nextSchemeIds }),
                date: format(new Date(), "yyyy-MM-dd"),
            });

            if (requestId !== schemeEvaluationRequestRef.current) return;

            const rawSchemeDiscount = Number(response?.data?.totalSchemeDiscount ?? 0);
            const schemeDiscount = Number.isFinite(rawSchemeDiscount)
                ? Math.max(0, rawSchemeDiscount)
                : 0;
            const { couponDiscountAmount: currentCouponDiscount, srnAmount: currentSrnAmount } =
                paymentAdjustmentsRef.current;
            setTotalSchemeDiscount(schemeDiscount);
            setPaymentRows(
                createDefaultPaymentRows(
                    Math.max(
                        0,
                        Number(netPayable || 0) -
                            currentCouponDiscount -
                            schemeDiscount -
                            currentSrnAmount
                    )
                )
            );
            setSchemeEvaluationError("");
        } catch (error) {
            if (requestId !== schemeEvaluationRequestRef.current) return;

            const errorMessage = Array.isArray(error)
                ? error[0]?.detail || error[0]?.message
                : typeof error === "string"
                  ? error
                  : error?.response?.data?.message || error?.message;
            const { couponDiscountAmount: currentCouponDiscount, srnAmount: currentSrnAmount } =
                paymentAdjustmentsRef.current;
            setTotalSchemeDiscount(null);
            setPaymentRows(
                createDefaultPaymentRows(
                    Math.max(0, Number(netPayable || 0) - currentCouponDiscount - currentSrnAmount)
                )
            );
            setSchemeEvaluationError(errorMessage || "Unable to evaluate billing schemes.");
        }
    };

    const handleRemoveScheme = () => {
        schemeEvaluationRequestRef.current += 1;
        setSchemeIds([]);
        setDraftSchemeIds([]);
        setTotalSchemeDiscount(null);
        setSchemeEvaluationError("");

        const { couponDiscountAmount: currentCouponDiscount, srnAmount: currentSrnAmount } =
            paymentAdjustmentsRef.current;
        setPaymentRows(
            createDefaultPaymentRows(
                Math.max(0, Number(netPayable || 0) - currentCouponDiscount - currentSrnAmount)
            )
        );
    };

    const handleRemoveCoupon = () => {
        couponValidationRequestRef.current += 1;
        setCouponValidation(null);
        setCouponInputValue("");
        setCouponMessage("");
        setCouponMessageIsError(false);

        setPaymentRows(
            createDefaultPaymentRows(
                Math.max(0, Number(netPayable || 0) - schemeDiscountAmount - srnAmount)
            )
        );
    };

    useEffect(() => {
        if (!open) {
            resetState();
        }
    }, [open]);

    const cashAmount = useMemo(
        () =>
            paymentRows
                .filter((row) => row.mode === paymentMethodConst.CASH)
                .reduce((sum, row) => sum + Number(row.amount || 0), 0),
        [paymentRows]
    );

    const isAutoCouponApplied = Boolean(couponValidation?.isAutoApplied);
    const hasCashPayment = cashAmount > 0;
    const hasNonCashPayment = paymentRows.some(
        (row) => row.mode !== paymentMethodConst.CASH && Number(row.amount || 0) > 0
    );
    const isCashOnlyPayment = hasCashPayment && !hasNonCashPayment;
    const hasCreditSale = paymentRows.some(
        (row) => row.mode === paymentMethodConst.CREDIT_SALE && Number(row.amount || 0) > 0
    );

    const totalReceived = useMemo(
        () => paymentRows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
        [paymentRows]
    );

    const remainingAmount = useMemo(() => {
        return Math.max(0, collectionPayable - totalReceived);
    }, [collectionPayable, totalReceived]);

    const balanceToReturn = useMemo(() => {
        if (isCashOnlyPayment) {
            return Math.max(0, cashAmount - collectionPayable);
        }

        return Math.max(0, totalReceived - collectionPayable);
    }, [isCashOnlyPayment, cashAmount, totalReceived, collectionPayable]);

    const canReceivePayment = useMemo(() => {
        if (collectionPayable === 0) return true;
        if (totalReceived <= 0) return false;
        if (hasCreditSale) return true;
        return totalReceived >= collectionPayable;
    }, [totalReceived, hasCreditSale, collectionPayable]);

    const canGenerateInvoice = canReceivePayment;

    const handleApplySrn = async () => {
        const trimmedValue = srnInputValue.trim();

        if (!trimmedValue) {
            setSrnLookupError("Please enter an SRN number.");
            return;
        }

        try {
            setSrnLookupLoading(true);
            setSrnLookupError("");

            const params = customerPhone ? { customerPhone } : {};
            const response = await API.get(
                `${API_VERSION}/admin/sale-return/wallet/${encodeURIComponent(trimmedValue)}`,
                params
            );
            setWalletDetails(response);
        } catch (error) {
            const errorMessage =
                error?.response?.data?.message || error?.message || "Unable to fetch SRN wallet details";
            setWalletDetails(null);
            setSrnLookupError(errorMessage);
        } finally {
            setSrnLookupLoading(false);
        }
    };

    const handleApplyCoupon = async (codeOverride) => {
        const requestId = ++couponValidationRequestRef.current;
        const trimmedValue = (typeof codeOverride === "string" ? codeOverride : couponInputValue).trim();
        if (typeof codeOverride === "string") setCouponInputValue(trimmedValue);

        if (!trimmedValue) {
            setCouponValidation(null);
            setCouponMessage("Please enter a coupon code.");
            setCouponMessageIsError(true);
            return;
        }

        try {
            setCouponMessage("");
            setCouponMessageIsError(false);
            const response = await validateCoupon({
                couponCode: trimmedValue,
                customerPhone,
                storeId,
                items: buildCouponItems(cartRows),
            });
            if (requestId !== couponValidationRequestRef.current) return;

            const validation = response?.data;

            if (!validation?.isValid) {
                setCouponValidation(null);
                setPaymentRows(
                    createDefaultPaymentRows(
                        Math.max(
                            0,
                            Number(netPayable || 0) - schemeDiscountAmount - srnAmount
                        )
                    )
                );
                setCouponMessage(
                    response?.message ||
                        validation?.errors?.[0] ||
                        "This coupon is not valid for the current cart."
                );
                setCouponMessageIsError(true);
                return;
            }

            setCouponValidation(validation);
            setPaymentRows(
                createDefaultPaymentRows(
                    Math.max(
                        0,
                        Number(netPayable || 0) -
                            schemeDiscountAmount -
                            Number(validation.discountAmount || 0) -
                            srnAmount
                    )
                )
            );
            setCouponMessage(response?.message || "Coupon applied.");
            setCouponMessageIsError(false);
        } catch (error) {
            if (requestId !== couponValidationRequestRef.current) return;

            setCouponValidation(null);
            setPaymentRows(
                createDefaultPaymentRows(
                    Math.max(0, Number(netPayable || 0) - schemeDiscountAmount - srnAmount)
                )
            );
            const errorMessage = Array.isArray(error)
                ? error[0]?.detail || error[0]?.message
                : typeof error === "string"
                  ? error
                  : error?.message;
            setCouponMessage(errorMessage || "Unable to validate coupon.");
            setCouponMessageIsError(true);
        }
    };

    useEffect(() => {
        if (srnAdjustmentInput === "") {
            setSrnAdjustmentError("");
            setSrnAmount(0);
            setPaymentRows(createDefaultPaymentRows(payableAfterDiscounts));
            return;
        }

        const amount = Number(srnAdjustmentInput);

        if (!Number.isFinite(amount) || amount < 0) {
            return;
        }

        const remaining = Number(walletDetails?.data?.adjustmentRemaining || 0);
        const wholeRemaining = roundToWholeRupee(remaining);
        const netAmount = payableAfterDiscounts;

        if (amount > wholeRemaining) {
            setSrnAdjustmentError(
                remaining <= 0
                    ? "No SRN adjustment remains; this balance has already been used."
                    : `Adjustment amount cannot exceed ${priceFormat(remaining)}`
            );
            setSrnAmount(0);
            setPaymentRows(createDefaultPaymentRows(netAmount));
            return;
        }

        if (amount > netAmount) {
            setSrnAdjustmentError(`Adjustment amount cannot exceed Net Payable (${priceFormat(netAmount)})`);
            setSrnAmount(0);
            setPaymentRows(createDefaultPaymentRows(netAmount));
            return;
        }

        setSrnAdjustmentError("");
        const wholeSrn = amount;
        setSrnAmount(wholeSrn);
        const payable = roundToWholeRupee(Math.max(0, netAmount - wholeSrn));
        setPaymentRows(createDefaultPaymentRows(payable));

    }, [srnAdjustmentInput, walletDetails, payableAfterDiscounts]);

    const updateRow = (id, value, payable = collectionPayable) => {
        const rows = [...paymentRows];
        const index = rows.findIndex((r) => r.id === id);
        if (index < 0) return;

        rows[index].amount =
            value === "" ? "" : roundToWholeRupee(Math.max(0, Number(value)));

        const toSplit = roundToWholeRupee(payable);

        if (!srnAdjustmentInput.trim()) {
            const paid = (i) => roundToWholeRupee(Number(rows[i].amount || 0));
            if (index === 0) {
                const rest = Math.max(0, toSplit - paid(0));
                rows[1].amount = rest > 0 ? rest : "";
                rows[2].amount = "";
                rows[3].amount = "";
            }
            if (index > 0 && paid(0) > 0) {
                const rest = Math.max(0, toSplit - paid(1) - paid(2) - paid(3));
                rows[0].amount = rest > 0 ? rest : "";
            } else if (index === 1) {
                const rest = Math.max(0, toSplit - paid(0) - paid(1) - paid(3));
                rows[2].amount = rest > 0 ? rest : "";
            } else if (index === 2 || index === 3) {
                const rest = Math.max(0, toSplit - paid(0) - paid(2) - paid(3));
                rows[1].amount = rest > 0 ? rest : "";
            }
        }

        setPaymentRows(rows);
    };

    const buildPaymentData = () => {
        const payments = paymentRows
            .filter((row) => Number(row.amount || 0) > 0)
            .map((row) => ({
                mode: row.mode,
                amount: roundToWholeRupee(Number(row.amount)),
            }));

        if (srnAmount > 0 && walletDetails?.data?.srnNumber) {
            payments.push({
                paymentMode: "srn_adjustment",
                amount: Number(srnAmount),
                srnNumber: walletDetails.data.srnNumber,
            });
        }

        if (Number(loyaltyRedeemDiscount || 0) > 0) {
            payments.push({
                mode: "loyalty",
                paymentMode: "loyalty",
                amount: roundToWholeRupee(Number(loyaltyRedeemDiscount)),
                redeemedPoints: Number(loyaltyRedeemPoints || 0),
            });
        }

        const uniqueModes = [...new Set(payments.map((p) => p.mode))];
        let paymentMethod = paymentMethodConst.CASH;
        if (uniqueModes.length > 1) {
            paymentMethod = paymentMethodConst.MIXED;
        } else if (uniqueModes.length === 1) {
            paymentMethod = uniqueModes[0];
        }

        return {
            payments,
            paymentMethod,
            totalReceived: roundToWholeRupee(totalReceived),
            remainingAmount: roundToWholeRupee(remainingAmount),
            balanceToReturn: roundToWholeRupee(balanceToReturn),
            cashTendered: roundToWholeRupee(hasCashPayment ? cashAmount : 0),
            cashAmount: roundToWholeRupee(cashAmount),
            isCreditSale: hasCreditSale,
            loyaltyRedeem: Number(loyaltyRedeemPoints || 0),
            loyaltyRedeemPoints: Number(loyaltyRedeemPoints || 0),
            loyaltyRedeemed: roundToWholeRupee(Number(loyaltyRedeemDiscount || 0)),
            netPayable: roundToWholeRupee(collectionPayable),
            couponCode: couponValidation?.coupon?.code || null,
            couponDiscountAmount: roundToWholeRupee(couponDiscountAmount),
            schemeDiscountAmount: roundToDecimals(schemeDiscountAmount),
        };
    };

    const adjustmentAmount = Number(walletDetails?.data?.adjustmentAmount || 0);
    const hasSrnAdjustmentError = Boolean(walletDetails) && Number(netPayable || 0) < adjustmentAmount;
    const nextSlab = couponValidation?.nextSlab;
    const nextSlabQuantity = Number(nextSlab?.minQty || 0) - Number(couponValidation?.eligibleQty || 0);
    const nextSlabMessage =
        nextSlabQuantity > 0
            ? `Buy ${nextSlabQuantity} more eligible item${nextSlabQuantity === 1 ? "" : "s"} to unlock ${
                  nextSlab.discountType === "PERCENTAGE"
                      ? `${nextSlab.discountValue}%`
                      : priceFormat(nextSlab.discountValue || 0)
              } off.`
            : "";

    const handleGenerate = () => {
        if (
            !canGenerateInvoice ||
            isSaving ||
            isGlobalCouponEvaluate ||
            srnLookupLoading ||
            srnLookupError ||
            hasSrnAdjustmentError ||
            srnAdjustmentError
        ) {
            return;
        }
        onGenerateInvoice(buildPaymentData());
    };

    useEffect(() => {
        const netAmount = payableAfterDiscounts;
        if (!walletDetails) {
            setSrnAdjustmentInput("");
            setSrnAmount(0);
            setSrnAdjustmentError("");
            setPaymentRows(createDefaultPaymentRows(netAmount));
            return;
        }
        const adjustment = Number(walletDetails?.data?.adjustmentAmount || 0);
        if (netAmount < adjustment) {
            setSrnAdjustmentInput("");
            setSrnAmount(0);
            setSrnAdjustmentError("");
            setPaymentRows(createDefaultPaymentRows(netAmount));
            return;
        }
        const wholeAdjustment = adjustment;
        setSrnAdjustmentInput(String(wholeAdjustment));
    }, [walletDetails, payableAfterDiscounts]);


    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e) => {
            const target = e.target;

            const isSrnInput = target === srnRef.current;
            const isCouponInput = target === couponRef.current;
            const isShortcutInput = isSrnInput || isCouponInput || Boolean(target?.closest?.("[data-shortcut-ignore]"));

            switch (e.key.toLowerCase()) {
                case "v":
                    if (isShortcutInput) return;

                    e.preventDefault();
                    viewSchemeRef.current?.click();
                    return;

                case "c":
                    if (isShortcutInput) return;

                    e.preventDefault();
                    cashRef.current?.focus();
                    return;

                case "u":
                    if (isShortcutInput) return;

                    e.preventDefault();
                    upiRef.current?.focus();
                    return;

                case "k":
                    if (isShortcutInput) return;

                    e.preventDefault();
                    cardRef.current?.focus();
                    return;

                case "a":
                    if (isShortcutInput) return;

                    e.preventDefault();
                    amexSodexoRef.current?.focus();
                    return;

                case "o":
                    if (isShortcutInput) return;

                    e.preventDefault();
                    couponRef.current?.focus();
                    return;

                case "s":
                    if (isShortcutInput) return;

                    e.preventDefault();
                    srnRef.current?.focus();
                    return;

                case "f2":
                    e.preventDefault();
                    handleGenerate();
                    return;

                case "escape":
                    e.preventDefault();
                    onClose?.();
                    return;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [
        open,
        canGenerateInvoice,
        isSaving,
        paymentRows,
        netPayable,
    ]);

    const getAmountPlaceholder = (mode) =>
        mode === paymentMethodConst.CASH ? "Cash Received" : "Enter Amount";

    const summaryRow = (label, value, valueClass = "") => (
        <div className="flex items-center justify-between gap-2 py-0.5 text-xs leading-4">
            <span>{label}</span>
            <span className={`font-semibold ${valueClass}`}>{value}</span>
        </div>
    );

    return (
        <>
        <KitModal
            maxWidth="md"
            isOpen={open}
            onClose={onClose}
            title={
                <div className="min-w-0">
                    <div className="text-lg font-bold leading-tight text-third-950">Collect payment</div>
                    <div className="mt-0.5 truncate text-xs text-third-500">
                        Customer:<span className="font-semibold text-third-800 ml-1">{customerName || "Walk-in Customer"}</span>
                    </div>
                </div>
            }
            titleClass="px-4! py-2! border-b"
        >
            <div className="px-4 py-2 flex flex-col gap-1 max-h-[75vh] overflow-y-auto custom-scroll">            
                {/* <div className="rounded-xl border border-primary/20 bg-primary-hover px-3 py-1.5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-third-500">
                                Amount Due:
                            </span>
                            <span className="text-lg font-bold leading-tight text-third-950">
                                {priceFinalAmountFormat(collectionPayable)}
                                {priceFinalAmountFormat(netPayable)}
                            </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5 text-[10px]">
                            <span className="text-third-500">Invoice Total:</span>
                            <span className="font-semibold text-third-800">{priceFormat(invoiceTotal)}</span>
                        </div>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0 border-t border-primary/10 pt-1 text-[10px] leading-tight text-third-500">
                        <span>
                            Discount: <strong className="text-third-800">{priceFormat(discount)}</strong>
                        </span>

                        {Number(loyaltyRedeemDiscount) > 0 && (
                            <span className="text-green-700">
                                Loyalty: <strong>−{priceFormat(loyaltyRedeemDiscount)}</strong>
                            </span>
                        )}
                    </div>
                </div> */}

                <div className="rounded-xl border border-app-border bg-reverse p-3 py-1.5! pr-5!">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <div>
                            <Typography className="font-bold! text-third-950!">Payment details</Typography>
                            <div className="text-xs text-third-500">Enter the amount received for each method</div>
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="v" className="top-0 -right-4!" />
                            <KitButton ref={viewSchemeRef} variant="contained" className="w-auto!" size="small" onClick={handleViewSchemes}>
                                View Schemes{schemeIds.length > 0 ? ` (${schemeIds.length})` : ""}
                            </KitButton>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        {paymentRows.map((row) => (
                            <div key={row.id} className="relative flex items-center gap-3 rounded-lg border border-app-border bg-app-paper px-3 py-2">
                                {row.mode === paymentMethodConst.CASH && (
                                    <ShortcutBadge shortcut="C" className="top-0 -right-4!" />
                                )}
                                {row.mode === paymentMethodConst.UPI && (
                                    <ShortcutBadge shortcut="U" className="top-0 -right-4!" />
                                )}
                                {row.mode === paymentMethodConst.CREDIT_CARD && (
                                    <ShortcutBadge shortcut="K" className="top-0 -right-4!" />
                                )}
                                {row.mode === paymentMethodConst.AMEX_SODEXO && (
                                    <ShortcutBadge shortcut="A" className="top-0 -right-4!" />
                                )}
                                <div className="w-28 shrink-0">
                                    <div className="text-sm font-semibold text-third-800">
                                        {row.mode === paymentMethodConst.AMEX_SODEXO ? "Amex / Sodexo" : row.mode}
                                    </div>
                                    <div className="text-[11px] text-third-500">
                                        {row.mode === paymentMethodConst.CASH
                                            ? "Cash received"
                                            : row.mode === paymentMethodConst.UPI
                                                ? "Digital payment"
                                                : row.mode === paymentMethodConst.AMEX_SODEXO
                                                    ? "Amex card / Sodexo"
                                                    : "Card payment"}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <KitTextField
                                        inputRef={
                                            row.mode === paymentMethodConst.CASH
                                                ? cashRef
                                                : row.mode === paymentMethodConst.UPI
                                                    ? upiRef
                                                    : row.mode === paymentMethodConst.CREDIT_CARD
                                                        ? cardRef
                                                        : row.mode === paymentMethodConst.AMEX_SODEXO
                                                            ? amexSodexoRef
                                                            : null
                                        }
                                        fullWidth
                                        size="small"
                                        height="32px"
                                        type="text"
                                        inputMode="numeric"
                                        aria-label={`${row.mode} amount received`}
                                        placeholder={getAmountPlaceholder(row.mode)}
                                        placeholderFontSize={14}
                                        value={row.amount}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "-" ||
                                                e.key === "Minus" ||
                                                e.key === "." ||
                                                e.key === "," ||
                                                e.key === "e" ||
                                                e.key === "E"
                                            ) {
                                                e.preventDefault();
                                            }
                                        }}
                                        onWheel={(e) => e.target.blur()}
                                        onChange={(e) => {
                                            updateRow(row.id, sanitizeWholeRupeeInput(e.target.value));
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="relative flex items-center gap-3 rounded-lg border border-dashed border-app-border bg-calendar-bg px-3 py-2">
                            <ShortcutBadge shortcut="S" className="top-0 -right-4!" />
                            <div className="w-28 shrink-0">
                                <div className="text-sm font-semibold text-third-800">SRN adjustment</div>
                                <div className="text-[11px] text-third-500">Optional wallet credit</div>
                            </div>
                            <div className="flex-1 flex gap-2">
                                <KitTextField
                                    inputRef={srnRef}
                                    fullWidth
                                    size="small"
                                    height="32px"
                                    placeholder="Enter SRN Number"
                                    placeholderFontSize={14}
                                    aria-label="SRN number"
                                    value={srnInputValue}
                                    onChange={(e) => setSrnInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            if (!srnLookupLoading && srnInputValue.trim()) {
                                                handleApplySrn();
                                            }
                                        }
                                    }}
                                />
                                <KitButton
                                    variant="contained"
                                    className="w-auto"
                                    size="small"
                                    onClick={handleApplySrn}
                                    disabled={srnLookupLoading}
                                >
                                    Apply
                                </KitButton>
                            </div>
                        </div>
                        <div className="relative flex items-center gap-3 rounded-lg border border-dashed border-app-border bg-calendar-bg px-3 py-2">
                            <ShortcutBadge shortcut="o" className="top-0 -right-4!" />
                            <div className="w-28 shrink-0">
                                <div className="text-sm font-semibold text-third-800">Coupon</div>
                                <div className="text-[11px] text-third-500">Optional wallet credit</div>
                            </div>
                            <div className="flex-1 flex gap-2">
                                <KitTextField
                                    inputRef={couponRef}
                                    fullWidth
                                    size="small"
                                    height="32px"
                                    placeholder="Enter Coupon"
                                    placeholderFontSize={14}
                                    aria-label="Coupon"
                                    value={couponInputValue}
                                    disabled={isAutoCouponApplied}
                                    onChange={(e) => {
                                        setCouponInputValue(e.target.value);
                                        setCouponValidation(null);
                                        setCouponMessage("");
                                        setPaymentRows(
                                            createDefaultPaymentRows(
                                                Math.max(
                                                    0,
                                                    Number(netPayable || 0) -
                                                        schemeDiscountAmount -
                                                        srnAmount
                                                )
                                            )
                                        );
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            if (!isValidateCoupon && !isAutoCouponApplied) {
                                                handleApplyCoupon();
                                            }
                                        }
                                    }}
                                />
                                <KitButton
                                    variant="contained"
                                    className="w-auto"
                                    size="small"
                                    onClick={handleApplyCoupon}
                                    disabled={
                                        isValidateCoupon ||
                                        isAutoCouponApplied
                                    }
                                >
                                    Apply
                                </KitButton>
                            </div>
                        </div>
                        <WheelCouponPanel
                            customerPhone={customerPhone}
                            storeId={storeId}
                            items={couponItems}
                            appliedCode={couponValidation?.isValid ? couponValidation?.coupon?.code : ""}
                            disabled={isAutoCouponApplied}
                            isApplying={isValidateCoupon}
                            onApply={handleApplyCoupon}
                        />
                    </div>
                </div>

                {schemeEvaluationError && (
                    <div className="pl-1 text-xs text-red-600" role="alert">
                        {schemeEvaluationError}
                    </div>
                )}
                {couponMessage && (
                    <div className={`pl-1 text-xs ${couponMessageIsError ? "text-red-600" : "text-green-700"}`}>
                        {couponMessage}
                    </div>
                )}
                {nextSlabMessage && (
                    <div className="pl-1 text-xs text-third-500">{nextSlabMessage}</div>
                )}

                {srnLookupLoading && (
                    <div className="text-xs text-third-500 pl-1">Looking up SRN wallet…</div>
                )}
                {!srnLookupLoading && srnLookupError && (
                    <div className="text-xs text-red-600 pl-1">{srnLookupError}</div>
                )}

                {walletDetails && (
                    <div className="rounded-lg border border-app-border bg-calendar-bg px-3 py-1.5">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="text-sm font-semibold text-third-800">SRN Wallet Details</div>
                            <div className="flex gap-2 items-center">
                                <div className="text-xs text-third-500">{walletDetails?.data?.srnNumber || "-"}</div>
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setSrnInputValue("");
                                        setWalletDetails(null);
                                        setSrnAmount(0);
                                        setSrnAdjustmentInput("");
                                        setSrnAdjustmentError("");
                                        setSrnLookupError("");
                                        setSrnLookupLoading(false);
                                        setPaymentRows(createDefaultPaymentRows(payableAfterDiscounts));
                                    }}
                                    className="rounded! bg-app-border! p-0.5! text-red-600! hover:bg-app-border!"
                                    aria-label="Clear SRN adjustment"
                                    title="Clear SRN adjustment"
                                >
                                    <CloseIcon className="text-lg!" />
                                </IconButton>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
                            <div className="flex flex-wrap items-center gap-1">
                                <span className="text-third-500">Adjustment Amount:</span>
                                <span className="font-semibold text-third-800">
                                    {priceFormat(walletDetails?.data?.adjustmentAmount || 0)}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1">
                                <span className="text-third-500">Adjustment Used:</span>
                                <span className="font-semibold text-third-800">
                                    {priceFormat(walletDetails?.data?.adjustmentUsed || 0)}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1">
                                <span className="text-third-500">Adjustment Remaining:</span>
                                <span className="font-semibold text-third-800">
                                    {priceFormat(walletDetails?.data?.adjustmentRemaining || 0)}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1">
                                <span className="text-third-500">Customer:</span>
                                <span className="font-semibold text-third-800">
                                    {walletDetails?.data?.customer?.phone || "-"}
                                </span>
                            </div>
                        </div>

                        <div className="mt-2">
                            <KitTextField
                                fullWidth
                                size="small"
                                height="32px"
                                type="number"
                                label="SRN Adjustment Amount"
                                placeholder="Enter amount"
                                placeholderFontSize={14}
                                value={srnAdjustmentInput}
                                disabled
                                helperText={
                                    srnAdjustmentError ||
                                    (walletDetails && Number(netPayable || 0) < adjustmentAmount
                                        ? `You cannot use the SRN adjustment because the adjustment amount (${priceFormat(adjustmentAmount)}) exceeds the net payable (${priceFormat(netPayable)}).`
                                        : "SRN adjustment amount is applied automatically.")
                                }
                                error={Boolean(srnAdjustmentError) || hasSrnAdjustmentError}
                            />
                        </div>
                    </div>
                )}

                {/* <div className="rounded-xl border border-app-border bg-reverse p-3">
                    <div className="mb-3">
                        <Typography className="font-bold! text-third-950!">
                            Store feedback
                        </Typography>

                        <div className="text-xs text-third-500">
                            Rate the visit and add an optional customer remark
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                        <div className="flex w-full shrink-0 items-center gap-4 rounded-lg border border-app-border bg-app-paper px-4 py-3 sm:w-[240px]">
                            <div className="shrink-0">
                                <div className="text-xs font-medium text-third-500">
                                    Rating
                                </div>

                                <div className="mt-1 whitespace-nowrap text-lg font-bold text-third-800">
                                    {rating || 0}/5
                                </div>
                            </div>

                            <Rating
                                value={rating}
                                precision={0.5}
                                onChange={(event, newValue) =>
                                    onRatingChange?.(newValue ?? 0)
                                }
                                size="medium"
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <KitTextField
                                fullWidth
                                size="small"
                                placeholder="Optional feedback"
                                value={remark}
                                onChange={(event) =>
                                    onRemarkChange?.(event.target.value)
                                }
                                multiline
                                minRows={3}
                            />
                        </div>
                    </div>
                </div> */}

                <div className="rounded-lg border border-app-border bg-third-50 px-3 py-1">
                    {summaryRow("Total Bill Amount", priceFormat(invoiceTotal))}
                    {Number(loyaltyRedeemDiscount) > 0 &&
                        summaryRow(
                            "Loyalty Redeemed",
                            `-${priceFormat(loyaltyRedeemDiscount)}`,
                            "text-green-700!"
                        )}
                    {couponDiscountAmount > 0 && (
                        <div className="flex items-center justify-between gap-2 py-0.5 text-xs leading-4">
                            <span>Coupon Discount</span>
                            <div className="flex items-center gap-1">
                                <Tooltip title="Remove applied coupon">
                                    <IconButton
                                        size="small"
                                        onClick={handleRemoveCoupon}
                                        aria-label="Remove applied coupon"
                                        className="rounded! p-0.5! text-red-600! hover:bg-red-50!"
                                    >
                                        <KitIcon icon="tabler:trash" className="text-sm" />
                                    </IconButton>
                                </Tooltip>
                                <span className="font-semibold text-green-700!">
                                    -{priceFormat(couponDiscountAmount)}
                                </span>
                            </div>
                        </div>
                    )}
                    {isGlobalCouponEvaluate
                        ? summaryRow("Scheme Discount", "Calculating...")
                        : schemeDiscountAmount > 0 && (
                              <div className="flex items-center justify-between gap-2 py-0.5 text-xs leading-4">
                                  <span>Scheme Discount</span>
                                  <div className="flex items-center gap-1">
                                      <Tooltip title="Remove applied scheme">
                                          <IconButton
                                              size="small"
                                              onClick={handleRemoveScheme}
                                              aria-label="Remove applied scheme"
                                              className="rounded! p-0.5! text-red-600! hover:bg-red-50!"
                                          >
                                              <KitIcon icon="tabler:trash" className="text-sm" />
                                          </IconButton>
                                      </Tooltip>
                                      <span className="font-semibold text-green-700!">
                                          -{priceFormat(schemeDiscountAmount)}
                                      </span>
                                  </div>
                              </div>
                          )}
                    {summaryRow(
                        "SRN Adjustment Amount",
                        srnAmount > 0 ? `-${priceFormat(srnAmount)}` : priceFormat(0),
                        "text-green-700!"
                    )}
                    {summaryRow(
                        roundedOffAmount < 0 ? "Rounded Off (-)" : "Rounded Off (+)",
                        priceFormat(Math.abs(roundedOffAmount))
                    )}
                    <div className="my-1 border-t border-third-200" />
                    {summaryRow(
                        "Net Payable Amount",
                        priceFinalAmountFormat(collectionPayable),
                        "text-blue-700! text-sm!"
                    )}
                    {/* {summaryRow("Total Received", priceFinalAmountFormat(totalReceived))}
                    {summaryRow(
                        "Remaining Amount",
                        priceFinalAmountFormat(remainingAmount),
                        remainingAmount > 0 ? "text-red-600!" : ""
                    )} */}

                    {balanceToReturn > 0 &&
                        summaryRow("Balance to Return", priceFinalAmountFormat(balanceToReturn), "text-green-600!")}

                    {canGenerateInvoice && remainingAmount === 0 && (
                        <div className="mt-0.5 text-center text-[11px] font-semibold text-green-700">
                            Ready to Generate Invoice
                        </div>
                    )}

                    {canGenerateInvoice && hasCreditSale && remainingAmount > 0 && (
                        <div className="mt-0.5 text-center text-[11px] font-semibold text-amber-700">
                            Credit Sale — Remaining {priceFinalAmountFormat(remainingAmount)}
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4 py-3 pt-6 flex justify-end gap-3 border-t">
                <KitButton variant="outlined" className="w-auto" size="small" onClick={onClose}>
                    Cancel
                </KitButton>
                <div className="relative">
                    <ShortcutBadge shortcut="F2" />
                    <KitButton
                        variant="contained"
                        className="w-auto"
                        size="small"
                        disabled={
                            !canGenerateInvoice ||
                            isSaving ||
                            isGlobalCouponEvaluate ||
                            Boolean(srnLookupError) ||
                            Boolean(srnAdjustmentError) ||
                            hasSrnAdjustmentError ||
                            srnLookupLoading
                        }
                        isLoading={isSaving}
                        onClick={handleGenerate}
                    >
                        Generate Invoice
                    </KitButton>
                </div>
            </div>
        </KitModal>

        <KitShow show={showSchemeDialog}>
            <SchemeModal
                open={showSchemeDialog}
                onClose={toggleSchemeDialog}
                storeId={storeId}
                selectedSchemeIds={draftSchemeIds}
                onSelectionChange={setDraftSchemeIds}
                onApply={handleApplySchemeSelection}
                items={cartRows}
            />
        </KitShow>
    </>
    );
}
