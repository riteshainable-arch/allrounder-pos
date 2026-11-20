import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import KitDrawer from "../../../../kit/components/KitDrawer/KitDrawer";
import AdminDasboard from "../../components/Admin/AdminDasboard/AdminDasboard";
import AdminUserManagement from "../../components/Admin/AdminUserManagement/AdminUserManagement";
import Logo from "../../../../../resources/allrounder_logo.png";
import { Collapse, List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import POStatusReport from "../action-reports/po-status-report";
import POSummaryReport from "../action-reports/po-summary-report";
import MarkdownReport from "../action-reports/markdown-report";
import TransferReport from "../action-reports/transfer-report";
import ItemStockReport from "../action-reports/itemstock-report";
import StockLedgerReport from "../stock-ledger-report";
import ManagerLoyaltyReportPanel from "../../components/Manager/ManagerLoyaltyReportPanel";
import LoyaltyLedgerPage from "../LoyaltyLedger";
import ManagerCollectionPanel from "../../components/Manager/ManagerCollectionPanel";
import ManagerOutstandingPanel from "../../components/Manager/ManagerOutstandingPanel";
import ManagerInvoicesPanel from "../../components/Manager/ManagerInvoicesPanel";
import ManagerAdvanceSlipsPanel from "../../components/Manager/ManagerAdvanceSlipsPanel";
import SaleReturnHistoryPanel from "../../components/SaleReturn/SaleReturnHistoryPanel";
import InvoiceAnalysis from "../../components/Admin/InvoiceAnalysis/InvoiceAnalysis";
import CategoryKPIs from "../../components/Admin/CategoryKPIs/CategoryKPIs";
import CategoryKpiDetail from "../../components/Admin/CategoryKPIs/CategoryKpiDetail";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitShow from "../../../../kit/components/KitShow/KitShow";
import KitDeleteDialog from "../../../../kit/components/KitDeleteDialog";
import ProductManagementReport from "../../components/ProductManagementReport/ProductManagementReport";
import storage from "../../../../kit/hooks/data/services/storage";

const adminModules = [
    { title: "Dashboard", icon: "tabler:layout-dashboard" },
    { title: "User Management", icon: "tabler:users" },
    { title: "Stock Ledger", icon: "tabler:clipboard-list" },
    { title: "Invoice Analysis", icon: "tabler:file-analytics" },
    { title: "Category KPIs", icon: "tabler:chart-bar" },
    {
        title: "Inventory Management",
        icon: "tabler:packages",
        children: ["Stockout Alerts", "Under Stock", "Negative Stock", "Excess Stock", "Dead Stock"],
    },
    {
        title: "Reports",
        icon: "tabler:report-analytics",
        children: [
            "PO Status Report",
            "PO Summary Report",
            "Transfer Report",
            "Markdown Report",
            "Item Stock Report",
            "Outstanding Report",
            "Invoice Report",
            "Advance Slips Report",
            "Sale Returns Report",
            "Cashier Collection Report",
            "Loyalty Report",
            "Loyalty Ledger Report",
        ],
    },
];

export default function Admin() {
    const location = useLocation();
    const navigate = useNavigate();
    const { categorySlug } = useParams();
    const [activeModule, setActiveModule] = useState(
        categorySlug ? "Category KPIs" : (location.state?.activeModule ?? "Dashboard")
    );
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isStockExpanded, setIsStockExpanded] = useState(false);
    const [isReportsExpanded, setIsReportsExpanded] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const toggleLogoutDialog = () => setShowLogoutDialog(!showLogoutDialog);

    const handleModuleSelection = (module) => {
        setActiveModule(module);
        setIsDrawerOpen(false);

        if (categorySlug) {
            navigate("/admin", { state: { activeModule: module } });
        }
    };

    const onLogout = () => {
        storage.removeItem("token");
        storage.removeItem("userData");
        toggleLogoutDialog();
        navigate("/");
    };

    const handleLogout = () => {
        toggleLogoutDialog();
    };

    const renderModuleLinks = () => (
        <List disablePadding>
            {adminModules.map(({ title, icon, children }) => {
                const isExpanded = title === "Inventory Management" ? isStockExpanded : isReportsExpanded;
                return (
                    <div key={title}>
                        <ListItemButton
                            selected={activeModule === title}
                            aria-current={activeModule === title ? "page" : undefined}
                            aria-expanded={children ? isExpanded : undefined}
                            onClick={() => {
                                if (children) {
                                    if (title === "Inventory Management") {
                                        setIsStockExpanded((expanded) => !expanded);
                                    } else {
                                        setIsReportsExpanded((expanded) => !expanded);
                                    }
                                    return;
                                }

                                handleModuleSelection(title);
                            }}

                            sx={(theme) => ({
                                borderRadius: 2,
                                paddingY: "3px !important",
                                mb: 0.5,
                                "&.Mui-selected": {
                                    bgcolor: theme.palette.customColors.activeBackground,
                                },
                                "&.Mui-selected:hover": {
                                    bgcolor: theme.palette.customColors.activeBackground,
                                },
                                "&:hover": {
                                    bgcolor: theme.palette.customColors.primaryHover,
                                },
                            })}
                        >
                            <ListItemIcon sx={{ minWidth: 28 }}>
                                <KitIcon icon={icon} className="text-xl" />
                            </ListItemIcon>
                            <ListItemText
                                primary={title}
                                sx={{
                                    "& .MuiListItemText-primary": {
                                        fontSize: "15px",
                                    },
                                }}
                            />
                            {children && (
                                <KitIcon
                                    icon={isExpanded ? "tabler:chevron-up" : "tabler:chevron-down"}
                                    className="text-lg"
                                />
                            )}
                        </ListItemButton>
                        {children && (
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    {children.map((report) => (
                                        <ListItemButton
                                            key={report}
                                            selected={activeModule === report}
                                            aria-current={activeModule === report ? "page" : undefined}
                                            onClick={() => {
                                                handleModuleSelection(report);
                                            }}
                                            sx={(theme) => ({
                                                borderRadius: 2,
                                                mb: 0.5,
                                                pl: 7,
                                                paddingY: "3px !important",
                                                "&.Mui-selected": {
                                                    bgcolor: theme.palette.customColors.activeBackground,
                                                },
                                                "&.Mui-selected:hover": {
                                                    bgcolor: theme.palette.customColors.activeBackground,
                                                },
                                                "&:hover": {
                                                    bgcolor: theme.palette.customColors.primaryHover,
                                                },
                                            })}
                                        >
                                            <ListItemText
                                                primary={report}
                                                sx={{
                                                    "& .MuiListItemText-primary": {
                                                        fontSize: "15px",
                                                    },
                                                }}
                                            />
                                        </ListItemButton>
                                    ))}
                                </List>
                            </Collapse>
                        )}
                    </div>
                );
            })}
        </List>
    );

    const renderLogoutButton = () => (
        <div className="shrink-0 bg-white px-3 py-3">
            <KitButton
                variant="contained"
                type="button"
                color="error"
                className="w-full"
                startIcon={<KitIcon icon="tabler:logout" />}
                onClick={handleLogout}
            >
                Logout
            </KitButton>
        </div>
    );

    return (
        <main className="flex h-[calc(100vh-2.8rem)] min-h-0 flex-col overflow-hidden p-4 pt-0 md:flex-row">
            <header className="flex shrink-0 items-center justify-between rounded-xl bg-white p-3 mb-3 shadow-card md:hidden">
                <img src={Logo} alt="logo" className="w-28 object-contain" />
                <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    aria-label="Open admin menu"
                    aria-expanded={isDrawerOpen}
                    aria-controls="admin-module-drawer"
                    className="rounded-lg p-1 text-slate-700 hover:bg-slate-100"
                >
                    <KitIcon icon="tabler:menu-2" className="text-2xl" />
                </button>
            </header>

            <aside className="hidden w-72 shrink-0 flex-col overflow-hidden rounded-xl bg-white p-3 shadow-card md:flex">
                <h1 className="shrink-0 px-3 py-2 text-lg font-bold text-app-text">Admin</h1>
                <nav aria-label="Admin modules" className="min-h-0 flex-1 overflow-y-auto custom-scroll">
                    {renderModuleLinks()}
                </nav>
                {renderLogoutButton()}
            </aside>

            <section className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto rounded-xl bg-white p-3 shadow-card md:p-6">
                {activeModule === "Dashboard" && <AdminDasboard />}
                {activeModule === "User Management" && <AdminUserManagement />}
                {activeModule === "Stock Ledger" && <StockLedgerReport divider={false} />}
                {activeModule === "Stockout Alerts" && <ProductManagementReport alertType="STOCK_OUT" />}
                {activeModule === "Under Stock" && <ProductManagementReport alertType="UNDER_STOCK" />}
                {activeModule === "Negative Stock" && <ProductManagementReport alertType="NEGATIVE_STOCK" />}
                {activeModule === "Excess Stock" && <ProductManagementReport alertType="OVER_STOCK" />}
                {activeModule === "Dead Stock" && <ProductManagementReport alertType="DEAD_STOCK" />}
                {activeModule === "PO Status Report" && <POStatusReport divider={false} />}
                {activeModule === "PO Summary Report" && <POSummaryReport divider={false} />}
                {activeModule === "Markdown Report" && <MarkdownReport divider={false} />}
                {activeModule === "Transfer Report" && <TransferReport divider={false} />}
                {activeModule === "Item Stock Report" && <ItemStockReport divider={false} />}
                {activeModule === "Cashier Collection Report" && <ManagerCollectionPanel />}
                {activeModule === "Outstanding Report" && <ManagerOutstandingPanel />}
                {activeModule === "Invoice Report" && <ManagerInvoicesPanel />}
                {activeModule === "Advance Slips Report" && <ManagerAdvanceSlipsPanel />}
                {activeModule === "Sale Returns Report" && <SaleReturnHistoryPanel />}
                {activeModule === "Loyalty Report" && <ManagerLoyaltyReportPanel />}
                {activeModule === "Loyalty Ledger Report" && <LoyaltyLedgerPage />}
                {activeModule === "Invoice Analysis" && <InvoiceAnalysis />}
                {activeModule === "Category KPIs" && (categorySlug ? <CategoryKpiDetail /> : <CategoryKPIs />)}
            </section>

            <div className="md:hidden">
                <div className="md:hidden">
                    <KitDrawer
                        isOpen={isDrawerOpen}
                        onClose={() => setIsDrawerOpen(false)}
                        title="Admin"
                        drawerWidthClass="w-72 max-w-[85vw] flex flex-col overflow-hidden"
                        headerClass="p-3! border-third-200! shrink-0"
                    >
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                            <nav
                                id="admin-module-drawer"
                                aria-label="Admin modules"
                                className="min-h-0 flex-1 overflow-y-auto p-4"
                            >
                                {renderModuleLinks()}
                            </nav>

                            <div className="shrink-0 border-t border-gray-200 bg-white">{renderLogoutButton()}</div>
                        </div>
                    </KitDrawer>
                </div>
            </div>
            <KitShow show={showLogoutDialog}>
                <KitDeleteDialog
                    isOpen={showLogoutDialog}
                    onClose={toggleLogoutDialog}
                    title={`Logout`}
                    subTitle={`Do You Want to Logout?`}
                    onDelete={onLogout}
                    isBtnLoading={false}
                    cancelButtonText="No"
                />
            </KitShow>
        </main>
    );
}
