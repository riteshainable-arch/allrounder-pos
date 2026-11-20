import { useEffect, useState } from "react";
import KitTab from "../../../../kit/components/KitTab";
import ManagerAdvanceSlipsPanel from "../../components/Manager/ManagerAdvanceSlipsPanel";
import SaleReturnHistoryPanel from "../../components/SaleReturn/SaleReturnHistoryPanel";
import ManagerCollectPanel from "../../components/Manager/ManagerCollectPanel";
import ManagerOutstandingPanel from "../../components/Manager/ManagerOutstandingPanel";
import ManagerInvoicesPanel from "../../components/Manager/ManagerInvoicesPanel";
import ManagerCollectionPanel from "../../components/Manager/ManagerCollectionPanel";
import ManagerLoyaltyReportPanel from "../../components/Manager/ManagerLoyaltyReportPanel";
import ManagerUsersPanel from "../../components/Manager/ManagerUsersPanel";
import { useAdvancePendingCount } from "../../../../kit/hooks/data/cashierAdvance";
import { Badge } from "@mui/material";
import { useLocation, useOutletContext } from "react-router-dom";
import LoyaltyLedgerPage from "../LoyaltyLedger";
import ShortcutBadge from "../../components/Dashboard/ShortcutBadge";
import KitShow from "../../../../kit/components/KitShow/KitShow";
import ManagerFunctionsInfoModal from "../../components/Dashboard/ManagerFunctionsInfoModal";
import useKeyboardShortcuts from "../../../../kit/hooks/useKeyboardShortcuts";

const MANAGER_TABS = [
    // { value: "collect", label: "Collect Amount" },
    { value: "outstanding", label: "Outstanding" },
    { value: "invoices", label: "Invoices" },
    { value: "advances", label: "Advance Slips" },
    { value: "returns", label: "Sale Returns" },
    { value: "collection", label: "Cashier Collection" },
    { value: "loyalty", label: "Loyalty Report" },
    { value: "loyaltyLedger", label: "Loyalty Ledger" },
    { value: "users", label: "Cashiers" },
];

export default function Manager() {
    const { handleLogout, toggleProfileMenu } = useOutletContext();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("outstanding");
    const [collectionFilter, setCollectionFilter] = useState(null);
    const [showShortcutModal, setShowShortcutModal] = useState(false);

    const openCashierCollection = (filter) => {
        setCollectionFilter(filter);
        setActiveTab("collection");
    };

    const selectTab = (tab) => {
        setCollectionFilter(null);
        setActiveTab(tab);
    };
    const { pendingCount } = useAdvancePendingCount({}, true);

    const toggleShortcutModal = () => setShowShortcutModal(!showShortcutModal);

    useEffect(() => {
        const requestedTab = location.state?.activeTab;
        if (MANAGER_TABS.some((tab) => tab.value === requestedTab)) {
            setActiveTab(requestedTab);
        }
    }, [location.state]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;

            switch (e.key) {
                case "m":
                case "M":
                    e.preventDefault();
                    toggleProfileMenu();
                    break;

                // case "1":
                //     e.preventDefault();
                //     selectTab("collect");
                //     break;

                case "1":
                    e.preventDefault();
                    selectTab("outstanding");
                    break;

                case "2":
                    e.preventDefault();
                    selectTab("invoices");
                    break;

                case "3":
                    e.preventDefault();
                    selectTab("advances");
                    break;

                case "4":
                    e.preventDefault();
                    selectTab("returns");
                    break;

                case "5":
                    e.preventDefault();
                    selectTab("collection");
                    break;

                case "6":
                    e.preventDefault();
                    selectTab("loyalty");
                    break;

                case "7":
                    e.preventDefault();
                    selectTab("loyaltyLedger");
                    break;

                case "8":
                    e.preventDefault();
                    selectTab("users");
                    break;

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const shortcuts = {
        // collect: "Alt + 1",
        outstanding: "Alt + 1",
        invoices: "Alt + 2",
        advances: "Alt + 3",
        returns: "Alt + 4",
        collection: "Alt + 5",
        loyalty: "Alt + 6",
        loyaltyLedger: "Alt + 7",
        users: "Alt + 8",
    };

    useKeyboardShortcuts({
        toggleShortcutModal,
        handleLogout,
    });

    return (
        <>
            <div>
                <div className="mb-3 rounded-sm border border-gray-200 px-2">
                    <KitTab
                        tabList={MANAGER_TABS.map((tab) => ({
                            ...tab,
                            label: (
                                <div className="relative flex items-center gap-1">
                                    {tab.value === "advances" && pendingCount > 0 ? (
                                        <Badge badgeContent={pendingCount} color="error">
                                            <span className="pr-3">{tab.label}</span>
                                        </Badge>
                                    ) : (
                                        tab.label
                                    )}

                                    <ShortcutBadge shortcut={shortcuts[tab.value]} className="left-0! w-fit!" />
                                </div>
                            ),
                        }))}
                        activeTab={activeTab}
                        onSelectTab={selectTab}
                    />
                </div>

                {/* {activeTab === "collect" && <ManagerCollectPanel onOpenCashier={openCashierCollection} />} */}
                {activeTab === "outstanding" && <ManagerOutstandingPanel />}
                {activeTab === "invoices" && <ManagerInvoicesPanel />}
                {activeTab === "advances" && <ManagerAdvanceSlipsPanel />}
                {activeTab === "returns" && <SaleReturnHistoryPanel showCashierFilter />}
                {activeTab === "collection" && <ManagerCollectionPanel initialFilter={collectionFilter} />}
                {activeTab === "loyalty" && <ManagerLoyaltyReportPanel />}
                {activeTab === "loyaltyLedger" && <LoyaltyLedgerPage />}
                {activeTab === "users" && <ManagerUsersPanel />}
            </div>

            <KitShow show={showShortcutModal}>
                <ManagerFunctionsInfoModal
                    open={showShortcutModal}
                    onClose={toggleShortcutModal}
                />
            </KitShow>
        </>
    );
}
