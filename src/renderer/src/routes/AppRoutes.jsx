import { Routes, Route, HashRouter, Navigate, useLocation } from "react-router-dom";
import AppBootstrapProvider from "../../../kit/hooks/AppBootstrapProvider";
import AutoSyncProvider from "../../../kit/hooks/AutoSyncProvider";
import DaySessionProvider from "../../../kit/hooks/DaySessionProvider";
import Login from "../pages/Login";
import Logo from "../../../../resources/allrounder_logo.png";
import Dashboard from "../pages/Dashboard";
import Bills from "../pages/Bills";
import CollectPayments from "../pages/CollectPayments";
import CollectionReport from "../pages/CollectionReport";
import AdvanceSlips from "../pages/AdvanceSlips";
import LoyaltyLedger from "../pages/LoyaltyLedger";
import SaleReturnHistory from "../pages/SaleReturnHistory";
import Manager from "../pages/Manager";
import storage from "../../../kit/hooks/data/services/storage";
import AccessDenied from "../components/Auth/AccessDenied";
import { Role } from "../../../kit/configs/general";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { MaterialUISwitch } from "../../../kit/style/MaterialUISwitch";
import KitIcon from "../../../kit/components/KitIcon/KitIcon";
import Tooltip from "@mui/material/Tooltip";
import KitShow from "../../../kit/components/KitShow/KitShow";
import KitDeleteDialog from "../../../kit/components/KitDeleteDialog";
import StockoutAlerts from "../pages/product-management/stockout-alerts";
import UnderStock from "../pages/product-management/under-stock/page";
import ManagerLayout from "../pages/Manager/ManagerLayout";
import NegativeStock from "../pages/product-management/negative-stock";
import ExcessStock from "../pages/product-management/excess-stock";
import DeadStock from "../pages/product-management/DeadStock";
import POStatusReport from "../pages/action-reports/po-status-report";
import POSummaryReport from "../pages/action-reports/po-summary-report";
import ItemStockReport from "../pages/action-reports/itemstock-report";
import MarkdownReport from "../pages/action-reports/markdown-report";
import TransferReport from "../pages/action-reports/transfer-report";
import StockLedgerReport from "../pages/stock-ledger-report";
import Coupon from "../pages/coupons/coupon";
import GlobalCoupon from "../pages/coupons/global-coupon";
import AppUpdateControl from "../components/AppUpdateControl";

const getStoredRole = () => {
    const userData = storage.getItem("userData") || {};
    return String(userData?.role || "").toLowerCase();
};

function RoleRoute({ allowedRoles, fallbackMessage, children }) {
    const role = getStoredRole();

    if (!role) {
        return <Navigate to="/" replace />;
    }

    if (role === Role.ADMIN.toLowerCase()) {
        return <AccessDenied message="Admin access is not allowed here. Please use the separate admin portal." />;
    }

    if (allowedRoles.includes(role)) {
        return children;
    }

    return <AccessDenied message={fallbackMessage} />;
}

