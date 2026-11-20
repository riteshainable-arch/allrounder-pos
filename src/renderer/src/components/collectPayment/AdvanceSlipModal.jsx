import { format } from "date-fns";
import KitModal from "../../../../kit/components/KitModal";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import KitSelect from "../../../../kit/components/KitSelect";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { priceFormat } from "../../../../kit/utils/priceFormat";

const AdvanceSlipModal = ({ isOpen, onClose, userData, amount, givenTo, setGivenTo }) => {
    const printRef = useRef(null);
    const managers = [
        { userId: "1", firstName: "Store Manager" },
        { userId: "2", firstName: "Branch Manager" },
        { userId: "3", firstName: "Operations Manager" },
    ];

    const managerOptions =
        managers?.map((manager) => ({
            label: `${manager.firstName}`,
            value: manager.userId,
        })) || [];

    const selectedManager = managerOptions.find((x) => x.value === givenTo)?.label || "";

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: "Advance Slip",
    });

    return (
        <>
            <KitModal
                maxWidth="sm"
                isOpen={isOpen}
                onClose={onClose}
                title={<div className="text-base font-semibold">Advance Slip</div>}
                titleClass="border-b p-3!"
            >
                <div className="p-4 pb-0">
                    <div className="grid grid-cols-2 gap-y-3 text-sm items-center">
                        <div className="font-semibold">User Id</div>
                        <div>{userData?.userId}</div>
                        <div className="font-semibold">Name</div>
                        <div>{userData?.firstName} {userData?.lastName}</div>
                        <div className="font-semibold">Time of Day</div>
                        <div>{format(new Date(), "hh:mm aa")}</div>
                        <div className="font-semibold">Given to</div>
                        <KitSelect
                            placeholder="Select Manager"
                            placeholderFontSize={14}
                            inputFontSize={14}
                            size="small"
                            options={managerOptions}
                            menuShouldScrollIntoView={false}
                            styles={{ menu: (provided) => ({ ...provided, zIndex: 9999 }) }}
                            value={managerOptions.find((opt) => opt.label === givenTo) ?? null}
                            onChange={(option) => setGivenTo(option?.label || '')}
                        />
                        <div className="font-semibold">Amount</div>
                        <div>{amount || 0}</div>
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
                    id="advance-slip-section"
                    className="w-[80mm] bg-white p-3 text-xs text-black"
                >
                    <div className="text-center text-lg font-bold">ADVANCE SLIP</div>
                    <hr />
                    <div className="mt-2">
                        <div>Slip No : ADV000001</div>
                        <div>Date : {format(new Date(), "dd MMM yyyy")}</div>
                        <div>Time : {format(new Date(), "hh:mm aa")}</div>
                    </div>
                    <hr className="my-2" />
                    <div>User ID : {userData?.userId}</div>
                    <div>Name : {userData?.firstName} {userData?.lastName}</div>
                    <div>Given To : {selectedManager}</div>
                    <hr className="my-2" />
                    <div className="text-center">
                        <div className="font-semibold">Advance Amount</div>
                        <div className="text-2xl font-bold">{priceFormat(amount)}</div>
                    </div>
                    <div className="mt-10 flex justify-between text-center">
                        <div className="w-[45%]">
                            <div className="mb-1 border-t border-black" />
                            <div className="text-[11px] font-medium">
                                Sign of Manager
                            </div>
                        </div>
                        <div className="w-[45%]">
                            <div className="mb-1 border-t border-black" />
                            <div className="text-[11px] font-medium">
                                Sign of Cashier
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdvanceSlipModal;