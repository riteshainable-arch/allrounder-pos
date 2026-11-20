import KitModal from "../../../../kit/components/KitModal";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import { useEffect, useRef } from "react";

const shortcuts = [
    // Function Keys
    ["F1", "Open Shortcut Help"],
    ["F2", "Collect Payment / Generate Invoice"],
    ["F3", "Print Invoice"],
    ["F4", "Focus Barcode Search"],
    ["F5", "Start / End Day"],
    ["F6", "Sale Return"],
    ["F7", "Sync Products"],
    ["F8", "Sync Customers"],
    ["F9", "Sync Stores"],
    ["F10", "Scan Product"],

    ["C", "Focus Cash Recieved Field"],
    ["U", "Focus Digital Payment Field"],
    ["K", "Focus Card Payment Field"],
    ["S", "Focus SRN Adjustment Field"],
    ["P", "Focus Product Search"],
    ["A", "Open Advance Slips"],
    ["I", "Open Invoices"],
    ["H", "SRN History"],
    ["R", "Open Collection Report"],
    ["M", "Open Menu"],  
    ["L", "Logout"], 
    ["W", "Write Remark"],
    ["F", "Filter products"], 
    ["A", "Open Advance Slips"],
    ["N", "Focus Customer Name"],
    ["C", "Focus Customer Number"],
    ["B", "Focus Hold Bills"],
    ["B", "Focus Coupon Field"],

    // Alt Shortcuts
    ["Alt + N", "Focus SRN No"],
    ["Alt + C", "Create Slip"],
    ["Alt + G", "Focus GST / Focus Group By Filter"],
    ["Alt + P", "Focus Payment Type / Focus Customer Phone"],
    ["Alt + I", "Focus Search Invoice"],
    ["Alt + R", "Collect Request / Refresh"],
    ["Alt + U", "Use Points / Redeem Loyalty"],
    ["Alt + O", "Focus Search / Filters"],
    ["Alt + B", "Go Back to POS"],
    ["Alt + S", "Focus Start Date / Sale Return / Approve & Refund"],
    ["Alt + E", "Focus End Date"],
    ["Alt + X", "Clear Filters / Remove Offer Set"],
    ["Alt + Y", "Sync / Refresh Data"],
    ["Alt + 0 ~ 5", "Set Store Feedback Rating"],

    // Shift Shortcuts
    ["Shift + 1", "Filter Active"],
    ["Shift + 2", "Sorting Active"],
    ["Shift + P", "Print"],
    ["Shift + E", "Edit"],
    ["Shift + D", "Delete / Clear DB"],
    ["Shift + V", "View"],
    ["Shift + C", "Export Csv"],
    ["Shift + X", "Export Xlsx"],
    ["Shift + R", "Reset Filter"],

    // Other
    ["Ctrl + D", "Delete Selected Item"],
    ["Delete", "Delete Selected Item"],
    ["+", "Increase Quantity"],
    ["-", "Decrease Quantity"],
    ["↑", "Move Selection Up"],
    ["↓", "Move Selection Down"],
    ["Esc", "Close Active Popup"],
    ["Enter", "Confirm Delete / Print KOT"],
];

export default function CashierFunctionsInfoModal({ open, onClose }) {
    const scrollRef = useRef(null);

    const handleScroll = (e) => {
        const el = scrollRef.current;
        if (!el) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            el.scrollBy({ top: 40, behavior: "smooth" });
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            el.scrollBy({ top: -40, behavior: "smooth" });
        }
    };

    useEffect(() => {
        if (open) {
            setTimeout(() => {
                scrollRef.current?.focus();
            }, 0);
        }
    }, [open]);

    return (
        <KitModal
            maxWidth="sm"
            isOpen={open}
            onClose={onClose}
            title={<div className="text-base font-semibold">Keyboard Shortcuts</div>}
            titleClass="p-3! border-b"
        >
            <div
                ref={scrollRef}
                tabIndex={0}
                onKeyDown={handleScroll}
                className="p-3 pb-0 max-h-[600px] overflow-y-auto custom-scroll outline-none focus:outline-none"
            >
                <div className="overflow-hidden rounded-lg border border-app-border">
                    <table className="w-full text-sm">
                        <thead className="bg-third-50">
                            <tr className="border-b border-app-border">
                                <th className="w-32 px-3 py-2 text-left font-semibold text-third-800">Shortcut</th>
                                <th className="px-3 py-2 text-left font-semibold text-third-800">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {shortcuts.map(([key, action], index) => (
                                <tr
                                    key={key}
                                    className={
                                        index !== shortcuts.length - 1 ? "border-b border-app-border" : ""
                                    }
                                >
                                    <td className="px-3 py-2 font-semibold text-primary whitespace-nowrap">{key}</td>
                                    <td className="px-3 py-2 text-app-text">{action}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="p-4 flex justify-end">
                <KitButton
                    variant="outlined"
                    size="small"
                    className="w-auto"
                    onClick={onClose}
                >
                    Close
                </KitButton>
            </div>
        </KitModal>
    );
}