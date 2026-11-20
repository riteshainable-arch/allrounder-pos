import { format } from "date-fns";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import { getPersonDisplayName } from "../../../../kit/utils/invoiceBill";

export default function AdvanceSlipPrintLayout({ slip = {}, userData = null }) {
    const cashier = slip.cashier || userData || {};
    const manager = slip.manager || {};
    const isPending = slip.status === "pending" || !slip.status;

    return (
        <div
            id="advance-slip-section"
            className="w-[80mm] bg-white p-3 text-xs text-black"
        >
            <div className="text-center text-lg font-bold">Advance Slip</div>
            <hr />
            <div className="mt-2 space-y-1">
                <div>Slip No : {slip.slipNumber || "-"}</div>
                <div>Name : {getPersonDisplayName(cashier)}</div>
                <div>Time of Day : {slip.timeOfDay || format(new Date(), "hh:mm aa")}</div>
                <div>Given to : {getPersonDisplayName(manager)}</div>
                <div>Date : {slip.slipDate || format(new Date(), "yyyy-MM-dd")}</div>
                {slip.status && (
                    <div>Status : {String(slip.status).toUpperCase()}</div>
                )}
            </div>
            <hr className="my-2" />
            <div className="text-center">
                <div className="font-semibold">Amount</div>
                <div className="text-2xl font-bold">{priceFormat(slip.amount || 0)}</div>
            </div>
            {slip.cashierRemark && (
                <div className="mt-2 text-[11px]">Remark: {slip.cashierRemark}</div>
            )}
            {slip.managerRemark && (
                <div className="mt-1 text-[11px]">Manager: {slip.managerRemark}</div>
            )}
            {isPending && (
                <div className="mt-2 text-[11px] text-center italic">
                    Pending manager approval
                </div>
            )}
            <div className="mt-10 flex justify-between text-center">
                <div className="w-[45%]">
                    <div className="mb-1 border-t border-black" />
                    <div className="text-[11px] font-medium">Sign of Manager</div>
                </div>
                <div className="w-[45%]">
                    <div className="mb-1 border-t border-black" />
                    <div className="text-[11px] font-medium">Sign of Cashier</div>
                </div>
            </div>
        </div>
    );
}
