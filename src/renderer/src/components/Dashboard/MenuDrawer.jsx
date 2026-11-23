import { useEffect, useState } from 'react'
import KitDrawer from '../../../../kit/components/KitDrawer/KitDrawer'
import KitLoader from '../../../../kit/components/KitLoader/KitLoader'
import KitButton from '../../../../kit/components/KitButton/KitButton'
import KitShow from '../../../../kit/components/KitShow/KitShow'
import { createPortal } from 'react-dom'
import KitIcon from '../../../../kit/components/KitIcon/KitIcon'
import { syncOptions } from '../../../../kit/configs/general'
import KitSelect from '../../../../kit/components/KitSelect'
import { toast } from 'react-toastify'
import { syncCustomers, syncProducts, syncStores } from '../../../../kit/utils/syncOperations'
import useKeyboardShortcuts from '../../../../kit/hooks/useKeyboardShortcuts'
import { useNavigate } from 'react-router-dom'
import { List, ListItemButton, ListItemIcon, ListItemText, Collapse } from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { POS_STORE_ID } from '../../pages/Dashboard'
import ShortcutBadge from './ShortcutBadge'
import KitDeleteDialog from '../../../../kit/components/KitDeleteDialog'
import storage from '../../../../kit/hooks/data/services/storage'
import ManagerUnlockModal from './ManagerUnlockModal'

