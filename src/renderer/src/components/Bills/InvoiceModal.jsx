import { Dialog, DialogContent, Typography } from "@mui/material"
import QRCode from "react-qr-code"
import { ToWords } from 'to-words'
import { priceFormat } from "../../../../kit/utils/priceFormat"
import { formatBillPaymentsSummary, normalizeBillPayments, getPaymentModeLabel } from "../../../../kit/utils/billPayments"
import KitButton from "../../../../kit/components/KitButton/KitButton"
import Logo from "../../../../../resources/allrounder_logo.png";
import Signature from "../../../../../resources/Zuganov-sign.png";
import { format } from "date-fns"
import { useMemo } from "react"
import { useInvoiceBillDetail } from "../../../../kit/hooks/data/invoice"
import KitLoader from "../../../../kit/components/KitLoader/KitLoader"
import { printToDefaultPrinter } from "../../../../kit/utils/electronApi"
import { toast } from "react-toastify"

const getItemMrp = (item) => Number(item?.mrp ?? item?.latestMRP ?? 0);

const InvoiceModal = ({ isOpen, onClose, selectedInvoiceList }) => {
    const { invoiceBillDetail, isInvoiceBillDetailLoading, invoiceBillDetailError } = useInvoiceBillDetail(selectedInvoiceList?.invoiceNo, Boolean(selectedInvoiceList?.invoiceNo));
    const invoiceData = invoiceBillDetail?.data
    const invoiceBill = invoiceData?.bill
    const invoiceItems = invoiceData?.items

    const toWords = new ToWords({
        localeCode: 'en-IN',
        converterOptions: {
            currency: true,
            ignoreDecimal: false,
            ignoreZeroCurrency: false,
            doNotAddOnly: false,
        },
    });

    const handlePrint = async () => {
        try {
            await printToDefaultPrinter()
        } catch (error) {
            toast.error(error?.message || "Unable to print invoice.")
        }
    }

    const sortedSaleItems = useMemo(() => {
        const items = invoiceItems ?? [];
        return [...items].sort((left, right) => getItemMrp(right) - getItemMrp(left));
    }, [invoiceItems]);

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    handlePrint();
                }

                if (e.key === "Escape") {
                    e.preventDefault();
                    onClose();
                }
            }}
            maxWidth={false}
            PaperProps={{
                sx: {
                    width: 780,
                    maxWidth: '100%',
                    '@media (max-width: 600px)': {
                        width: 'calc(100% - 20px)',
                        margin: '10px auto !important',
                        left: 0,
                        right: 0,
                    },
                    '@media print': {
                        width: '100%',
                        maxWidth: '100%',
                        margin: 0,
                        boxShadow: 'none',
                        overflow: 'visible'
                    }
                }
            }}
            scroll="body"
            disableScrollLock
        >
            <DialogContent
                sx={{
                    p: 0,
                    overflow: 'visible',
                    '@media print': {
                        overflow: 'visible'
                    }
                }}
            >
                <div className="p-4! print:p-0!">
                    {isInvoiceBillDetailLoading ? (
                        <div className="h-80 flex justify-center">
                            <KitLoader logo={false} isLoading={true} />
                        </div>
                    ) : invoiceBillDetailError ? (
                        <div className="items-center h-[70vh] flex justify-center">
                            <Typography variant="h6" color="error">Something went wrong!</Typography>
                        </div>
                    ) : (
                        <div
                            id="invoice-section"
                            className="mx-auto w-full max-w-[780px] text-[13px] text-third print:w-full print:max-w-none print:text-[11px] print:leading-tight"
                        >
                            <div className="flex flex-col justify-between items-start border p-2 md:flex-row md:items-center print:flex-row print:items-center">
                                <div className="flex items-end gap-2">
                                    <img src={Logo} alt='logo' className="w-28" />
                                    <b>GST Invoice</b>
                                </div>
                                <div className="flex flex-col gap-1 text-start md:text-right">
                                    <div>Invoice Number : {invoiceBill?.invoiceNo}</div>
                                    {invoiceBill?.busyNumber && <div>BUSY Inv No : {invoiceBill.busyNumber}</div>}
                                    <div>Invoice Date :
                                        {invoiceBill?.createdAt ? format(new Date(invoiceBill.createdAt), 'dd-MM-yy, hh:mm a') : '-'}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 border border-t-0 md:grid-cols-[70%_30%] print:grid-cols-[70%_30%]">
                                <div className="p-2 border-r">
                                    <b>Sold by / Seller</b>
                                    <div>{invoiceBill?.branchId?.branchCode} - {invoiceBill?.branchId?.branchName}</div>
                                    <div>{invoiceBill?.branchId?.area}</div>
                                    <div>{invoiceBill?.branchId?.fullAddress}</div>

                                    <div className="mt-2">
                                        <b>GSTIN : {invoiceBill?.gstNumber}</b>
                                    </div>

                                    <div className="mt-2 flex flex-col gap-1">
                                        <div><span className="font-bold">FASSAI License Number :</span> 07AAGCB2847R1Z3</div>
                                        <div><span className="font-bold">CIN :</span> U52100DL2015PTC280291</div>
                                        <div><span className="font-bold">PAN :</span> U52100DL2015PTC280291</div>
                                    </div>

                                    <div className="mt-3">
                                        <b>Invoice to</b>
                                        <div>Name : {invoiceBill?.customer?.firstName}</div>
                                        <div>Mobile : {invoiceBill?.customer?.phone}</div>
                                        <div>
                                            Flat No/Floor No :
                                            {invoiceBill?.userLocationId?.flatNumber}
                                            {invoiceBill?.userLocationId?.floorNumber
                                                ? ` / ${invoiceBill?.userLocationId?.floorNumber}`
                                                : ""}
                                        </div>
                                        <div>Lankmark : {invoiceBill?.userLocationId?.howToReach}</div>
                                        <div>Area : {invoiceBill?.userLocationId?.area}</div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center p-2 print:gap-1 print:p-1">
                                    <QRCode value={invoiceBill?.orderNo || ""} size={90} />
                                    <div className="mt-1">Order No : {invoiceBill?.orderNo}</div>
                                </div>
                            </div>

                            <div className="w-full overflow-x-auto print:overflow-visible">
                                <table className="min-w-[700px] w-full border border-t-0! text-[13px] print:min-w-0 print:text-[11px]">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="border border-t-0! px-1 text-start w-[8%]">Sr no.</th>
                                            <th className="border border-t-0! px-1 text-start w-[12%]">Qty</th>
                                            <th className="border border-t-0! px-1 text-start w-[40%]">Item</th>
                                            <th className="border border-t-0! px-1 text-start w-[12%]">Mrp</th>
                                            <th className="border border-t-0! px-1 text-start w-[14%]">Amt(rs)</th>
                                            <th className="border border-t-0! px-1 text-start w-[14%]">Total(rs)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedSaleItems?.map((item, index) => (
                                            <tr key={index} className="border-b align-top">
                                                <td className="border px-1 w-[8%]">{index + 1}</td>
                                                <td className="border px-1 w-[12%]">{item.qty} pcs</td>
                                                <td className="border px-1 w-[40%]">
                                                    <div>{item.item_name}</div>
                                                    {item?.offerProduct && (
                                                        <div className="border-t mt-1 pt-1 text-[12px]">
                                                            OFFER ITEM : {item.offerProduct?.productName} - QTY : {item.offerProduct?.quantity}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="border px-1 w-[12%]">
                                                    <div>{priceFormat(item?.mrp || item?.latestMRP)}</div>
                                                    {item?.offerProduct && (
                                                        <div className="border-t mt-1 pt-1">
                                                            {priceFormat(item.offerProduct?.mrpPrice)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="border px-1 w-[14%]">
                                                    <div>{priceFormat(item?.sale_price)}</div>
                                                    {item.offerProduct && (
                                                        <div className="border-t mt-1 pt-1">Free</div>
                                                    )}
                                                </td>
                                                <td className="border px-1 w-[14%]">{priceFormat(Number(item.qty) * Number(item.sale_price))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-col gap-1 border border-t-0 p-2 text-[13px] print:gap-0.5 print:p-1">
                                <div>Total no. of items - {invoiceBill?.totalItems}</div>
                                <div>Total no. of pieces - {invoiceBill?.totalQty}</div>
                                <div>Sub Total - {priceFormat(invoiceBill?.totalAmount)}</div>
                                <div>Delivery Charge - {priceFormat(invoiceBill?.deliveryCharge)}</div>
                                <div>Discount - {priceFormat(invoiceBill?.totalDiscount)}</div>
                                <b>Total Payable amount - {priceFormat(invoiceBill?.payAmount)}</b>
                                <div>Total saving - {priceFormat(invoiceBill?.savingAmount)}</div>
                                {normalizeBillPayments(invoiceBill).length > 0 && (
                                    <div className="mt-2 border-t pt-2">
                                        <b>Payment Details</b>
                                        {normalizeBillPayments(invoiceBill).map((payment, index) => (
                                            <div key={`${payment.paymentMode}-${index}`}>
                                                {getPaymentModeLabel(payment.paymentMode)} - {priceFormat(payment.amount)}
                                            </div>
                                        ))}
                                        <div className="mt-1">{formatBillPaymentsSummary(invoiceBill)}</div>
                                        {Number(invoiceBill?.balanceToReturn || 0) > 0 && (
                                            <div>Balance Returned - {priceFormat(invoiceBill.balanceToReturn)}</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="border border-t-0 p-2 text-[13px] print:p-1">
                                <b>Amount in words :</b>{" "}
                                {toWords?.convert(invoiceBill?.payAmount || 0)}
                            </div>

                            <div className="flex flex-col justify-between items-start gap-3 border border-t-0 p-2 text-[13px] md:flex-row md:items-end print:flex-row print:items-end print:gap-2 print:p-1">
                                <div className="flex flex-col gap-1 print:gap-0.5">
                                    <div className="text-base font-bold print:text-[12px]">Rasan ki dukan</div>
                                    <div>khasra NO.576, abhimanyu complex, sultanpuri road, delhi - 110086</div>
                                    <div><span className="font-bold">GSTIN :</span> {invoiceBill?.gstNumber}</div>
                                    <div><span className="font-bold">FASSAI License Number :</span> U52100DL2015PTC280291</div>
                                    <div><span className="font-bold">CIN :</span> U52100DL2015PTC280291</div>
                                    <div><span className="font-bold">PAN :</span> U52100DL2015PTC280291</div>
                                </div>
                                <div className="text-center">
                                    <img src={Signature} alt="signature" className="w-24 print:w-16" />
                                    <div>Authorised Signatory</div>
                                </div>
                            </div>

                            <div className="border border-t-0 p-2 text-[13px]">
                                <b>Terms & Conditions</b>
                                <div>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos quis enim repellat incidunt cumque dolores odio soluta dicta, similique nihil ex praesentium voluptate itaque quibusdam facilis esse id a quae laudantium fugiat provident rem aspernatur, porro voluptatem? Dolorum quia qui natus repudiandae amet sunt ab, nam aperiam, hic voluptatum distinctio.</div>
                            </div>
                        </div>
                    )}

                    <div className="pt-6 flex justify-end gap-3 print:hidden">
                        <KitButton
                            className='w-auto h-fit'
                            variant="outlined"
                            size='small'
                            onClick={onClose}
                        >
                            Cancel
                        </KitButton>
                        <KitButton
                            variant='contained'
                            className='w-auto h-fit'
                            size='small'
                            startIcon={<i className='tabler-printer' />}
                            onClick={handlePrint}
                        >
                            Print Invoice
                        </KitButton>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    )
}

export default InvoiceModal
