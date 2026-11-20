import { Backdrop, CircularProgress, Dialog, DialogContent } from "@mui/material";
import { format } from "date-fns";
import { useState } from "react";
import { ToWords } from "to-words";
import { toast } from "react-toastify";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import { printToDefaultPrinter } from "../../../../kit/utils/electronApi";
import { buildSettlementSummary, dayEndParams, denominationNotes, denominationRows } from "../../../../kit/utils/settlementSlip";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import { useGetAllDayEnd } from "../../../../kit/hooks/data/dayEnd";
import useUser from "../../../../kit/hooks/useUser";
import Logo from "../../../../../resources/LOGO.png";

const COMPANY_CIN = "U52100DL2015PTC280291";

const amount = (value) => Number(value || 0).toFixed(2);

const toWords = new ToWords({
    localeCode: "en-IN",
    converterOptions: { currency: true, ignoreDecimal: false, ignoreZeroCurrency: false, doNotAddOnly: false },
});

const formatDate = (value, pattern) => {
    if (!value || Number.isNaN(new Date(value).getTime())) return "-";
    return format(new Date(value), pattern).toUpperCase();
};

const Dashed = () => <div className="my-1.5 border-t border-dashed border-black" />;

const Line = ({ label, value }) => (
    <div className="grid grid-cols-[46%_54%]">
        <span>{label}</span>
        <span>: {value}</span>
    </div>
);

