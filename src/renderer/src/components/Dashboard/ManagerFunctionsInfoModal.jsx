import KitModal from "../../../../kit/components/KitModal";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import { useEffect, useRef } from "react";

const shortcuts = [
    // Function Keys
    ["F1", "Open Shortcut Help"],

    // Alt Shortcuts
    ["Alt + 1", "Collect Amount Tab"],
    ["Alt + 2", "Outstanding Tab"],
    ["Alt + 3", "Invoices Tab"],
    ["Alt + 4", "Advance Slips Tab"],
    ["Alt + 5", "Sale Returns Tab"],
    ["Alt + 6", "Cashier Collection Tab"],
    ["Alt + 7", "Loyalty Report Tab"],
    ["Alt + 8", "Loyalty Ledger Tab"],
    ["Alt + 9", "Cashiers Tab"],
    ["Alt + M", "Profile"],
    ["Alt + L", "Logout"],
    ["Alt + C", "Focus Cashier"],
    ["Alt + S", "Focus Start Date"],
    ["Alt + E", "Focus End Date"],
    ["Alt + O", "Focus Search"],
    ["Alt + G", "Focus Group by"],
    ["Alt + N", "Focus Customer Name / Focus SRN No"],
    ["Alt + I", "Focus Invoive No"],
    ["Alt + T", "Toggle Return Only"],
    ["Alt + R", "Refresh"],
    ["Alt + P", "Focus Customer Phone"],
    ["Alt + A", "Add Cashier"],

    // Shift Shortcuts
    ["Shift + 1", "Pending Queue Tab"],
    ["Shift + 2", "All Slips Audit Tab"],
    ["Shift + V", "View"],
    ["Shift + A", "Approve"],
    ["Shift + R", "Reject"],
    ["Shift + P", "RePrint"],
    ["Shift + C", "Export Csv"],
    ["Shift + X", "Export Xlsx"],

    // Other
    ["↑", "Move Selection Up"],
    ["↓", "Move Selection Down"],
    ["Esc", "Close Active Popup"],
];

export default function ManagerFunctionsInfoModal({ open, onClose }) {
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