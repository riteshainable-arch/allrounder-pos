import { useEffect, useState } from "react";
import KitDrawer from "../../../../kit/components/KitDrawer/KitDrawer";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitShow from "../../../../kit/components/KitShow/KitShow";
import { createPortal } from "react-dom";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import { useNavigate } from "react-router-dom";
import { List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ShortcutBadge from "../Dashboard/ShortcutBadge";
import ManagerUnlockModal from "../Dashboard/ManagerUnlockModal";

const ManagerMenuDrawer = ({ isOpen, onClose, userData, handleLogout }) => {
    const navigate = useNavigate();
    const [openSync, setOpenSync] = useState(false);
    const [openReports, setOpenReports] = useState(false);
    const [openCoupons, setOpenCoupons] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isManagerUnlockModalOpen, setIsManagerUnlockModalOpen] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);

    const navigationItems = [
        {
            title: "Product Management Reports",
            icon: "tabler:chart-bar",
            shortcut: "",
            expandable: true,
            expanded: openSync,
            action: () => setOpenSync((v) => !v),
        },
        ...(openSync
            ? [
                  {
                      title: "Stockout Alerts",
                      icon: "tabler:bell-ringing",
                      shortcut: "F2",
                      action: () => navigate("/stockout-alerts"),
                  },
                  {
                      title: "Under Stock",
                      icon: "tabler:package-off",
                      shortcut: "F3",
                      action: () => navigate("/under-stock"),
                  },
                  {
                      title: "Negative Stock",
                      icon: "tabler:trending-down",
                      shortcut: "F4",
                      action: () => navigate("/negative-stock"),
                  },
                  {
                      title: "Excess Stock",
                      icon: "tabler:packages",
                      shortcut: "F5",
                      action: () => navigate("/excess-stock"),
                  },
                  {
                      title: "Dead Stock",
                      icon: "tabler:archive",
                      shortcut: "F6",
                      action: () => navigate("/dead-stock"),
                  },
              ]
            : []),
        {
            title: "Stock Ledger",
            icon: "tabler:clipboard-list",
            color: "",
            shortcut: "F7",
            action: () => navigate("/stock-ledger-report"),
        },
        {
            title: "Coupons",
            icon: "tabler:ticket",
            shortcut: "",
            expandable: true,
            expanded: openCoupons,
            action: () => setOpenCoupons((v) => !v),
        },
        ...(openCoupons
            ? [
                  {
                      title: "Coupon",
                      icon: "tabler:ticket",
                      shortcut: "F8",
                      action: () => navigate("/coupon"),
                  },
                  {
                      title: "Global Coupon",
                      icon: "tabler:gift-card",
                      shortcut: "F9",
                      action: () => navigate("/global-coupon"),
                  },
              ]
            : []),
        {
            title: "Action Reports",
            icon: "tabler:report-analytics",
            shortcut: "",
            expandable: true,
            expanded: openReports,
            action: () => setOpenReports((v) => !v),
        },
        ...(openReports
            ? [
                  {
                      title: "PO Status Report",
                      icon: "tabler:file-check",
                      shortcut: "Alt + F1",
                      action: () => navigate("/po-status-report"),
                  },
                  {
                      title: "PO Summary Report",
                      icon: "tabler:clipboard-data",
                      shortcut: "Alt + F2",
                      action: () => navigate("/po-summary-report"),
                  },
                  {
                      title: "Transfer Report",
                      icon: "tabler:arrows-exchange",
                      shortcut: "Alt + F3",
                      action: () => navigate("/transfer-report"),
                  },
                  {
                      title: "Markdown Report",
                      icon: "tabler:tag",
                      shortcut: "Alt + F4",
                      action: () => navigate("/markdown-report"),
                  },
                  {
                      title: "Item Stock Report",
                      icon: "tabler:packages",
                      shortcut: "Alt + F5",
                      action: () => navigate("/itemstock-report"),
                  },
                  {
                      title: "Outstanding Report",
                      icon: "tabler:receipt",
                      shortcut: "Alt + F6",
                      action: () => navigate("/manager-collect", { state: { activeTab: "outstanding" } }),
                  },
                  {
                      title: "Invoice Report",
                      icon: "tabler:file-invoice",
                      shortcut: "Alt + F7",
                      action: () => navigate("/manager-collect", { state: { activeTab: "invoices" } }),
                  },
                  {
                      title: "Advance Slips Report",
                      icon: "tabler:wallet",
                      shortcut: "Alt + F8",
                      action: () => navigate("/manager-collect", { state: { activeTab: "advances" } }),
                  },
                  {
                      title: "Sale Returns Report",
                      icon: "tabler:receipt-refund",
                      shortcut: "Alt + F9",
                      action: () => navigate("/manager-collect", { state: { activeTab: "returns" } }),
                  },
                  {
                      title: "Cashier Collection Report",
                      icon: "tabler:cash",
                      shortcut: "Alt + F10",
                      action: () => navigate("/manager-collect", { state: { activeTab: "collection" } }),
                  },
                  {
                      title: "Loyalty Report",
                      icon: "tabler:heart-handshake",
                      shortcut: "Alt + F11",
                      action: () => navigate("/manager-collect", { state: { activeTab: "loyalty" } }),
                  },
                  {
                      title: "Loyalty Ledger Report",
                      icon: "tabler:book-2",
                      shortcut: "Alt + F12",
                      action: () => navigate("/manager-collect", { state: { activeTab: "loyaltyLedger" } }),
                  },
              ]
            : []),
    ];

    const handleMenuAction = (item) => {
        if (item.expandable) {
            item.action?.();
            return;
        }
        onClose();
        item.action?.();
    };

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();

            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
                return;
            }

            if (!e.ctrlKey && !e.altKey && !e.shiftKey && key === "l") {
                e.preventDefault();
                handleLogout();
                return;
            }

            const shortcuts = {
                F2: () => navigate("/stockout-alerts"),
                F3: () => navigate("/under-stock"),
                F4: () => navigate("/negative-stock"),
                F5: () => navigate("/excess-stock"),
                F6: () => navigate("/dead-stock"),
                F7: () => navigate("/stock-ledger-report"),
                F8: () => navigate("/coupon"),
                F9: () => navigate("/global-coupon"),
            };

            if (e.altKey && !e.ctrlKey && !e.shiftKey) {
                const reportRoutes = {
                    F1: () => navigate("/po-status-report"),
                    F2: () => navigate("/po-summary-report"),
                    F3: () => navigate("/transfer-report"),
                    F4: () => navigate("/markdown-report"),
                    F5: () => navigate("/itemstock-report"),
                    F6: () =>
                        navigate("/manager-collect", {
                            state: { activeTab: "outstanding" },
                        }),
                    F7: () =>
                        navigate("/manager-collect", {
                            state: { activeTab: "invoices" },
                        }),
                    F8: () =>
                        navigate("/manager-collect", {
                            state: { activeTab: "advances" },
                        }),
                    F9: () =>
                        navigate("/manager-collect", {
                            state: { activeTab: "returns" },
                        }),
                    F10: () =>
                        navigate("/manager-collect", {
                            state: { activeTab: "collection" },
                        }),
                    F11: () =>
                        navigate("/manager-collect", {
                            state: { activeTab: "loyalty" },
                        }),
                    F12: () =>
                        navigate("/manager-collect", {
                            state: { activeTab: "loyaltyLedger" },
                        }),
                };

                const action = reportRoutes[e.key];
                if (action) {
                    e.preventDefault();
                    onClose();
                    action();
                    return;
                }
            }

            if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
                const action = shortcuts[e.key];
                if (action) {
                    e.preventDefault();
                    onClose();
                    action();
                    return;
                }
            }

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, navigationItems.length - 1));
                return;
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
                return;
            }

            if (e.key === "Enter") {
                e.preventDefault();
                const selectedItem = navigationItems[activeIndex];

                if (selectedItem && !selectedItem.disabled) {
                    handleMenuAction(selectedItem);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, activeIndex, navigationItems, navigate, onClose, handleLogout]);

    return createPortal(
        <KitDrawer
            isOpen={isOpen}
            onClose={onClose}
            title=""
            headerClass="hidden"
            children={
                <>
                    <div className="flex flex-col h-full min-h-0">
                        <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-6 flex flex-col gap-4 pb-24 bg-app-paper">
                            <div className="relative">
                                <ShortcutBadge shortcut="Esc" className="-top-5! left-0! w-fit!" />
                                <KitButton
                                    variant="outlined"
                                    type="button"
                                    size="small"
                                    className="w-fit"
                                    startIcon={<KitIcon icon="tabler:x" />}
                                    onClick={onClose}
                                >
                                    Close
                                </KitButton>
                            </div>
                            <div className="rounded-2xl border border-gray-200 bg-reverse p-5 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-hover">
                                        <KitIcon icon="tabler:user" className="text-4xl text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-lg font-bold text-third">{userData.firstName}</h2>
                                        <p className="text-sm text-third-500">{userData.email}</p>
                                        <div className="mt-3 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                            <KitIcon icon="tabler:shield-check" className="mr-1 text-sm" />
                                            {userData.role}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <List disablePadding>
                                {navigationItems.map((item, index) => (
                                    <ListItemButton
                                        key={item.title}
                                        selected={activeIndex === index}
                                        disabled={item.disabled}
                                        onClick={() => handleMenuAction(item)}
                                        sx={(theme) => ({
                                            borderRadius: 2,
                                            mb: 0.5,
                                            pl: item.title.includes("Sync") && item.title !== "Synchronization" ? 7 : 2,
                                            bgcolor:
                                                activeIndex === index
                                                    ? theme.palette.customColors.activeBackground
                                                    : "transparent",

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
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            <KitIcon icon={item.icon} className={`text-${item.color}-600` || ""} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <span className={`text-${item.color}-600` || ""}>{item.title}</span>
                                            }
                                        />
                                        {item.shortcut && (
                                            <ShortcutBadge
                                                shortcut={item.shortcut}
                                                className={`static ml-auto ${`text-${item.color}-600 bg-${item.color}-100!` || ""}`}
                                            />
                                        )}
                                        {item.expandable && (item.expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
                                    </ListItemButton>
                                ))}
                            </List>
                        </div>
                        <div className="px-6 py-3 z-10 bg-reverse sticky bottom-0 left-0 right-0">
                            <div className="relative">
                                <ShortcutBadge shortcut="L" />
                                <KitButton
                                    variant="contained"
                                    type="submit"
                                    color="error"
                                    className="w-full"
                                    startIcon={<KitIcon icon="tabler:logout" />}
                                    onClick={handleLogout}
                                >
                                    Logout
                                </KitButton>
                            </div>
                        </div>
                    </div>

                    <KitShow show={isManagerUnlockModalOpen}>
                        <ManagerUnlockModal
                            isOpen={isManagerUnlockModalOpen}
                            onClose={() => {
                                setIsManagerUnlockModalOpen(false);
                                setPendingNavigation(null);
                            }}
                            onSuccess={() => {
                                setIsManagerUnlockModalOpen(false);
                                if (pendingNavigation) {
                                    navigate(pendingNavigation);
                                    setPendingNavigation(null);
                                }
                            }}
                        />
                    </KitShow>
                </>
            }
        />,
        document.body
    );
};

export default ManagerMenuDrawer;