const MenuDrawer = ({ isOpen, onClose, userData, handleLogout, setIsSyncCustomerLoading, setIsSyncProductLoading, setIsSyncStoreLoading, toggleShortcutModal, setShowSaleReturnModal, loadProducts, loadCustomers, loadStores, buttonText, handleBillForm }) => {
    const navigate = useNavigate();
    const [openSync, setOpenSync] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [showSyncDialog, setShowSyncDialog] = useState(false);
    const [syncType, setSyncType] = useState(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isManagerUnlockModalOpen, setIsManagerUnlockModalOpen] = useState(false);
    const [isClearDbAuthOpen, setIsClearDbAuthOpen] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);

    const toggleDeleteDialog = () => setShowDeleteDialog(!showDeleteDialog);

    // Clear DB is manager-only: ask for the manager + password first, then show the confirm dialog.
    const requestClearDb = () => setIsClearDbAuthOpen(true);

    const handleUnlockInvoice = (path) => {
        setPendingNavigation(path);
        setIsManagerUnlockModalOpen(true);
    };

    const handleCustomerSync = async () => {
        setIsSyncCustomerLoading(true);
        try {
            const result = await syncCustomers();
            await loadCustomers("");
            toast.success(`Customer sync completed.\n\nCustomers: ${result.customers}`);
        } catch (error) {
            toast.error("Unable to sync customer data.");
        } finally {
            setIsSyncCustomerLoading(false);
        }
    };

    const handleProductSync = async () => {
        setIsSyncProductLoading(true);
        try {
            const result = await syncProducts({ storeId: POS_STORE_ID });
            await loadProducts("");
            toast.success(`Sync completed.\n\nProducts: ${result.total}`);
        } catch (error) {
            toast.error("Unable to sync product data.");
        } finally {
            setIsSyncProductLoading(false);
        }
    };

    const handleStoreSync = async () => {
        setIsSyncStoreLoading(true);
        try {
            const result = await syncStores();
            await loadStores();
            toast.success(`Sync completed.\n\nStores: ${result.total}`);
        } catch (error) {
            toast.error("Unable to sync store data.");
        } finally {
            setIsSyncStoreLoading(false);
        }
    };

    const handleSyncClick = (type) => {
        setSyncType(type);
        setShowSyncDialog(true);
    };

    const handleConfirmSync = async () => {
        setShowSyncDialog(false);

        if (syncType === "product") {
            await handleProductSync();
        }

        if (syncType === "customer") {
            await handleCustomerSync();
        }

        if (syncType === "store") {
            await handleStoreSync();
        }

        setSyncType(null);
    };

    const onDelete = async () => {
        setIsLoading(true);
        try {
            if (window.api?.clearLocalDataExceptBills) {
                await window.api.clearLocalDataExceptBills();
            }
            storage.clearAll();
            toast.success("Local data was cleared. Bills are still kept.");
            toggleDeleteDialog();
            handleLogout()
            navigate("/");
        } catch (error) {
            toast.error(error?.message || "Failed to clear local data.");
        } finally {
            setIsLoading(false);
        }
    };

    useKeyboardShortcuts({
        canUsePos: isOpen,
        handleCustomerSync,
        handleProductSync,
        handleStoreSync,
        closeMenuDrawer: onClose,
        handleUnlockInvoice,
    });

    const navigationItems = [
        {
            title: "Synchronization",
            icon: "tabler:refresh",
            shortcut: "",
            expandable: true,
            expanded: openSync,
            action: () => setOpenSync(v => !v),
        },

        ...(openSync
            ? [
                  {
                      title: "Product Sync",
                      icon: "tabler:package",
                      shortcut: "F7",
                      action: () => handleSyncClick("product"),
                  },
                  {
                      title: "Customer Sync",
                      icon: "tabler:users",
                      shortcut: "F8",
                      action: () => handleSyncClick("customer"),
                  },
                  {
                      title: "Store Sync",
                      icon: "tabler:building-store",
                      shortcut: "F9",
                      action: () => handleSyncClick("store"),
                  },
              ]
            : []),
        {
            title: "Keyboard Shortcuts",
            icon: "tabler:info-circle",
            color: "",
            shortcut: "F1",
            action: () => toggleShortcutModal(),
        },
        {
            title: "Sale Return",
            icon: "tabler:arrow-back-up",
            color: "",
            shortcut: "F5",
            action: () => setShowSaleReturnModal(true),
        },
        // {
        //     title: "SRN History",
        //     icon: "tabler:receipt-refund",
        //     color: "",
        //     shortcut: "H",
        //     action: () => navigate("/sale-returns"),
        // },
        {
            title: "Advance Slips",
            icon: "tabler:file-dollar",
            color: "",
            shortcut: "A",
            action: () => navigate("/advance-slips"),
        },
        {
            title: "Invoices",
            icon: "tabler:cash",
            color: "",
            shortcut: "I",
            action: () => handleUnlockInvoice("/collect-payments"),
        },
        {
            title: buttonText === "Day Closed" ? "Day Closed · Print Summary" : buttonText,
            icon: buttonText === "Start Day" ? "tabler:sunrise" : buttonText === "Day Closed" ? "tabler:printer" : "tabler:sunset",
            color: "",
            shortcut: "F6",
            action: () => handleBillForm(),
        },
        {
            title: "Collection Report",
            icon: "tabler:report-analytics",
            color: "",
            shortcut: "R",
            action: () => navigate("/collection-report"),
        },
        {
            title: "Clear DB",
            icon: "tabler:trash-x",
            color: "red",
            shortcut: "Shift + D",
            action: () => requestClearDb(),
        },
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
            if (showSyncDialog) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    handleConfirmSync();
                    return;
                }

                if (e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();

                    setShowSyncDialog(false);
                    setSyncType(null);
                    return;
                }

                return;
            }

            // Typing in the manager popup (e.g. a capital D in the password) must not trigger menu shortcuts.
            if (isClearDbAuthOpen || isManagerUnlockModalOpen) return;

            if (e.shiftKey && e.key.toLowerCase() === "d") {
                e.preventDefault();
                requestClearDb();
                return;
            }

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setActiveIndex(i =>
                        Math.min(i + 1, navigationItems.length - 1)
                    );
                    break;

                case "ArrowUp":
                    e.preventDefault();
                    setActiveIndex(i =>
                        Math.max(i - 1, 0)
                    );
                    break;

                case "Enter":
                    e.preventDefault();
                    const selectedItem = navigationItems[activeIndex];
                    if (selectedItem && !selectedItem.disabled) {
                        handleMenuAction(selectedItem);
                    }
                    break;

                case "Escape":
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, activeIndex, navigationItems]);

    return createPortal(
        <KitDrawer
            isOpen={isOpen}
            onClose={onClose}
            title=''
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
                                        <h2 className="text-lg font-bold text-third">
                                            {userData.firstName}
                                        </h2>
                                        <p className="text-sm text-third-500">
                                            {userData.email}
                                        </p>
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
                                            pl: item.title.includes("Sync") &&
                                                item.title !== "Synchronization"
                                                ? 7
                                                : 2,
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
                                        <ListItemText primary={<span className={`text-${item.color}-600` || ""}>{item.title}</span>} />
                                        {item.shortcut && (
                                            <ShortcutBadge shortcut={item.shortcut} className={`static ml-auto ${`text-${item.color}-600 bg-${item.color}-100!` || ""}`} />
                                        )}
                                        {item.expandable && (item.expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
                                    </ListItemButton>
                                ))}
                            </List>
                        </div>
                        <div className='px-6 py-3 z-10 bg-reverse sticky bottom-0 left-0 right-0'>
                            <div className="relative">
                                <ShortcutBadge shortcut="L" />
                                <KitButton
                                    variant='contained'
                                    type='submit'
                                    color="error"
                                    className='w-full'
                                    startIcon={<KitIcon icon="tabler:logout" />}
                                    onClick={handleLogout}
                                >
                                    Logout
                                </KitButton>
                            </div>
                        </div>
                    </div>

                    <KitShow show={showSyncDialog}>
                        <KitDeleteDialog
                            isOpen={showSyncDialog}
                            onClose={() => {
                                setShowSyncDialog(false);
                                setSyncType(null);
                            }}
                            title={`Sync ${syncType === "product"
                                ? "Products"
                                : syncType === "customer"
                                    ? "Customers" : "Stores"
                            }`}
                            subTitle={`Are you sure you want to sync ${syncType === "product"
                                ? "products"
                                : syncType === "customer"
                                    ? "customers"
                                    : "stores"
                            }?`}
                            onDelete={handleConfirmSync}
                            isBtnLoading={false}
                        />
                    </KitShow>

                    <KitShow show={showDeleteDialog}>
                        <KitDeleteDialog
                            isOpen={showDeleteDialog}
                            onClose={toggleDeleteDialog}
                            title="Clear Local Data"
                            subTitle="All local data except bills will be deleted. You will need to sync Products, Customers, and Stores again after this. Do you want to continue?"
                            onDelete={onDelete}
                            isBtnLoading={isLoading}
                        />
                    </KitShow>

                    <KitShow show={isClearDbAuthOpen}>
                        <ManagerUnlockModal
                            isOpen={isClearDbAuthOpen}
                            onClose={() => setIsClearDbAuthOpen(false)}
                            title="Manager Authentication — Clear DB"
                            infoText="Clearing local data needs manager approval. Select the manager and enter the password."
                            confirmText="Verify & Continue"
                            successMessage="Manager verified."
                            severity="warning"
                            onSuccess={() => {
                                setIsClearDbAuthOpen(false);
                                setShowDeleteDialog(true);
                            }}
                        />
                    </KitShow>

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
    )
}

export default MenuDrawer