const DenominationDetails = ({ title, denominations }) => {
    const rows = denominationRows(denominations);
    return (
        <div className="mt-1.5">
            <div>{title}</div>
            <table className="mt-1 w-full">
                <thead>
                    <tr>
                        <th className="text-left font-normal">DENO</th>
                        <th className="text-right font-normal">QTY</th>
                        <th className="text-right font-normal">VALUE</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={`${title}-${row.denomination}`}>
                            <td>{amount(row.denomination)}</td>
                            <td className="text-right">{amount(row.count)}</td>
                            <td className="text-right">{amount(row.value)}</td>
                        </tr>
                    ))}
                    {!rows.length && (
                        <tr>
                            <td colSpan={3}>NIL</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const SummaryRow = ({ label, value, tone = "" }) => (
    <div className="flex justify-between gap-3 border-b border-dashed border-slate-200 py-0.5">
        <span className="text-slate-600">{label}</span>
        <span className={`font-semibold ${tone}`}>{value}</span>
    </div>
);

const SummarySection = ({ title, children, className = "" }) => (
    <section className={`overflow-hidden rounded-lg border ${className}`}>
        <h3 className="border-b bg-slate-50 px-2 py-1 text-xs font-bold uppercase text-slate-700">{title}</h3>
        <div className="px-2 py-1 text-xs">{children}</div>
    </section>
);

const diffTone = (value) => (value < 0 ? "text-red-600" : value > 0 ? "text-orange-600" : "text-green-700");

const DayEndSummaryPanel = ({ slip, s }) => {
    const paymentRows = [
        ["Card", s.cardEntered, s.card],
        ["UPI", s.upiEntered, s.upi],
        ["Amex / Sodexo", s.sodexoEntered, s.sodexo],
    ];
    const status =
        s.shortage > 0
            ? { label: `Shortage ${priceFormat(s.shortage)}`, className: "bg-red-100 text-red-700" }
            : s.excess > 0
              ? { label: `Excess ${priceFormat(s.excess)}`, className: "bg-orange-100 text-orange-700" }
              : { label: "Cash Matched", className: "bg-green-100 text-green-700" };

    return (
        <div className="space-y-2 print:hidden">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <div className="text-base font-semibold">Day Ended</div>
                    <div className="text-xs text-slate-600">
                        {slip?.cashierName || "-"} · {formatDate(slip?.date, "dd MMM yyyy")} · Closed at{" "}
                        {formatDate(slip?.endAt, "hh:mm a")}
                    </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
            </div>

            <SummarySection title="Submitted by Cashier" className="border-green-200">
                <SummaryRow
                    label={`Counter Cash (${denominationNotes(slip?.counterDenominations)} notes)`}
                    value={priceFormat(s.counterCash)}
                />
                <SummaryRow
                    label={`Submitted Cash (${denominationNotes(slip?.submittedDenominations)} notes)`}
                    value={priceFormat(s.submittedCash)}
                />
                <SummaryRow label={`Advances (${s.advanceCount})`} value={priceFormat(s.advanceAmount)} />
                <SummaryRow label={`Vouchers (${s.voucherCount})`} value={priceFormat(s.voucherAmount)} />
                {slip?.givenTo && <SummaryRow label="Advance Given To" value={slip.givenTo} />}
                {slip?.voucherRemark && <SummaryRow label="Voucher Remark" value={slip.voucherRemark} />}

                <table className="mt-1.5 w-full">
                    <thead className="text-slate-500">
                        <tr>
                            <th className="text-left font-medium">Mode</th>
                            <th className="text-right font-medium">Entered</th>
                            <th className="text-right font-medium">System</th>
                            <th className="text-right font-medium">Diff</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paymentRows.map(([label, entered, system]) => (
                            <tr key={label} className="border-t border-dashed border-slate-200">
                                <td className="py-0.5 text-slate-600">{label}</td>
                                <td className="text-right font-semibold">{priceFormat(entered)}</td>
                                <td className="text-right">{priceFormat(system)}</td>
                                <td className={`text-right font-semibold ${diffTone(entered - system)}`}>
                                    {priceFormat(entered - system)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </SummarySection>

            <SummarySection title="Day Summary" className="border-sky-200">
                <div className="grid grid-cols-2 gap-x-4">
                    <SummaryRow label="Total Bills" value={s.totalBills} />
                    <SummaryRow label="Sale Return Bills" value={s.returnBills} />
                    <SummaryRow label="Cash Sale" value={priceFormat(s.cashSale)} />
                    <SummaryRow label="Card Sale" value={priceFormat(s.cardSale)} />
                    <SummaryRow label="UPI Sale" value={priceFormat(s.upiSale)} />
                    <SummaryRow label="Amex / Sodexo Sale" value={priceFormat(s.sodexoSale)} />
                    {s.otherSale > 0 && <SummaryRow label="Other" value={priceFormat(s.otherSale)} />}
                    {s.loyalty > 0 && <SummaryRow label="Loyalty" value={priceFormat(s.loyalty)} />}
                    {s.coupon > 0 && <SummaryRow label="Coupon" value={priceFormat(s.coupon)} />}
                    {s.srnAdjustment > 0 && <SummaryRow label="SRN Adjusted" value={priceFormat(s.srnAdjustment)} />}
                    <SummaryRow label="Bill Amount" value={priceFormat(s.billAmount)} />
                    <SummaryRow label="Sale Return" value={`-${priceFormat(s.saleReturn)}`} />
                    <SummaryRow label="Total Amount" value={priceFormat(s.totalAmount)} />
                    <SummaryRow label="Total Collection" value={priceFormat(s.totalCollection)} />
                </div>
            </SummarySection>

            <SummarySection title="Cash Check" className="border-orange-200">
                <div className="grid grid-cols-2 gap-x-4">
                    <SummaryRow label="Opening Cash" value={priceFormat(s.openingCash)} />
                    <SummaryRow label="+ Cash Sale" value={priceFormat(s.cashSale)} />
                    {s.cashRefund > 0 && <SummaryRow label="− Cash Refund" value={priceFormat(s.cashRefund)} />}
                    <SummaryRow label="− Advance + Voucher" value={priceFormat(s.advanceAmount + s.voucherAmount)} />
                    <SummaryRow label="Expected Cash" value={priceFormat(s.expectedCash)} />
                    <SummaryRow label="Counter + Submitted" value={priceFormat(s.actualCash)} />
                    <SummaryRow
                        label={s.shortage > 0 ? "Shortage" : "Excess"}
                        value={priceFormat(s.shortage || s.excess)}
                        tone={s.shortage > 0 ? "text-red-600" : s.excess > 0 ? "text-orange-600" : ""}
                    />
                </div>
            </SummarySection>
        </div>
    );
};

export default function SettlementSlipModal({ isOpen, onClose, slip, store }) {
    const userData = useUser();
    const [isPrinting, setIsPrinting] = useState(false);
    const { dayEndList, isDayEndListLoading } = useGetAllDayEnd(
        dayEndParams({ date: slip?.date, cashierId: slip?.userId }),
        Boolean(isOpen && slip?.date)
    );
    const dayEnd = dayEndList?.success && dayEndList.data ? dayEndList.data : slip?.dayEnd;
    const s = buildSettlementSummary({ dayEnd: dayEnd || {}, ...(slip?.inputs || {}) });

    const addressLines = [store?.address, [store?.city, store?.pincode].filter(Boolean).join(" - ")].filter(Boolean);
    const gstNumber = slip?.gstNumber || userData?.gstNumber;
    const userName = slip?.userName || slip?.cashierName || "-";

    const handlePrint = async () => {
        if (isPrinting || isDayEndListLoading) return;
        setIsPrinting(true);
        try {
            await printToDefaultPrinter();
        } catch (error) {
            toast.error(error?.message || "Unable to print settlement slip.");
        } finally {
            setIsPrinting(false);
        }
    };

    if (isOpen && isDayEndListLoading) {
        return (
            <Backdrop
                open
                sx={{ zIndex: (theme) => theme.zIndex.modal + 1, color: "#fff", flexDirection: "column", gap: 1.5 }}
            >
                <CircularProgress color="inherit" />
                <span className="text-sm font-semibold">Preparing day summary...</span>
            </Backdrop>
        );
    }

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth={false}
            scroll="body"
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePrint();
                }
            }}
            slotProps={{ paper: { sx: { width: 940, maxWidth: "96vw" } } }}
        >
            <DialogContent className="p-0!">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-3 print:block print:p-0">
                    <DayEndSummaryPanel slip={slip} s={s} />
                    <div className="max-h-[82vh] overflow-y-auto rounded-lg border border-slate-200 print:max-h-none print:overflow-visible print:border-0">
                        <div
                            id="settlement-slip-section"
                            className="mx-auto w-[76mm] bg-white px-2 py-2 font-mono text-[11px] leading-[1.35] uppercase text-black"
                            style={{ page: "day-bill" }}
                        >
                            <div className="flex flex-col items-center text-center">
                                <img src={Logo} alt="logo" className="w-24" />
                            </div>
                            <Dashed />
                            <div className="text-center">
                                {addressLines.map((line) => (
                                    <div key={line}>{line}</div>
                                ))}
                                {store?.storeName && <div>STORE NAME - {store.storeName}</div>}
                                {store?.managerPhone && <div>PH NO - {store.managerPhone}</div>}
                                {gstNumber && <div>GSTN : {gstNumber}</div>}
                                <div>CIN : {COMPANY_CIN}</div>
                                <div className="mt-1.5">SETTLEMENT SLIP</div>
                            </div>

                            <div className="mt-1.5">
                                <Line label="MOBILE NO" value={slip?.mobile || "-"} />
                                <Line label="NAME" value={slip?.cashierName || "-"} />
                                <Line label="USER NAME" value={userName} />
                                <Line label="S.DATE" value={formatDate(slip?.date, "dd-MMM-yyyy")} />
                                <Line label="TOTAL BILLS" value={s.totalBills} />
                            </div>
                            <Dashed />

                            <Line label="CASH" value={amount(s.cashSale)} />
                            <Line label="C CARD AMOUNT" value={amount(s.cardSale)} />
                            {/* <Line label="C CARD AMT ENT" value={amount(s.cardEntered)} /> */}
                            <Line label="UPI AMOUNT" value={amount(s.upiSale)} />
                            {/* <Line label="UPI AMT ENT" value={amount(s.upiEntered)} /> */}
                            <Line label="AMEX/SODEXO AMT" value={amount(s.sodexoSale)} />
                            {/* <Line label="AMEX/SODEXO ENT" value={amount(s.sodexoEntered)} /> */}
                            {s.otherSale > 0 && <Line label="OTHER AMOUNT" value={amount(s.otherSale)} />}
                            {s.loyalty > 0 && <Line label="LOYALTY" value={amount(s.loyalty)} />}
                            {s.coupon > 0 && <Line label="COUPON" value={amount(s.coupon)} />}
                            {s.srnAdjustment > 0 && <Line label="SRN ADJUSTED" value={amount(s.srnAdjustment)} />}
                            <Line label="BILL AMOUNT" value={amount(s.billAmount)} />
                            <Line label="SALE RETURN ADJ" value={s.saleReturn > 0 ? `-${amount(s.saleReturn)}` : amount(0)} />

                            <div className="my-2 text-center text-[13px] font-bold">
                                TOTAL AMOUNT : {amount(s.totalAmount)}
                            </div>

                            <Line label="SALE RETURN TOBE" value={amount(s.saleReturn)} />
                            <Line label="TOTAL BILLS" value={s.totalBills} />
                            <Dashed />
                            <Line label="OPENING CASH" value={amount(s.openingCash)} />
                            <Line label="+ CASH SALE" value={amount(s.cashSale)} />
                            {s.cashRefund > 0 && <Line label="- CASH REFUND" value={amount(s.cashRefund)} />}
                            <Line label={`- ADVANCES (${s.advanceCount})`} value={amount(s.advanceAmount)} />
                            {s.voucherAmount > 0 && <Line label={`- VOUCHERS (${s.voucherCount})`} value={amount(s.voucherAmount)} />}
                            <Line label="EXPECTED CASH" value={amount(s.expectedCash)} />
                            <Dashed />
                            <Line label="COUNTER SUMMARY" value={amount(s.counterCash)} />
                            <Line label="SUBMITTED SUMMARY" value={amount(s.submittedCash)} />
                            <Line label="TOTAL CASH" value={amount(s.actualCash)} />
                            <div className="mt-1 text-[13px] font-bold">
                                <Line label="SHORTAGE" value={amount(s.shortage)} />
                                <Line label="EXCESS" value={amount(s.excess)} />
                            </div>
                            <Line label="CARD ISSUED" value={0} />
                            <Line label="CARD RENEWED" value={0} />
                            {slip?.givenTo && <Line label="ADV GIVEN TO" value={slip.givenTo} />}
                            {slip?.voucherRemark && <Line label="VOUCHER RMK" value={slip.voucherRemark} />}
                            <Dashed />

                            <div>REMARKS :</div>
                            <div>{toWords.convert(Number(s.totalAmount || 0))}</div>
                            <Dashed />

                            <DenominationDetails
                                title="SUBMITTED SUMMARY DETAILS"
                                denominations={slip?.submittedDenominations}
                            />
                            <DenominationDetails
                                title="COUNTER SUMMARY DETAILS"
                                denominations={slip?.counterDenominations}
                            />

                            <div className="mt-2">
                                {slip?.counterId ? `COUNTER-${slip.counterId} - ` : ""}
                                {userName}
                            </div>
                            <div>DATETIME {formatDate(slip?.endAt, "dd-MMM-yyyy HH:mm:ss")}</div>
                        </div>
                    </div>

                    <div className="col-span-2 flex justify-end gap-3 border-t pt-3 print:hidden">
                        <KitButton className="w-auto" variant="outlined" size="small" onClick={onClose}>
                            Close
                        </KitButton>
                        <KitButton
                            className="w-auto"
                            variant="contained"
                            size="small"
                            isLoading={isPrinting}
                            disabled={isDayEndListLoading}
                            onClick={handlePrint}
                        >
                            Print Summary (Enter)
                        </KitButton>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
