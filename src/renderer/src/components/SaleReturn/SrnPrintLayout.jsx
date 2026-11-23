import { format } from "date-fns";
import PropTypes from "prop-types";
import QRCode from "react-qr-code";
import { ToWords } from "to-words";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import {
    getInvoiceItemMrp,
    getInvoiceItemName,
    getInvoiceItemQty,
    getInvoiceItemRate,
    getPersonDisplayName,
} from "../../../../kit/utils/invoiceBill";
import { getPaymentModeLabel } from "../../../../kit/utils/billPayments";
import Logo from "../../../../../resources/LOGO.png";

const getLineRefund = (item) =>
    Number(item.lineRefund ?? item.line_refund ?? getInvoiceItemQty(item) * getInvoiceItemRate(item));

const amountToWords = new ToWords({
    localeCode: "en-IN",
    converterOptions: {
        currency: true,
        ignoreDecimal: false,
        ignoreZeroCurrency: false,
        doNotAddOnly: false,
    },
});

export default function SrnPrintLayout({ payload = {} }) {
    const srn = payload.srn || payload || {};
    const items = payload.items || srn.items || [];
    const originalBill = payload.originalBill || {};
    const refundPayment = payload.refundPayment || payload.refundPayments?.[0] || {};
    const refundMode = srn.refundMode || refundPayment.paymentMode || "cash";
    const totalQty = items.reduce((total, item) => total + getInvoiceItemQty(item), 0);
    const totalMrp = items.reduce((total, item) => total + getInvoiceItemQty(item) * getInvoiceItemMrp(item), 0);
    const totalReturnAmount = items.reduce((total, item) => total + getLineRefund(item), 0);
    const refundAmount = Number(srn.refundAmount ?? refundPayment.amount ?? totalReturnAmount);
    const returnDate = srn.approvedAt || srn.initiatedAt || srn.returnDate;
    const customer =
        srn.customer ||
        originalBill.customer ||
        (srn.customerId ? { phone: srn.customerId } : null);
    const cashier = srn.cashier || srn.initiatedBy;
    const manager = srn.approvedBy || srn.manager;
    const srnNumber = srn.srnNumber || srn.returnInvoiceNo || "-";

    return (
        <div
            id="srn-slip-section"
            className="mx-auto w-[72mm] bg-white text-[13px] text-third-800"
            style={{ page: "kot-thermal" }}
        >
            <div className="border-b border-black">
                <div className="flex flex-col items-center gap-1">
                    <img src={Logo} alt="logo" className="w-28" />
                    <div className="w-full border-b border-black pb-0.5 text-center text-[9px] font-bold">
                        INDIA&apos;S TRUSTED MULTI BRAND GROCERY CHAIN STORES
                    </div>
                </div>

                <div className="flex flex-col items-center gap-0.5 border-b border-black">
                    <div className="text-[10px] font-normal">GROUND AND FIRST FLOOR, PLOT NO. 4 AND 4A</div>
                    <div className="text-[10px] font-normal">OUT OF KHASRA NO 8/6, SHYAM VIHAR, PHASE II</div>
                    <div className="text-[10px] font-normal">A-BLOCK, Najafgarh, New Delhi, Delhi-110043</div>
                    <div className="w-full text-[11px] font-bold">Customercare No : 9289890661</div>
                    <div className="w-full text-[10px] font-bold">customercare.rashankidukan.india@gmail.com</div>
                    <div className="text-xs font-bold">GSTIN : 07AAPCR5365K1ZP</div>
                </div>
                <div className="border-b border-black text-center text-sm font-bold">SALE RETURN NOTE</div>

                <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5 text-[10px]">
                    <span>SRN No/Date :</span>
                    <div className="flex flex-wrap">
                        <span className="break-all font-medium">{srnNumber} /</span>
                        <span className="whitespace-nowrap">
                            {returnDate ? format(new Date(returnDate), "dd-MM-yyyy") : "-"}
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5 text-[10px]">
                    <span>Original Invoice :</span>
                    <span className="break-all font-medium">
                        {srn.originalInvoiceNo || originalBill.invoiceNo || "-"}
                    </span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5 text-[10px]">
                    <span>Time :</span>
                    <span>{returnDate ? format(new Date(returnDate), "hh:mm a") : "-"}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5 text-[10px]">
                    <span>User Name :</span>
                    <span>{getPersonDisplayName(cashier)}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5 text-[10px]">
                    <span>Customer Name :</span>
                    <span className="font-bold">{getPersonDisplayName(customer)}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5 text-[10px]">
                    <span>Cust Mobile No :</span>
                    <span className="font-bold">{customer?.phone || srn.customerId || "-"}</span>
                </div>
            </div>

            <div className="border-b border-black px-2 py-0.5 text-[10px]">
                <div className="grid grid-cols-[24px_46px_minmax(0,1fr)] items-center gap-1">
                    <div>S.no</div>
                    <div>Qty.</div>
                    <div>Product</div>
                </div>

                <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-1">
                    <div />
                    <div className="grid grid-cols-3 items-center gap-1">
                        <div>MRP</div>
                        <div className="text-end">Price</div>
                        <div className="text-end">Amt.</div>
                    </div>
                </div>
            </div>

            {items.length ? (
                items.map((item, index) => (
                    <div
                        key={item.id ?? index}
                        className="border-b border-dashed border-black px-2 py-1 text-[10px] font-bold"
                    >
                        <div className="grid grid-cols-[24px_46px_minmax(0,1fr)] items-center gap-1">
                            <span>{index + 1}</span>
                            <span>{getInvoiceItemQty(item)} Pcs</span>
                            <span>{getInvoiceItemName(item)}</span>
                        </div>
                        <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-1">
                            <div />
                            <div className="grid grid-cols-3 items-center gap-1">
                                <div>{priceFormat(getInvoiceItemMrp(item))}</div>
                                <div className="text-end">{priceFormat(getInvoiceItemRate(item))}</div>
                                <div className="text-end">{priceFormat(getLineRefund(item))}</div>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="border-b border-black px-2 py-1 text-[10px]">No returned items</div>
            )}

            <div className="w-full px-2 py-1 text-[11px] font-bold">
                <div className="flex justify-between gap-2 py-0.5">
                    <span>Total Return Amount</span>
                    <span>{priceFormat(totalReturnAmount)}</span>
                </div>
                <div className="flex justify-between gap-2 border-t border-black py-0.5 text-sm">
                    <span>Net Refund Amount</span>
                    <span>{priceFormat(refundAmount)}</span>
                </div>
            </div>

            <div className="border-y border-black text-[10px] font-bold leading-[1.3]">
                <div className="grid grid-cols-3 gap-1 border-b border-black px-2 py-1 text-center">
                    <span>MRP TOTAL</span>
                    <span>Price Total</span>
                    <span>Amt. Total</span>
                </div>
                <div className="grid grid-cols-3 gap-1 px-2 py-1 text-center">
                    <span>{priceFormat(totalMrp)}</span>
                    <span>
                        {priceFormat(
                            items.reduce((total, item) => total + getInvoiceItemQty(item) * getInvoiceItemRate(item), 0)
                        )}
                    </span>
                    <span>{priceFormat(totalReturnAmount)}</span>
                </div>
                <div className="grid grid-cols-2 border-t border-black text-center">
                    <div className="border-r border-black px-1 py-1">
                        <div>Total Items</div>
                        <div className="text-sm">{items.length}</div>
                    </div>
                    <div className="px-1 py-1">
                        <div>Total Qty</div>
                        <div className="text-sm">{totalQty}</div>
                    </div>
                </div>
                <div className="border-t border-black px-1 py-1 text-[10px]">
                    {amountToWords.convert(Math.round(refundAmount))}
                </div>
            </div>

            <div className="border-b border-black py-2 text-[11px] font-bold leading-[1.35]">
                <div className="mx-2 rounded border-2 border-black py-1 text-center text-base font-extrabold">
                    TOTAL REFUND: {priceFormat(refundAmount)}
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5">
                    <span>Refund Mode</span>
                    <span>: {getPaymentModeLabel(refundMode)}</span>
                </div>
                {srn.notes && (
                    <div className="grid grid-cols-[100px_1fr] gap-1 py-0.5">
                        <span>Notes</span>
                        <span className="wrap-break-word">: {srn.notes}</span>
                    </div>
                )}
            </div>

            <div className="my-2 flex flex-col gap-0.5">
                <div className="text-sm font-bold">THANKS FOR SHOPPING WITH US</div>
                <div className="text-[11px] font-bold">SALE RETURN NOTE - KEEP FOR YOUR RECORDS</div>
                <div className="text-[11px] font-bold">*T&C APPLY</div>
                <div className="text-[11px] font-bold">SCAN FOR RETURN DETAILS</div>
                <div className="flex w-full items-center justify-center">
                    <QRCode value={srnNumber === "-" ? "" : srnNumber} size={90} />
                </div>
            </div>

            <div className="mt-8 flex justify-between text-center">
                <div className="w-[45%]">
                    <div className="mb-1 border-t border-black" />
                    <div className="font-medium">Sign of Manager</div>
                </div>
                <div className="w-[45%]">
                    <div className="mb-1 border-t border-black" />
                    <div className="font-medium">Sign of Cashier</div>
                </div>
            </div>
        </div>
    );
}

SrnPrintLayout.propTypes = {
    payload: PropTypes.object,
};