function AppShell({ mode, onModeChange }) {
    const location = useLocation();
    const showGlobalLogo = location.pathname !== "/";
    const isDashboard = location.pathname === "/dashboard";
    const isDark = mode === "dark";

    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [showQuitDialog, setShowQuitDialog] = useState(false);

    const toggleQuitDialog = () => setShowQuitDialog(!showQuitDialog);

    const onQuit = () => {
        window.api?.quitApp?.();
    };

    // useEffect(() => {
    //     const updateThemeByTime = () => {
    //         const now = new Date();
    //         const hour = now.getHours();
    //         const shouldBeDark = hour >= 19 || hour < 7;
    //         onModeChange(shouldBeDark ? "dark" : "light");
    //     };
    //     updateThemeByTime();
    //     const interval = setInterval(updateThemeByTime, 60000);
    //     return () => clearInterval(interval);
    // }, [onModeChange]);

    useEffect(() => {
        const updateDateTime = () => {
            setCurrentDateTime(new Date());
        };

        updateDateTime();

        const interval = setInterval(updateDateTime, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <div
                className={`bg-header-background text-header-text ${isDashboard ? "h-dvh flex flex-col overflow-hidden" : "min-h-screen"}`}
            >
                {showGlobalLogo && (
                    <div className="flex justify-between items-end px-3 py-2 pt-0">
                        <div className="flex items-end justify-between gap-5 w-full">
                            <img src={Logo} alt="logo" className="w-32 object-contain" />
                            <div className="flex items-center gap-2">
                                <div className="flex items-end gap-2">
                                    <div className="flex items-end justify-center rounded-md bg-calendar-bg text-calendar-icon">
                                        <KitIcon icon="tabler:calendar-event" fontSize={20} />
                                    </div>
                                    <div className="text-lg font-bold leading-none text-app-text">
                                        {format(currentDateTime, "dd MMM yyyy")}
                                    </div>
                                </div>
                                <div className="h-9 w-px bg-header-divider" />
                                <div className="flex items-end gap-2">
                                    <div className="flex items-end justify-center rounded-md bg-clock-bg text-clock-icon">
                                        <KitIcon icon="tabler:clock" fontSize={20} />
                                    </div>
                                    <div className="text-lg font-bold leading-none text-app-text">
                                        {format(currentDateTime, "hh:mm a")}
                                    </div>
                                </div>
                                <AppUpdateControl />
                                {/* <div className="flex h-7 items-end translate-y-1">
                                    <MaterialUISwitch
                                        checked={isDark}
                                        onChange={(event) =>
                                            onModeChange(event.target.checked ? "dark" : "light")
                                        }
                                    />
                                </div> */}
                                <Tooltip title="Quit application" placement="top">
                                    <button
                                        type="button"
                                        onClick={toggleQuitDialog}
                                        className="p-1 rounded-md border border-gray-200 cursor-pointer transition-all duration-200 hover:border-red-100 hover:bg-red-200 hover:shadow-sm"
                                    >
                                        <KitIcon icon="tabler:x" className={`text-xl text-red-600`} />
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                )}
                <div className={isDashboard ? "flex-1 min-h-0 overflow-hidden" : ""}>
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route
                            path="/dashboard"
                            element={
                                <RoleRoute
                                    allowedRoles={[Role.CASHIER]}
                                    fallbackMessage="Managers can access only the Manager Collect page."
                                >
                                    <Dashboard />
                                </RoleRoute>
                            }
                        />
                        <Route
                            path="/bills"
                            element={
                                <RoleRoute
                                    allowedRoles={[Role.CASHIER]}
                                    fallbackMessage="Managers can access only the Manager Collect page."
                                >
                                    <Bills />
                                </RoleRoute>
                            }
                        />
                        <Route
                            path="/collect-payments"
                            element={
                                <RoleRoute
                                    allowedRoles={[Role.CASHIER]}
                                    fallbackMessage="Managers can access only the Manager Collect page."
                                >
                                    <CollectPayments />
                                </RoleRoute>
                            }
                        />
                        <Route
                            path="/collection-report"
                            element={
                                <RoleRoute
                                    allowedRoles={[Role.CASHIER]}
                                    fallbackMessage="Managers can access only the Manager Collect page."
                                >
                                    <CollectionReport />
                                </RoleRoute>
                            }
                        />
                        <Route
                            path="/advance-slips"
                            element={
                                <RoleRoute
                                    allowedRoles={[Role.CASHIER]}
                                    fallbackMessage="Managers can access only the Manager Collect page."
                                >
                                    <AdvanceSlips />
                                </RoleRoute>
                            }
                        />
                        <Route
                            path="/sale-returns"
                            element={
                                <RoleRoute
                                    allowedRoles={[Role.CASHIER]}
                                    fallbackMessage="Managers can access only the Manager Collect page."
                                >
                                    <SaleReturnHistory />
                                </RoleRoute>
                            }
                        />
                        <Route
                            element={
                                <RoleRoute
                                    allowedRoles={[Role.MANAGER]}
                                    fallbackMessage="Cashiers cannot access the Manager Collect page."
                                >
                                    <ManagerLayout />
                                </RoleRoute>
                            }
                        >
                            <Route path="/manager-collect" element={<Manager />} />
                            <Route path="/loyalty-ledger" element={<LoyaltyLedger />} />
                            <Route path="/stockout-alerts" element={<StockoutAlerts />} />
                            <Route path="/under-stock" element={<UnderStock />} />
                            <Route path="/negative-stock" element={<NegativeStock />} />
                            <Route path="/excess-stock" element={<ExcessStock />} />
                            <Route path="/dead-stock" element={<DeadStock />} />
                            <Route path="/po-status-report" element={<POStatusReport />} />
                            <Route path="/po-summary-report" element={<POSummaryReport />} />
                            <Route path="/itemstock-report" element={<ItemStockReport />} />
                            <Route path="/markdown-report" element={<MarkdownReport />} />
                            <Route path="/transfer-report" element={<TransferReport />} />
                            <Route path="/stock-ledger-report" element={<StockLedgerReport />} />
                            <Route path="/coupon" element={<Coupon />} />
                            <Route path="/global-coupon" element={<GlobalCoupon />} />
                        </Route>
                    </Routes>
                </div>
            </div>

            <KitShow show={showQuitDialog}>
                <KitDeleteDialog
                    isOpen={showQuitDialog}
                    onClose={toggleQuitDialog}
                    title={`Quit`}
                    subTitle={`Do You Want to Quit?`}
                    onDelete={onQuit}
                    isBtnLoading={false}
                    cancelButtonText="No"
                />
            </KitShow>
        </>
    );
}

export default function AppRoutes({ mode, onModeChange }) {
    return (
        <HashRouter>
            <AppBootstrapProvider>
                <DaySessionProvider>
                    <AutoSyncProvider>
                        <AppShell mode={mode} onModeChange={onModeChange} />
                    </AutoSyncProvider>
                </DaySessionProvider>
            </AppBootstrapProvider>
        </HashRouter>
    );
}
