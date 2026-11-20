import React, { useEffect, useRef, useState } from "react";
import { Backdrop, CircularProgress } from "@mui/material";
import KitModal from "../../../../kit/components/KitModal";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import { denominations } from "../../../../kit/configs/general";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import { format } from "date-fns";
import storage from "../../../../kit/hooks/data/services/storage";
import KitShow from "../../../../kit/components/KitShow/KitShow";
import AdvanceSlipModal from "./AdvanceSlipModal";
import VoucherSlipModal from "./VoucherSlipModal";
import { toast } from "react-toastify";
import useUser from "../../../../kit/hooks/useUser";
import { getElectronApi } from "../../../../kit/utils/electronApi";
import { filterBillsForCashier, getLoggedInCashier } from "../../../../kit/utils/cashierBills";
import { syncDayBillsToServer, uploadInvoicesToServer } from "../../../../kit/utils/syncOperations";
import { useGetAllDayEnd } from "../../../../kit/hooks/data/dayEnd";
import { useAdvanceSlips } from "../../../../kit/hooks/data/cashierAdvance";
import KitLoader from "../../../../kit/components/KitLoader/KitLoader";
import { buildSlipFromDayBill, dayEndParams, localPaymentTotals } from "../../../../kit/utils/settlementSlip";

const BillFormModal = ({
    isOpen,
    onClose,
    onDayStatusChange,
    onRefresh,
    onStartDayComplete,
    onEndDayComplete,
    onShowSettlementSlip,
    dayStatus,
}) => {
    const userData = useUser();
    const firstInputRef = useRef(null);
    const startDayButtonRef = useRef(null);
    const endDayButtonRef = useRef(null);
    const endDayTotalsAppliedRef = useRef(false);
    const dayEndErrorNotifiedRef = useRef(false);
    const today = format(new Date(), "yyyy-MM-dd");
    const isTodayStarted = dayStatus === "End Day";
    const isTodayEnded = dayStatus === "Day Closed";

    const [advanceCount, setAdvanceCount] = useState("");
    const [advanceAmount, setAdvanceAmount] = useState("");
    const [voucherCount, setVoucherCount] = useState("");
    const [voucherAmount, setVoucherAmount] = useState("");
    const [totalCardAmount, setTotalCardAmount] = useState("");
    const [totalCardCount, setTotalCardCount] = useState("");
    const [totalUPIAmount, setTotalUPIAmount] = useState("");
    const [totalUPICount, setTotalUPICount] = useState("");
    const [totalSodexoAmount, setTotalSodexoAmount] = useState("");
    const [totalSodexoCount, setTotalSodexoCount] = useState("");
    const [voucherRemark, setVoucherRemark] = useState("");
    const [givenTo, setGivenTo] = useState("");
    const [cash, setCash] = useState(
        denominations.map((value) => ({
            denomination: value,
            count: "",
        }))
    );
    const [submittedCash, setSubmittedCash] = useState(
        denominations.map((value) => ({
            denomination: value,
            count: "",
        }))
    );
    const [voucherSlipOpen, setVoucherSlipOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [advanceSlipOpen, setAdvanceSlipOpen] = useState(false);
    // "pending" until unsynced bills are uploaded, so the server day-end totals include them.
    const [billsSync, setBillsSync] = useState("pending");
    const [daySales, setDaySales] = useState({ orders: 0 });
    const [cashAutoCount, setCashAutoCount] = useState("");
    const [cashEntryAmount, setCashEntryAmount] = useState("");
    const advanceAppliedRef = useRef(false);
    const isEndDayForm = isOpen && isTodayStarted && !isTodayEnded;

    useEffect(() => {
        if (!isEndDayForm) {
            setBillsSync("pending");
            return;
        }
        let active = true;
        const upload = async () => {
            if (!navigator.onLine) return "offline";
            try {
                await uploadInvoicesToServer({ userData });
                return "synced";
            } catch (error) {
                console.error("End day bill upload failed:", error);
                return "offline";
            }
        };
        upload().then((state) => active && setBillsSync(state));
        return () => {
            active = false;
        };
    }, [isEndDayForm]);

    const { dayEndList, isDayEndListLoading, isValidatingDayEndList, dayEndListError } = useGetAllDayEnd(
        dayEndParams({ date: today, cashierId: getLoggedInCashier(userData).id }),
        isEndDayForm && billsSync !== "pending"
    );
    const { advanceSlips, isValidatingAdvanceSlips, refreshAdvanceSlips } = useAdvanceSlips(
        { startDate: today, endDate: today, limit: 1 },
        isEndDayForm
    );

    const applyEntryTotals = ({ orders = 0, cash = {}, card = {}, upi = {}, sodexo = {} }) => {
        setDaySales({ orders: Number(orders || 0) });
        setCashAutoCount(String(cash.count ?? 0));
        setTotalCardCount(String(card.count ?? 0));
        setTotalCardAmount(String(card.amount ?? 0));
        setTotalUPICount(String(upi.count ?? 0));
        setTotalUPIAmount(String(upi.amount ?? 0));
        setTotalSodexoCount(String(sodexo.count ?? 0));
        setTotalSodexoAmount(String(sodexo.amount ?? 0));
    };

    useEffect(() => {
        if (!isEndDayForm) {
            endDayTotalsAppliedRef.current = false;
            dayEndErrorNotifiedRef.current = false;
            return;
        }
        if (billsSync === "pending" || endDayTotalsAppliedRef.current || isValidatingDayEndList) return;
        if (billsSync === "synced" && !dayEndList && !dayEndListError) return;
        endDayTotalsAppliedRef.current = true;

        const serverData = billsSync === "synced" && dayEndList?.success ? dayEndList.data : null;
        const server = serverData && {
            orders: serverData.totalOrders,
            cash: { count: serverData.totalCash?.count, amount: serverData.cash },
            card: serverData.totalCard,
            upi: serverData.totalUpi,
            sodexo: serverData.totalSodexo,
        };

        getElectronApi()
            .getBills()
            .then((bills) => localPaymentTotals(filterBillsForCashier(bills, userData), today))
            .catch((error) => {
                console.error("Unable to read local bills for end day totals:", error);
                return null;
            })
            .then((local) => {
                // Bills billed on this counter may not have reached the server yet, so use whichever saw more orders.
                const totals = !local || (server && Number(server.orders || 0) >= local.orders) ? server : local;
                if (totals) applyEntryTotals(totals);
                else toast.error(dayEndListError?.message || dayEndList?.message || "Unable to fetch today's collection totals.");
            });
    }, [isEndDayForm, billsSync, dayEndList, dayEndListError, isValidatingDayEndList]);

    useEffect(() => {
        if (!isEndDayForm) {
            advanceAppliedRef.current = false;
            return;
        }
        if (!advanceAppliedRef.current) {
            advanceAppliedRef.current = true;
            refreshAdvanceSlips();
        }
    }, [isEndDayForm]);

    useEffect(() => {
        // Cached slips can be from before the manager approved; apply only the latest server response.
        const byStatus = advanceSlips?.data?.byStatus;
        if (!isEndDayForm || !byStatus || isValidatingAdvanceSlips) return;

        const handedOver = [byStatus.pending, byStatus.approved].filter(Boolean);
        const count = handedOver.reduce((sum, item) => sum + Number(item.count || 0), 0);
        const amount = handedOver.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
        setAdvanceCount(String(count));
        setAdvanceAmount(String(amount));
    }, [isEndDayForm, advanceSlips, isValidatingAdvanceSlips]);

    const toggleVoucherSlipModal = () => setVoucherSlipOpen(!voucherSlipOpen);
    const toggleAdvanceSlipModal = () => setAdvanceSlipOpen(!advanceSlipOpen);

    const handleCountChange = (index, count) => {
        setCash((prev) => prev.map((item, i) => (i === index ? { ...item, count } : item)));
    };

    const handleSubmittedCountChange = (index, count) => {
        setSubmittedCash((prev) => prev.map((item, i) => (i === index ? { ...item, count } : item)));
    };

    const totalCash = cash.reduce((sum, item) => sum + item.denomination * Number(item.count || 0), 0);
    const totalNotes = cash.reduce((sum, item) => sum + Number(item.count || 0), 0);

    const submittedTotalCash = submittedCash.reduce( (sum, item) => sum + item.denomination * Number(item.count || 0), 0);
    const submittedTotalNotes = submittedCash.reduce((sum, item) => sum + Number(item.count || 0), 0);

    const handleStartDay = async () => {
        const cashier = getLoggedInCashier(userData);
        if (!cashier.id) {
            toast.error("Unable to identify cashier. Please log in again.");
            return;
        }

        if (totalCash !== 3000) {
            toast.error("Total cash must be exactly ₹3,000 to start the day.");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                userId: String(cashier.id),
                cashier: `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim(),
                date: format(new Date(), "yyyy-MM-dd"),
                start: {
                    date: new Date().toISOString(),
                    denominations: structuredClone(cash),
                    totalCash,
                    totalNotes,
                    advanceCount,
                    advanceAmount: Number(advanceAmount || 0),
                    voucherCount,
                    voucherAmount: Number(voucherAmount || 0),
                    voucherRemark,
                    givenTo,
                },
                end: null,
            };
            await getElectronApi().saveDayBill(payload);
            toast.success("Day started successfully.");
            onStartDayComplete?.(payload);
            onClose();

            if (navigator.onLine) {
                try {
                    await syncDayBillsToServer({ cashierId: String(cashier.id) });
                } catch (syncError) {
                    toast.warning("Day started, but could not sync with the server.");
                }
            }

            try {
                const refreshedLogs = await onRefresh?.();
                await onDayStatusChange?.(refreshedLogs);
            } catch (refreshError) {
                toast.warning("Day started, but the cashier day status could not be refreshed.");
            }
        } catch (error) {
            toast.error(error?.message || "Failed to start day.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEndDay = async () => {
        const cashier = getLoggedInCashier(userData);
        if (!cashier.id) {
            toast.error("Unable to identify cashier. Please log in again.");
            return;
        }

        if (isValidatingAdvanceSlips) {
            toast.error("Advance amount is still loading. Please wait a moment.");
            return;
        }

        const hasAtLeastOneCount = cash.some(
            (item) => item.count !== "" && item.count !== null && item.count !== undefined && Number(item.count) > 0
        );

        if (!hasAtLeastOneCount) {
            toast.error("Please enter at least one cash denomination count");
            return;
        }

        const payload = {
            userId: String(cashier.id),
            storeId: Number(userData?.storeId),
            date: format(new Date(), "yyyy-MM-dd"),
            userName: `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim(),
            counterId: '',
            mobileNumber: '',
            end: {
                date: new Date().toISOString(),
                counterSummary: {
                    denominations: cash,
                    totalCash: totalCash,
                    totalNotes: totalNotes,
                },
                submittedSummary: {
                    denominations: submittedCash,
                    totalCash: submittedTotalCash,
                    totalNotes: submittedTotalNotes,
                },
                advances: {
                    count: Number(advanceCount) || 0,
                    amount: Number(advanceAmount) || 0,
                },
                voucher: {
                    count: Number(voucherCount) || 0,
                    amount: Number(voucherAmount) || 0,
                    remark: voucherRemark || "",
                },
                totalCashPayment: {
                    count: Number(cashAutoCount) || 0,
                    amount: Number(cashEntryAmount) || 0,
                },
                totalCardPayment: {
                    count: Number(totalCardCount) || 0,
                    amount: Number(totalCardAmount) || 0,
                },
                totalUpiPayment: {
                    count: Number(totalUPICount) || 0,
                    amount: Number(totalUPIAmount) || 0,
                },
                totalSodexoPayment: {
                    count: Number(totalSodexoCount) || 0,
                    amount: Number(totalSodexoAmount) || 0,
                },
                givenTo: givenTo || "",
            },
        };

        setIsSaving(true);
        try {
            const dayBills = await getElectronApi().getDayBills(String(cashier.id));
            const todayBill = dayBills.find((bill) => bill.date === today);

            if (!todayBill) {
                throw new Error("Unable to find today's start-day record.");
            }

            // const startingCash = Number(todayBill.start?.totalCash || 0);

            // if (submittedTotalCash < startingCash) {
            //     toast.error(`Submitted cash must be at least ${priceFormat(startingCash)}.`);
            //     return;
            // }

            const completedDayBill = { ...todayBill, ...payload };
            await getElectronApi().saveDayBill(completedDayBill);
            toast.success("Day ended successfully.");

            // if (navigator.onLine) {
            //     await syncDayBillsToServer({ cashierId: String(cashier.id) });
            // }

            const settlementSlip = {
                ...buildSlipFromDayBill(structuredClone(completedDayBill), userData),
                dayEnd: dayEndList?.data || {},
            };

            await onEndDayComplete?.(settlementSlip);
            onClose();
        } catch (error) {
            toast.error(error?.message || "Failed to end day.");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrintSummary = async () => {
        const cashierId = getLoggedInCashier(userData).id;
        setIsSaving(true);
        try {
            const dayBills = await getElectronApi().getDayBills(String(cashierId));
            const todayBill = dayBills.find((bill) => bill.date === today && bill.end);
            if (!todayBill) {
                toast.error("Today's end-day record was not found on this computer.");
                return;
            }
            onShowSettlementSlip(buildSlipFromDayBill(todayBill, userData));
            onClose();
        } catch (error) {
            toast.error(error?.message || "Unable to load the settlement summary.");
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                firstInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key !== "Enter") return;

            if (advanceSlipOpen || voucherSlipOpen) return;

            e.preventDefault();

            if (isSaving) return;

            if (!isTodayStarted) {
                startDayButtonRef.current?.click();
            } else if (!isTodayEnded) {
                endDayButtonRef.current?.click();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, isSaving, isTodayStarted, isTodayEnded, advanceSlipOpen, voucherSlipOpen]);

    return (
        <>
            {!isTodayStarted ? (
                <KitModal
                    maxWidth="sm"
                    isOpen={isOpen}
                    onClose={onClose}
                    title={<div className="text-base font-semibold">Biller Form for Start of Day</div>}
                    titleClass="p-3! border-b"
                >
                    <div className="p-4 pb-0">
                        <div className="grid grid-cols-2 gap-y-2 text-sm mb-5">
                            <div className="font-semibold">Date</div>
                            <div>{format(new Date(), "do MMMM yyyy")}</div>
                            <div className="font-semibold">User</div>
                            <div>
                                {userData?.firstName} {userData?.lastName}
                            </div>
                            <div className="font-semibold">Role</div>
                            <div>{userData?.role}</div>
                            <div className="font-semibold">User ID</div>
                            <div>{getLoggedInCashier(userData).id}</div>
                        </div>

                        <table className="w-full border border-collapse text-sm">
                            <thead className="bg-third-100">
                                <tr>
                                    <th className="border p-2 text-left w-40">Denomination</th>
                                    <th className="border p-2 text-start w-44">Count</th>
                                    <th className="border p-2 text-right">Amount</th>
                                </tr>
                            </thead>

                            <tbody>
                                {cash.map((item, index) => (
                                    <tr key={item.denomination}>
                                        <td className="border p-2">{priceFormat(item.denomination)} </td>
                                        <td className="border p-1">
                                            <KitTextField
                                                inputRef={index === 0 ? firstInputRef : undefined}
                                                type="number"
                                                size="small"
                                                value={item.count}
                                                onChange={(e) => handleCountChange(index, e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "-" || e.key === "Minus") {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td className="border p-2 text-right font-medium">
                                            {priceFormat(item.denomination * item.count)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>

                            <tfoot>
                                <tr className="bg-third-50! font-semibold">
                                    <td className="border p-2">Total</td>
                                    <td className="border p-2 text-start">{totalNotes}</td>
                                    <td className="p-2 text-right text-primary">{priceFormat(totalCash)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* <div className="rounded-md">
                        <div className="space-y-3 p-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="min-w-28 text-sm font-semibold">Advances</div>
                                    <KitTextField
                                        type="number"
                                        size="small"
                                        className="w-40"
                                        placeholder="Enter Advance Count"
                                        height="26px !important"
                                        placeholderFontSize={14}
                                        value={advanceCount}
                                        onChange={(e) => setAdvanceCount(e.target.value)}
                                    />
                                    <KitTextField
                                        type="number"
                                        size="small"
                                        placeholder="Enter Advance Amount"
                                        className="w-40"
                                        height="26px !important"
                                        placeholderFontSize={14}
                                        value={advanceAmount}
                                        onChange={(e) => setAdvanceAmount(e.target.value)}
                                    />
                                </div>
                                <KitButton
                                    variant="outlined"
                                    className="w-auto h-7!"
                                    size="small"
                                    onClick={toggleAdvanceSlipModal}
                                >
                                    + Advance
                                </KitButton>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="min-w-28 text-sm font-semibold">Voucher</div>
                                    <KitTextField
                                        type="number"
                                        size="small"
                                        className="w-40"
                                        placeholder="Enter Voucher Count"
                                        height="26px !important"
                                        placeholderFontSize={14}
                                        value={voucherCount}
                                        onChange={(e) => setVoucherCount(e.target.value)}
                                    />
                                    <KitTextField
                                        type="number"
                                        size="small"
                                        placeholder="Enter Voucher Amount"
                                        className="w-40"
                                        height="26px !important"
                                        placeholderFontSize={14}
                                        value={voucherAmount}
                                        onChange={(e) => setVoucherAmount(e.target.value)}
                                    />
                                </div>
                                <KitButton
                                    variant="outlined"
                                    className="w-auto h-7!"
                                    size="small"
                                    onClick={toggleVoucherSlipModal}
                                >
                                    + Voucher
                                </KitButton>
                            </div>
                        </div>
                    </div> */}

                    <div className="p-4 flex justify-end gap-3">
                        <KitButton className="w-auto" variant="outlined" size="small" onClick={onClose}>
                            Cancel
                        </KitButton>
                        <KitButton
                            ref={startDayButtonRef}
                            variant="contained"
                            className="w-auto"
                            size="small"
                            onClick={handleStartDay}
                            disabled={isSaving}
                        >
                            {isSaving ? "Saving..." : "Start Day"}
                        </KitButton>
                    </div>
                </KitModal>
            ) : !isTodayEnded ? (
                <KitModal
                    maxWidth="xl"
                    isOpen={isOpen}
                    onClose={onClose}
                    title={
                        <div className="flex flex-wrap items-center gap-x-6 text-sm">
                            <span className="text-base font-semibold">Biller Form for End of Day</span>
                            <span><b>Date:</b> {format(new Date(), "dd/MM/yyyy")}</span>
                            <span><b>User Name:</b> {`${userData?.firstName || ""} ${userData?.lastName || ""}`.trim()}</span>
                        </div>
                    }
                    titleClass="px-3! py-2! border-b"
                >
                    <div className="space-y-2 p-2">
                        {billsSync === "pending" || isDayEndListLoading ? (
                            <div className="h-80 flex justify-center">
                                <KitLoader logo={false} isLoading={true} />
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                                    <section className="overflow-hidden rounded-xl border-2 border-sky-300">
                                        <h2 className="bg-sky-200 px-3 py-0.5 text-center text-sm font-extrabold uppercase text-slate-900">
                                            Counter Summary
                                        </h2>

                                        <div className="p-1">
                                            <table className="w-full table-fixed border-collapse text-xs">
                                                <thead className="bg-sky-100">
                                                    <tr>
                                                        <th className="w-[34%] border border-slate-400 px-2 py-0.5 text-left">
                                                            Denomination
                                                        </th>
                                                        <th className="w-[28%] border border-slate-400 px-2 py-0.5">Count</th>
                                                        <th className="border border-slate-400 px-2 py-0.5">Amount (₹)</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {cash.map((item, index) => (
                                                        <tr key={item.denomination} className="bg-sky-50/70">
                                                            <td className="border border-slate-300 px-2 py-0 font-semibold">
                                                                {priceFormat(item.denomination)}
                                                            </td>

                                                            <td className="border border-slate-300 px-1 py-0">
                                                                <KitTextField
                                                                    inputRef={index === 0 ? firstInputRef : undefined}
                                                                    type="number"
                                                                    size="small"
                                                                    height="24px !important"
                                                                    value={item.count}
                                                                    onChange={(e) =>
                                                                        handleCountChange(index, e.target.value)
                                                                    }
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "-" || e.key === "Minus") {
                                                                            e.preventDefault();
                                                                        }
                                                                    }}
                                                                />
                                                            </td>

                                                            <td className="border border-slate-300 px-2 py-0 text-right font-medium">
                                                                {priceFormat(
                                                                    item.denomination * Number(item.count || 0)
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>

                                                <tfoot>
                                                    <tr className="bg-sky-200 font-bold">
                                                        <td className="border border-slate-400 px-2 py-0.5">Total Cash</td>
                                                        <td className="border border-slate-400 px-2 py-0.5 text-center">
                                                            {totalNotes}
                                                        </td>
                                                        <td className="border border-slate-400 px-2 py-0.5 text-right">
                                                            {priceFormat(totalCash)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </section>

                                    <section className="overflow-hidden rounded-xl border-2 border-green-300">
                                        <h2 className="bg-green-200 px-3 py-0.5 text-center text-sm font-extrabold uppercase text-slate-900">
                                            Submitted Summary
                                        </h2>

                                        <div className="p-1">
                                            <table className="w-full table-fixed border-collapse text-xs">
                                                <thead className="bg-green-100">
                                                    <tr>
                                                        <th className="w-[34%] border border-slate-400 px-2 py-0.5 text-left">
                                                            Denomination
                                                        </th>
                                                        <th className="w-[28%] border border-slate-400 px-2 py-0.5">Count</th>
                                                        <th className="border border-slate-400 px-2 py-0.5">Amount (₹)</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {submittedCash.map((item, index) => (
                                                        <tr key={item.denomination} className="bg-green-50/70">
                                                            <td className="border border-slate-300 px-2 py-0 font-semibold">
                                                                {priceFormat(item.denomination)}
                                                            </td>

                                                            <td className="border border-slate-300 px-1 py-0">
                                                                <KitTextField
                                                                    type="number"
                                                                    size="small"
                                                                    height="24px !important"
                                                                    value={item.count}
                                                                    onChange={(e) =>
                                                                        handleSubmittedCountChange(
                                                                            index,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "-" || e.key === "Minus") {
                                                                            e.preventDefault();
                                                                        }
                                                                    }}
                                                                />
                                                            </td>

                                                            <td className="border border-slate-300 px-2 py-0 text-right font-medium">
                                                                {priceFormat(
                                                                    item.denomination * Number(item.count || 0)
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>

                                                <tfoot>
                                                    <tr className="bg-green-200 font-bold">
                                                        <td className="border border-slate-400 px-2 py-0.5">Total Cash</td>
                                                        <td className="border border-slate-400 px-2 py-0.5 text-center">
                                                            {submittedTotalNotes}
                                                        </td>
                                                        <td className="border border-slate-400 px-2 py-0.5 text-right">
                                                            {priceFormat(submittedTotalCash)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </section>
                                </div>

                                <div className="grid grid-cols-1 gap-2 rounded-lg border border-slate-300 p-1 md:grid-cols-2">
                                    <div className="order-2 overflow-hidden rounded border border-pink-200">
                                        <div className="flex items-center justify-between bg-pink-100 px-2 py-0.5 text-xs font-bold uppercase">
                                            <span>Today&apos;s Collection (Auto)</span>
                                            <span>Total Orders: {daySales.orders}</span>
                                        </div>
                                        <table className="w-full text-sm">
                                            <thead className="text-xs text-slate-500">
                                                <tr>
                                                    <th className="px-2 text-left font-medium">Mode</th>
                                                    <th className="px-2 text-right font-medium">Orders</th>
                                                    <th className="px-2 text-right font-medium">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* <tr className="border-t border-pink-100 bg-green-50">
                                                    <td className="px-2 py-0.5 font-bold">Cash</td>
                                                    <td className="px-2 py-0.5 text-right font-semibold">
                                                        {Number(cashAutoCount || 0)}
                                                    </td>
                                                    <td className="px-2 py-0.5">
                                                        <KitTextField
                                                            type="number"
                                                            size="small"
                                                            placeholder="Amount"
                                                            height="24px !important"
                                                            placeholderFontSize={12}
                                                            value={cashEntryAmount}
                                                            onChange={(e) => setCashEntryAmount(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "-" || e.key === "Minus") {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                        />
                                                    </td>
                                                </tr> */}
                                                {[
                                                    // ["Card", totalCardCount, totalCardAmount, "bg-pink-50"],
                                                    // ["UPI", totalUPICount, totalUPIAmount, "bg-purple-50"],
                                                    ["Amex / Sodexo", totalSodexoCount, totalSodexoAmount, "bg-teal-50"],
                                                ].map(([label, count, amount, tone]) => (
                                                    <tr key={label} className={`border-t border-pink-100 ${tone}`}>
                                                        <td className="px-2 py-0.5 font-bold">{label}</td>
                                                        <td className="px-2 py-0.5 text-right font-semibold">{Number(count || 0)}</td>
                                                        <td className="px-2 py-0.5 text-right font-semibold">{priceFormat(amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="order-1 overflow-hidden rounded border border-orange-200">
                                        <div className="grid grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 bg-orange-50 px-2 py-1">
                                            <span className="text-sm font-bold">Advances</span>
                                            <span className="text-sm">
                                                Count: <b>{Number(advanceCount || 0)}</b>
                                            </span>
                                            <span className="text-sm font-bold">
                                                {isValidatingAdvanceSlips ? "Loading..." : priceFormat(advanceAmount)}
                                            </span>
                                            {/* <KitButton
                                                variant="outlined"
                                                className="w-auto! h-8! whitespace-nowrap"
                                                size="small"
                                                onClick={toggleAdvanceSlipModal}
                                            >
                                                + Advance
                                            </KitButton> */}
                                        </div>

                                        <div className="grid grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 border-t border-orange-200 bg-orange-50 p-2">
                                            <span className="text-sm font-bold">Voucher</span>
                                            <KitTextField
                                                type="number"
                                                size="small"
                                                placeholder="Enter Count"
                                                height="26px !important"
                                                placeholderFontSize={14}
                                                className="bg-white!"
                                                value={voucherCount}
                                                onChange={(e) => setVoucherCount(e.target.value)}
                                            />
                                            <KitTextField
                                                type="number"
                                                size="small"
                                                placeholder="Enter Amount"
                                                height="26px !important"
                                                placeholderFontSize={14}
                                                className="bg-white!"
                                                value={voucherAmount}
                                                onChange={(e) => setVoucherAmount(e.target.value)}
                                            />
                                            {/* <KitButton
                                                variant="outlined"
                                                className="w-auto! h-8! whitespace-nowrap"
                                                size="small"
                                                onClick={toggleVoucherSlipModal}
                                            >
                                                + Voucher
                                            </KitButton> */}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-200 px-3 py-2">
                        <KitButton className="w-auto" variant="outlined" size="small" onClick={onClose}>
                            Cancel
                        </KitButton>
                        <KitButton
                            ref={endDayButtonRef}
                            variant="contained"
                            className="w-auto"
                            size="small"
                            onClick={handleEndDay}
                            disabled={isSaving}
                        >
                            {isSaving ? "Saving..." : "End Day"}
                        </KitButton>
                    </div>
                </KitModal>
            ) : (
                <KitModal
                    maxWidth="xs"
                    isOpen={isOpen}
                    onClose={onClose}
                    title={<div className="text-base font-semibold">Day Closed</div>}
                    titleClass="p-3 border-b"
                >
                    <div className="p-4 text-center"> Today's day closing is already completed.</div>
                    <div className="p-4 flex justify-end gap-3">
                        <KitButton className="w-auto" variant="outlined" size="small" onClick={onClose}>
                            Cancel
                        </KitButton>
                        {onShowSettlementSlip && (
                            <KitButton
                                className="w-auto"
                                variant="contained"
                                size="small"
                                onClick={handlePrintSummary}
                                disabled={isSaving}
                            >
                                Print Summary
                            </KitButton>
                        )}
                    </div>
                </KitModal>
            )}

            <Backdrop
                open={isSaving && isTodayStarted && !isTodayEnded}
                sx={{ zIndex: (theme) => theme.zIndex.modal + 1, color: "#fff", flexDirection: "column", gap: 1.5 }}
            >
                <CircularProgress color="inherit" />
                <span className="text-sm font-semibold">Ending day...</span>
            </Backdrop>

            <KitShow show={advanceSlipOpen}>
                <AdvanceSlipModal
                    isOpen={advanceSlipOpen}
                    onClose={toggleAdvanceSlipModal}
                    userData={userData}
                    amount={advanceAmount}
                    givenTo={givenTo}
                    setGivenTo={setGivenTo}
                />
            </KitShow>

            <KitShow show={voucherSlipOpen}>
                <VoucherSlipModal
                    isOpen={voucherSlipOpen}
                    onClose={toggleVoucherSlipModal}
                    userData={userData}
                    amount={voucherAmount}
                    voucherRemark={voucherRemark}
                    setVoucherRemark={setVoucherRemark}
                />
            </KitShow>
        </>
    );
};

export default BillFormModal;
