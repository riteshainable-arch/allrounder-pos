import { Dialog, DialogContent } from "@mui/material";
import { format } from "date-fns";
import { useEffect, useRef } from "react";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import { printToDefaultPrinter } from "../../../../kit/utils/electronApi";
import { toast } from "react-toastify";
import Logo from "../../../../../resources/LOGO.png";

export default function DayBillPrintModal({ isOpen, onClose, payload }) {
    const autoPrintStarted = useRef(false);
    const onCloseRef = useRef(onClose);
    const start = payload?.start || {};
    const printDate = start.date || payload?.date;

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!isOpen) {
            autoPrintStarted.current = false;
            return undefined;
        }

        if (!payload || autoPrintStarted.current) return undefined;

        autoPrintStarted.current = true;
        let printRequested = false;
        const timer = window.setTimeout(async () => {
            printRequested = true;
            try {
                await printToDefaultPrinter();
            } catch (error) {
                toast.error(error?.message || "Unable to print day bill.");
            } finally {
                onCloseRef.current?.();
            }
        }, 100);

        return () => {
            window.clearTimeout(timer);
            if (!printRequested) autoPrintStarted.current = false;
        };
    }, [isOpen, payload]);

    return (
        <Dialog
            open={isOpen}
            aria-hidden="true"
            sx={{ visibility: "hidden" }}
            onClose={onClose}
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
                <div className="flex flex-col max-h-212.5 print:max-h-none">
                    <div className="flex-1 overflow-y-auto custom-scroll p-4 print:overflow-visible print:p-0">
                        <div
                            id="day-bill-slip-section"
                            className="w-[72mm] bg-white px-1 py-2 text-xs text-black"
                            style={{ page: "day-bill" }}
                        >
                            <div className="flex flex-col items-center">
                                <img src={Logo} alt="logo" className="w-28" />
                                <div className="text-lg font-bold">DAY START BILL</div>
                            </div>
                            <hr className="my-2" />
                            <div className="space-y-1">
                                <div>
                                    Date :{" "}
                                    {printDate && !Number.isNaN(new Date(printDate).getTime())
                                        ? format(new Date(printDate), "yyyy-MM-dd HH:mm")
                                        : payload?.date || "-"}
                                </div>
                                <div>Cashier : {payload?.cashier || "-"}</div>
                                <div>Cashier ID : {payload?.userId || "-"}</div>
                            </div>
                            <hr className="my-2" />
                            <div className="font-semibold mb-1">Cash Denominations</div>
                            {(start.denominations || []).map((item, index) => (
                                <div key={`${item.denomination}-${index}`} className="flex justify-between gap-2">
                                    <span>
                                        {priceFormat(item.denomination)} × {Number(item.count || 0)}
                                    </span>
                                    <span>{priceFormat(Number(item.denomination || 0) * Number(item.count || 0))}</span>
                                </div>
                            ))}
                            <hr className="my-2" />
                            <div className="flex justify-between font-semibold">
                                <span>Opening Cash ({Number(start.totalNotes || 0)} notes)</span>
                                <span>{priceFormat(start.totalCash || 0)}</span>
                            </div>
                            <div className="mt-1 flex justify-between">
                                <span>Advance ({Number(start.advanceCount || 0)})</span>
                                <span>{priceFormat(start.advanceAmount || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Voucher ({Number(start.voucherCount || 0)})</span>
                                <span>{priceFormat(start.voucherAmount || 0)}</span>
                            </div>
                            {start.givenTo && <div className="mt-1">Advance given to: {start.givenTo}</div>}
                            {start.voucherRemark && <div className="mt-1">Voucher remark: {start.voucherRemark}</div>}
                            <hr className="my-2" />
                            <div className="flex justify-between text-sm font-bold">
                                <span>TOTAL AMOUNT</span>
                                <span>{priceFormat(start.totalCash || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
