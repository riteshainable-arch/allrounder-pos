import { Dialog, DialogContent, Skeleton } from "@mui/material";
import { format } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { priceFormat, roundToDecimals } from "../../../../kit/utils/priceFormat";
import { formatBillPaymentsSummary, normalizeBillPayments } from "../../../../kit/utils/billPayments";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import { initialLettersCapitalize } from "../../../../kit/utils/capital";
import useOnlineStatus from "../../../../kit/hooks/useOnlineStatus";
import { useInvoiceBillDetail } from "../../../../kit/hooks/data/invoice";
import { printToDefaultPrinter } from "../../../../kit/utils/electronApi";
import { toast } from "react-toastify";
import ShortcutBadge from "./ShortcutBadge";
import Logo from "../../../../../resources/LOGO.png";
import QRCode from "react-qr-code";
import { ToWords } from "to-words";

const ITEM_ROW_GRID = "grid grid-cols-[24px_minmax(0,1fr)_46px_46px_52px] items-center gap-1";

const getItemMrp = (item) => Number(item?.mrp ?? item?.latestMRP ?? 0);
const getItemQty = (item) => Number(item?.qty ?? item?.offerProductQuantity ?? item.quantity ?? 0);
const getItemSalePrice = (item) => Number(item?.salePrice ?? item?.price ?? 0);
const getItemTotalAmount = (item) => {
    if (item?.isOfferFreeItem) return 0;

    return Number(item?.totalPrice ?? item?.totalAmount ?? getItemQty(item) * getItemSalePrice(item));
};
const getCouponDiscountAmount = (bill) =>
    Number(bill?.couponDiscount ?? bill?.couponDiscountAmount ?? bill?.coupons?.[0]?.discountAmount ?? 0) || 0;

