import { format } from "date-fns";
import KitModal from "../../../../kit/components/KitModal";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import { useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { priceFormat } from "../../../../kit/utils/priceFormat";

const VoucherSlipModal = ({ isOpen, onClose, userData, amount, voucherRemark, setVoucherRemark }) => {
    const printRef = useRef(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: "Voucher Slip",
    });

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                return;
            }

            if (e.key === "Enter") {
                const target = e.target;

                if (
                    target instanceof HTMLInputElement ||
                    target instanceof HTMLTextAreaElement ||
                    target.isContentEditable
                ) {
                    return;
                }

                e.preventDefault();
                e.stopPropagation();
                handlePrint();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, handlePrint]);

    return (
        <>
            <KitModal
                maxWidth="sm"
                isOpen={isOpen}
                onClose={onClose}
                title={
                    <div className="text-base font-semibold">
                        Voucher Slip
                    </div>
                }
                titleClass="border-b p-3!"
            >
                <div className="p-4 pb-0">
                    <div className="grid grid-cols-2 gap-y-3 text-sm items-center">
                        <div className="font-semibold">User Id</div>
                        <div>{userData?.userId}</div>
                        <div className="font-semibold">Name</div>
                        <div>{userData?.firstName} {userData?.lastName}</div>
                        <div className="font-semibold">Date and Time</div>
                        <div>{format(new Date(), 'dd-MM-yy, hh:mm a')}</div>
                        <div className="font-semibold">Given to</div>
                        <KitTextField
                            size="small"
                            placeholderFontSize={14}
                            placeholder="Enter remark"
                            value={voucherRemark}
                            onChange={(e) => setVoucherRemark(e.target.value)}
                        />
                        <div className="font-semibold">Amount</div>
                        <div>{amount || 0}</div>
                        <div className="font-semibold">Remarks</div>
                        <div>Test</div>
                    </div>
                </div>

                <div className="p-4 flex justify-end gap-3">
                    <KitButton
                        className='w-auto'
                        variant="outlined"
                        size='small'
                        onClick={onClose}
                    >
                        Cancel
                    </KitButton>
                    <KitButton
                        variant="contained"
                        className="w-auto"
                        size='small'
                        onClick={handlePrint}
                    >
                        Print
                    </KitButton>
                </div>
            </KitModal>

            <div className="fixed -left-[10000px] top-0 -z-10">
                <div
                    ref={printRef}
                    id="voucher-slip-section"
                    className="w-[80mm] bg-white p-3 text-xs text-black"
                >
                    <div className="text-center text-lg font-bold">VOUCHER SLIP</div>
                    <hr className="my-2" />
                    <div>Voucher No : VCH000001</div>
                    <div>Date : {format(new Date(), "dd MMM yyyy")}</div>
                    <div>Time : {format(new Date(), "hh:mm aa")}</div>
                    <hr className="my-2" />
                    <div>User ID : {userData?.userId}</div>
                    <div>Name : {userData?.firstName} {userData?.lastName}</div>
                    <div>Remark : {voucherRemark}</div>
                    <hr className="my-2" />
                    <div className="text-center">
                        <div className="font-semibold">Voucher Amount</div>
                        <div className="text-2xl font-bold">{priceFormat(amount)}</div>
                    </div>
                    <hr className="my-3" />
                    <div className="mt-10 flex justify-between text-center">
                        <div className="w-[42%]">
                            <div className="h-8 border-b border-black" />
                            <div className="mt-1 text-[11px] font-medium">
                                Sign of Receiver
                            </div>
                        </div>
                        <div className="w-[42%]">
                            <div className="h-8 border-b border-black" />
                            <div className="mt-1 text-[11px] font-medium">
                                Sign of Giver
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default VoucherSlipModal;