const KOTPrintModal = ({ isOpen, onClose, selectedItems: selectedItemsProp, autoPrint = false }) => {
    const isOnline = useOnlineStatus();
    const { invoiceBillDetail, isInvoiceBillDetailLoading } = useInvoiceBillDetail(
        selectedItemsProp?.invoiceNo ?? selectedItemsProp?.bill?.invoiceNo,
        isOnline && Boolean(selectedItemsProp?.bill?.invoiceNo)
    );
    const autoPrintStarted = useRef(false);
    const onCloseRef = useRef(onClose);
    const [isPrinting, setIsPrinting] = useState(false);

    const mapServerBillToLocal = (invoiceBillDetail) => {
        const bill = invoiceBillDetail?.data?.bill;

        return {
            indexNo: bill.indexNo,
            invoiceNo: bill.invoiceNo,
            busyNumber: bill.busyNumber || null,
            source: bill.source,
            totalAmount: bill.totalAmount,
            payAmount: bill.payAmount,
            savingAmount: bill.savingAmount,
            schemeDiscountAmount: bill.schemeDiscountAmount ?? invoiceBillDetail?.data?.schemeDiscountAmount,
            loyaltyRedeemDiscount:
                bill.loyaltyRedeemDiscount ?? bill.loyaltyRedeemed ?? bill.loyalty?.redeemDiscount,
            couponDiscountAmount: getCouponDiscountAmount({
                ...bill,
                couponDiscount: invoiceBillDetail?.data?.couponDiscount,
            }),
            totalItems: bill.totalItems,
            totalQuantity: bill.totalQty,
            date: bill.date,
            gstNumber: bill?.gstNumber || "",
            customerName: bill.customer?.firstName,
            customerPhone: bill.customer?.phone,
            cashierId: bill.createdBy?.id,
            cashierName: bill.createdBy?.firstName,
            paymentMethod: bill.paymentMethod,
            payments: bill.payments ?? invoiceBillDetail?.data?.payments,
            billPayments: bill.billPayments ?? invoiceBillDetail?.data?.billPayments,
            loyalty:
                bill?.loyalty && (Number(bill.loyalty.earnedPoints) > 0 || Number(bill.loyalty.redeemedPoints) > 0)
                    ? {
                          ...bill.loyalty,
                          balanceAfter: bill.loyalty.entries?.length
                              ? bill.loyalty.entries[bill.loyalty.entries.length - 1].balanceAfter
                              : null,
                      }
                    : null,
            profitSharing: bill?.profitSharing
                ? {
                      isPartnerBill: bill.profitSharing.isPartnerBill,
                      subscription: bill.profitSharing.subscription
                          ? {
                                id: bill.profitSharing.subscription.id,
                                membershipNo: bill.profitSharing.subscription.membershipNo,
                                customerName: bill.profitSharing.subscription.customerName,
                                customerPhone: bill.profitSharing.subscription.customerPhone,
                                status: bill.profitSharing.subscription.status,
                            }
                          : null,
                      invoiceNo: bill.profitSharing.invoiceNo,
                      periodMonth: bill.profitSharing.periodMonth,
                      billValue: bill.profitSharing.billValue,
                      sharePercent: bill.profitSharing.sharePercent,
                      monthlyLimit: bill.profitSharing.monthlyLimit,
                      limitExceeded: bill.profitSharing.limitExceeded,
                      totalCredit: bill.profitSharing.totalCredit,
                      totalReversed: bill.profitSharing.totalReversed,
                      netCredit: bill.profitSharing.netCredit,
                      warnings: bill.profitSharing.warnings ?? [],
                      entries: bill.profitSharing.entries ?? [],
                      items: bill.profitSharing.items ?? [],
                  }
                : null,
            saleItems: (invoiceBillDetail?.data?.items || []).map((item) => ({
                itemCode: item.item_code,
                itemName: item.item_name,
                quantity: item.qty,
                mrp: Number(item.mrp),
                salePrice: Number(item.sale_price),
                inventoryPriceLayerId: item.inventoryPriceLayerId,
                isOfferFreeItem: item.isOfferFreeItem,
            })),
        };
    };

    const selectedItems = useMemo(() => {
        if (isOnline && invoiceBillDetail?.data) {
            return mapServerBillToLocal(invoiceBillDetail);
        }

        return selectedItemsProp;
    }, [isOnline, invoiceBillDetail, selectedItemsProp]);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!isOpen) {
            autoPrintStarted.current = false;
            return;
        }

        if (!isOpen || !autoPrint || !selectedItems || autoPrintStarted.current) return;

        autoPrintStarted.current = true;
        let printStarted = false;

        const timer = window.setTimeout(async () => {
            printStarted = true;
            try {
                await printToDefaultPrinter();
                onCloseRef.current?.();
            } catch (error) {
                toast.error(error?.message || "Unable to print invoice.");
                autoPrintStarted.current = false;
            }
        }, 100);

        return () => {
            window.clearTimeout(timer);
            if (!printStarted) autoPrintStarted.current = false;
        };
    }, [isOpen, autoPrint, selectedItems]);

    const items = selectedItems?.saleItems ?? selectedItems?.items ?? []
    const billPayments = normalizeBillPayments(selectedItems);
    const getPaymentTotal = (mode) =>
        billPayments.reduce(
            (total, payment) =>
                payment.paymentMode?.toLowerCase() === mode ? total + Number(payment.amount || 0) : total,
            0
        );
    const totalBillAmount =
        items.length > 0
            ? items.reduce((total, item) => total + getItemTotalAmount(item), 0)
            : Number(selectedItems?.totalAmount ?? selectedItems?.payAmount ?? 0);
    const couponDiscountAmount = getCouponDiscountAmount(selectedItems);
    const loyaltyRedeemedAmount = Math.max(
        Number(
            selectedItems?.loyaltyRedeemDiscount ??
                selectedItems?.loyaltyRedeemed ??
                selectedItems?.loyalty?.redeemDiscount ??
                0
        ) || 0,
        getPaymentTotal("loyalty")
    );
    const itemDiscountAmount = Math.max(0, Number(selectedItems?.totalAmount || 0) - totalBillAmount);
    const totalSavingsAmount = Number(selectedItems?.savingAmount ?? selectedItems?.discountAmount ?? 0);
    const inferredSchemeDiscountAmount =
        items.length > 0 && selectedItems?.totalAmount != null
            ? Math.max(0, totalSavingsAmount - itemDiscountAmount - couponDiscountAmount)
            : 0;
    const schemeDiscountAmount = Math.max(
        0,
        Number(selectedItems?.schemeDiscountAmount) || inferredSchemeDiscountAmount
    );
    const srnAdjustmentAmount = getPaymentTotal("srn_adjustment");
    const payableBeforeRounding = Math.max(
        0,
        totalBillAmount - loyaltyRedeemedAmount - couponDiscountAmount - schemeDiscountAmount
    );
    const roundedPayableAmount = Math.round(payableBeforeRounding);
    const roundedOffAmount = roundToDecimals(roundedPayableAmount - payableBeforeRounding);
    const netPayableAmount = Math.max(0, roundedPayableAmount - srnAdjustmentAmount);

    const sortedSaleItems = useMemo(() => {
        return [...items].sort((left, right) => getItemMrp(right) - getItemMrp(left));
    }, [selectedItems?.saleItems]);

    const handleKOTPrintAction = async () => {
        if (isPrinting) return;

        setIsPrinting(true);
        try {
            await printToDefaultPrinter();
            onClose?.();
        } catch (error) {
            toast.error(error?.message || "Unable to print invoice.");
        } finally {
            setIsPrinting(false);
        }
    };

    const toWords = new ToWords({
        localeCode: "en-IN",
        converterOptions: {
            currency: true,
            ignoreDecimal: false,
            ignoreZeroCurrency: false,
            doNotAddOnly: false,
        },
    });

    const priceTotal = items?.reduce((total, item) => total + Number(item.salePrice || 0), 0);

    return (
        <Dialog
            open={isOpen}
            aria-hidden={autoPrint}
            sx={autoPrint ? { visibility: "hidden" } : undefined}
            onClose={onClose}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    handleKOTPrintAction();
                }

                if (e.key === "Escape") {
                    e.preventDefault();
                    onClose();
                }
            }}
            maxWidth={false}
            slotProps={{
                paper: {
                    sx: {
                        width: 380,
                        maxWidth: 380,
                    },
                },
            }}
        >
            <DialogContent className="p-0!">
                <div className="flex flex-col max-h-[850px]">
                    <div className="flex-1 overflow-y-auto custom-scroll p-0">
                        {isInvoiceBillDetailLoading ? (
                            <div className="flex flex-col gap-2">
                                {Array.from({ length: 15 }).map((_, i) => (
                                    <Skeleton key={i} animation="wave" height={15} />
                                ))}
                            </div>
                        ) : (
                            <div
                                id="print-section"
                                className="text-[13px] text-third-800 w-fit mx-auto"
                                style={{ page: "kot-thermal" }}
                            >
                                <div className="border-b border-third-500">
                                    <div className="flex flex-col gap-1 items-center">
                                        <img src={Logo} alt="logo" className="w-28" />
                                        <div className="w-full! pb-0.5 text-[10px] font-bold text-center border-b border-third-500">
                                            INDIA'S TRUSTED MULTI BRAND GROCERY CHAIN STORES
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-0.5 items-center border-b border-third-500">
                                        <div className="text-[10px] font-normal">
                                            GROUND AND FIRST FLOOR, PLOT NO. 4 AND 4A
                                        </div>
                                        <div className="text-[10px] font-normal">
                                            OUT OF KHASRA NO 8/6, SHYAM VIHAR, PHASE II
                                        </div>
                                        <div className="text-[10px] font-normal">
                                            A-BLOCK, Najafgarh, New Delhi, Delhi-110043
                                        </div>
                                        <div className="w-full! text-[11px] font-bold">
                                            Customercare No : 9289890661
                                        </div>
                                        <div className="w-full! text-[10px] font-bold">
                                            customercare.rashankidukan.india@gmail.com
                                        </div>
                                        <div className="text-xs font-bold">GSTIN : 07AAPCR5365K1ZP </div>
                                    </div>
                                    <div className="border-b border-third-500 text-sm font-bold text-center">
                                        TAX INVOICE
                                    </div>

                                    <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5 text-[10px]">
                                        <span>Invoice No/Date :</span>
                                        <div className="flex flex-wrap">
                                            <span className="font-medium break-all">{selectedItems?.invoiceNo ?? selectedItems?.bill?.invoiceNo ?? ""} /</span>
                                            <span className="whitespace-nowrap">
                                                {selectedItems?.date
                                                    ? format(new Date(selectedItems.date), "dd-MM-yyyy")
                                                    : format(new Date(), "dd-MM-yyyy")}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedItems?.busyNumber && (
                                        <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5 text-[10px]">
                                            <span>BUSY Inv No :</span>
                                            <span className="justify-self-start font-bold">
                                                {selectedItems.busyNumber}
                                            </span>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5 text-[10px]">
                                        <span>Time:</span>
                                        <span className="justify-self-start">{format(new Date(), "hh:mm a")}</span>
                                    </div>
                                    <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5 text-[10px]">
                                        <span>User Name</span>
                                        <span className="justify-self-start">
                                            {selectedItems?.cashierName ?? "Busy"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5 text-[10px]">
                                        <span>Customer Name :</span>
                                        <span className="justify-self-start font-medium">
                                            {selectedItems?.customerName ?? selectedItems?.customer?.firstName ?? ""}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5 text-[10px]">
                                        <span>Cust Mobile No :</span>
                                        <span className="justify-self-start font-medium">
                                            {selectedItems?.customerPhone ?? selectedItems?.customer?.phone ?? ""}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-b border-third-500 px-2 py-0.5 text-[10px]">
                                    <div className="grid grid-cols-[24px_46px_minmax(0,1fr)] items-center gap-1">
                                        <div>S.no</div>
                                        <div className="col-span-1">Qty.</div>
                                        <div>Product</div>
                                    </div>

                                    <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-1">
                                        <div></div>
                                        <div className="grid grid-cols-3 items-center gap-1">
                                            <div>MRP</div>
                                            <div className="text-end">Price</div>
                                            <div className="text-end">Amt.</div>
                                        </div>
                                    </div>
                                </div>

                                {sortedSaleItems.map((p, index) => (
                                    <div
                                        key={`${p?.itemCode ?? p?.itemName}-${index}`}
                                        className="border-b border-dashed border-third-500 px-2 py-1 text-[10px] font-bold"
                                    >
                                        <div className="grid grid-cols-[24px_46px_minmax(0,1fr)] items-center gap-1">
                                            <div>{index + 1}</div>
                                            <div className="col-span-1">
                                                {getItemQty(p)} {getItemQty(p) === 1 ? "Unit" : "Units"}{" "}
                                            </div>
                                            <div>{initialLettersCapitalize(p?.itemName)}</div>
                                        </div>

                                        <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-1">
                                            <div></div>
                                            <div className="grid grid-cols-3 items-center gap-1">
                                                <div>{priceFormat(getItemMrp(p))}</div>
                                                <div className="text-end">{priceFormat(getItemSalePrice(p))}</div>
                                                <div className="text-end">{priceFormat(getItemTotalAmount(p))}</div>
                                            </div>
                                        </div>

                                        {/* Offer product */}
                                        {p?.offerProduct && p?.offerType !== "DISCOUNT" && (
                                            <div className="grid grid-cols-[24px_46px_minmax(0,1fr)] items-start gap-1 pt-1 pb-0.5">
                                                <div />
                                                <div className="leading-3">
                                                    {p.offerProduct.quantity}{" "}
                                                    {Number(p.offerProduct.quantity) === 1 ? "Unit" : "Units"}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="grid grid-cols-[minmax(0,1fr)_46px_46px] items-start gap-1">
                                                        <div className="min-w-0 wrap-break-words leading-3">
                                                            {initialLettersCapitalize(p.offerProduct.productName)}
                                                        </div>
                                                        <div className="text-end leading-3">
                                                            {priceFormat(
                                                                p.offerProduct.latestMRP ?? p.offerProduct.mrp
                                                            )}
                                                        </div>
                                                        <div className="text-end leading-3">FREE</div>
                                                    </div>
                                                    <div className="mt-0.5 text-[9px] font-normal italic leading-3 text-third-800">
                                                        Scheme Type: {p.offerType}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Total Summary */}
                                <div className="w-full px-2 py-1 text-[11px] font-bold">
                                    <div className="flex justify-between gap-2 py-0.5">
                                        <span>Total Bill Amount</span>
                                        <span>{priceFormat(totalBillAmount)}</span>
                                    </div>
                                    {loyaltyRedeemedAmount > 0 && (
                                        <div className="flex justify-between gap-2 py-0.5">
                                            <span>Loyalty Redeemed</span>
                                            <span>-{priceFormat(loyaltyRedeemedAmount)}</span>
                                        </div>
                                    )}
                                    {couponDiscountAmount > 0 && (
                                        <div className="flex justify-between gap-2 py-0.5">
                                            <span>Coupon Discount</span>
                                            <span>-{priceFormat(couponDiscountAmount)}</span>
                                        </div>
                                    )}
                                    {schemeDiscountAmount > 0 && (
                                        <div className="flex justify-between gap-2 py-0.5">
                                            <span>Scheme Discount</span>
                                            <span>-{priceFormat(schemeDiscountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between gap-2 py-0.5">
                                        <span>Rounded Off ({roundedOffAmount < 0 ? "-" : "+"})</span>
                                        <span>{priceFormat(Math.abs(roundedOffAmount))}</span>
                                    </div>
                                    {srnAdjustmentAmount > 0 && (
                                        <div className="flex justify-between gap-2 py-0.5">
                                            <span>SRN Adjustment Amount</span>
                                            <span>-{priceFormat(srnAdjustmentAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between gap-2 border-t border-third-500 py-0.5 text-sm">
                                        <span>Net Payable Amount</span>
                                        <span>{priceFormat(netPayableAmount)}</span>
                                    </div>
                                </div>

                                <div className="border-y border-third-500 text-[10px] font-bold leading-[1.3]">
                                    <div className="grid grid-cols-3 gap-1 border-b border-third-500 px-2 py-1 text-center">
                                        <span>MRP TOTAL</span>
                                        {/* <span>Price Total</span> */}
                                        <span>Amt. Total</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-1 px-2 py-1 text-center">
                                        <span>{priceFormat(selectedItems?.totalAmount)}</span>
                                        {/* <span>{priceFormat(priceTotal)}</span> */}
                                        <span>{priceFormat(selectedItems?.payAmount)}</span>
                                    </div>

                                    <div className="grid grid-cols-2 border-t border-third-500 text-center text-xs font-bold">
                                        <div className="border-r border-third-500 px-1 py-1">
                                            <div>Total Items</div>
                                            <div className="text-sm">{selectedItems?.totalItems ?? "-"}</div>
                                        </div>
                                        <div className="px-1 py-1">
                                            <div>Total Qty</div>
                                            <div className="text-sm">
                                                {selectedItems?.totalQuantity ?? selectedItems?.totalQty ?? "-"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-third-500 px-1 py-1 text-[10px]">
                                        {toWords?.convert(Math.round(Number(selectedItems?.payAmount || 0)))}
                                    </div>
                                </div>

                                <div className="border-b border-third-500 py-2 text-[11px] font-bold leading-[1.35]">
                                    <div className="mx-2 rounded border-2 border-black py-1 text-center text-base font-extrabold">
                                        YOU SAVE: {priceFormat(selectedItems?.savingAmount)}
                                    </div>
                                    {/* <div className="flex justify-between">
                                        <span>Total Saving</span>
                                        <span>{priceFormat(selectedItems?.savingAmount ?? 0)}</span>
                                    </div> */}
                                    {/* <div className="grid grid-cols-[52px_1fr_1fr_1fr] gap-1 text-[11px] mb-1">
                                        <span className="underline">Tax Rate</span>
                                        <span className="text-right underline">Taxable Amt.</span>
                                        <span className="text-right underline">CGST Amt.</span>
                                        <span className="text-right underline">SGST Amt.</span>

                                        <span className="font-medium">18%</span>
                                        <span className="font-medium text-right">509.28</span>
                                        <span className="font-medium text-right">45.84</span>
                                        <span className="font-medium text-right">45.84</span>
                                    </div> */}

                                    {/* <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5">
                                        <span>Total GST</span>
                                        <span>: {priceFormat(91.68)}</span>
                                    </div> */}

                                    {normalizeBillPayments(selectedItems).length > 0 && (
                                        <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5">
                                            <span>Payment Mode</span>
                                            <span>: {formatBillPaymentsSummary(selectedItems)}</span>
                                        </div>
                                    )}

                                    {/* <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5">
                                        <span>Tender Amount</span>
                                        <span>: {priceFormat(selectedItems?.payAmount ?? 0)}</span>
                                    </div>

                                    <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5">
                                        <span>Return Amount</span>
                                        <span>: {priceFormat(0)}</span>
                                    </div>

                                    <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5">
                                        <span>Previous Gram</span>
                                        <span>: {selectedItems?.loyalty?.previousGram ?? 0}</span>
                                    </div>

                                    <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5">
                                        <span>Gram Earned</span>
                                        <span>: {selectedItems?.loyalty?.earnedPoints ?? 0}</span>
                                    </div>

                                    <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5">
                                        <span>Gram Redeemed</span>
                                        <span>: {selectedItems?.loyalty?.redeemedPoints ?? 0}</span>
                                    </div>

                                    <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5">
                                        <span>Available Gram</span>
                                        <span>: {selectedItems?.loyalty?.balanceAfter ?? 0}</span>
                                    </div> */}
                                </div>

                                {selectedItems?.loyalty && (
                                    <div className="flex flex-col gap-1 border-t border-dashed border-third-500 px-3 py-2 text-xs">
                                        <div className="text-center font-bold tracking-wide">LOYALTY</div>
                                        {selectedItems.loyalty.tier?.name && (
                                            <div className="flex justify-between">
                                                <span>Tier</span>
                                                <span className="font-bold">{selectedItems.loyalty.tier.name}</span>
                                            </div>
                                        )}
                                        {Number(selectedItems.loyalty.earnedPoints || 0) > 0 && (
                                            <div className="flex justify-between">
                                                <span>Points earned</span>
                                                <span className="font-bold">
                                                    +{selectedItems.loyalty.earnedPoints} pts
                                                </span>
                                            </div>
                                        )}
                                        {Number(selectedItems.loyalty.redeemedPoints || 0) > 0 && (
                                            <div className="flex justify-between">
                                                <span>Points redeemed</span>
                                                <span className="font-bold">
                                                    −{selectedItems.loyalty.redeemedPoints} pts (
                                                    {priceFormat(selectedItems.loyalty.redeemDiscount || 0)})
                                                </span>
                                            </div>
                                        )}
                                        {selectedItems.loyalty.balanceAfter != null && (
                                            <div className="flex justify-between">
                                                <span>New balance</span>
                                                <span className="font-bold">
                                                    {selectedItems.loyalty.balanceAfter} pts (≈{" "}
                                                    {priceFormat(
                                                        Number(selectedItems.loyalty.balanceAfter || 0) *
                                                            Number(selectedItems.loyalty.pointsToRupeeRate || 0.5)
                                                    )}
                                                    )
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selectedItems?.profitSharing?.isPartnerBill &&
                                    selectedItems?.profitSharing?.subscription?.status === "active" && (
                                        <div className="flex flex-col gap-0.5 border-b border-third-500 py-2 text-[11px] font-bold">
                                            <div className="text-sm text-center tracking-wide">PARTNER PROFIT</div>
                                            <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5">
                                                <span>Membership No.</span>
                                                <span>: {selectedItems.profitSharing.subscription.membershipNo}</span>
                                            </div>
                                            <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5">
                                                <span>Share ({selectedItems.profitSharing.sharePercent}%)</span>
                                                <span>: {priceFormat(selectedItems.profitSharing.totalCredit)}</span>
                                            </div>
                                            {Number(selectedItems.profitSharing.totalReversed) > 0 && (
                                                <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5">
                                                    <span>Reversed Amount</span>
                                                    <span>
                                                        : -{priceFormat(selectedItems.profitSharing.totalReversed)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                <div className="my-2 flex flex-col gap-0.5">
                                    <div className="font-bold text-sm">THANKS FOR SHOPPING WITH US.</div>
                                    <div className="text-[11px] font-bold">NO EXCHANGE, NO RETURN, NO REFUND</div>
                                    <div className="text-[11px] font-bold">*T&C APPLY</div>
                                    <div className="text-[11px] font-bold">SCAN ME FOR LATEST OFFER</div>
                                    <div className="w-full flex items-center! justify-center">
                                        <QRCode value={selectedItems?.invoiceNo ?? selectedItems?.bill?.invoiceNo ?? ""} size={90} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="sticky bottom-0 border-t px-4 py-3 flex justify-end gap-3">
                        <KitButton className="w-auto h-fit" variant="outlined" size="small" onClick={onClose}>
                            Cancel
                        </KitButton>
                        <KitButton
                            variant="contained"
                            className="w-auto h-fit"
                            size="small"
                            startIcon={<i className="tabler-printer" />}
                            disabled={isPrinting}
                            onClick={handleKOTPrintAction}
                        >
                            {isPrinting ? "Printing..." : "Print Invoice"}
                        </KitButton>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default KOTPrintModal;
