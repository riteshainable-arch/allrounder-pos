import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Chip, Divider, IconButton, Paper, Rating, Switch, Tooltip, Typography, useTheme } from "@mui/material";
import KitDataGrid from "../../../../kit/components/KitDataGrid/KitDataGrid";
import KitSelect from "../../../../kit/components/KitSelect";
import NumberSpinner from "../../../../kit/components/KitNumberSpinner";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import { priceFinalAmountFormat, priceFormat, roundToDecimals, roundToWholeRupee } from "../../../../kit/utils/priceFormat";
import { EllipsisText } from "../../../../kit/utils/ellipsisText";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import { components } from "react-select";
import PlaceholderImage from "../../../../../resources/image_palceholder.png";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import { Menubar, MenuPopup, MenuPortal, MenuPositioner, MenuRoot, MenuSeparator, MenuItem, MenuTrigger } from "../../../../kit/components/KitMenuGroupLabel/KitMenuGroupLabel";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import storage from "../../../../kit/hooks/data/services/storage";
import { uploadInvoiceToServer } from "../../../../kit/utils/syncOperations";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import KitCreatableSelect from "../../../../kit/components/KitCreatableSelect";
import { useNavigate } from "react-router-dom";
import KOTPrintModal from "../../components/Dashboard/KOTPrintModal";
import KitShow from "../../../../kit/components/KitShow/KitShow";
import { toast } from "react-toastify";
import { offerTypes } from "../../../../kit/configs/general";
import KitDeleteDialog from "../../../../kit/components/KitDeleteDialog";
import { format, formatDistanceToNow } from "date-fns";
import { ProductOption } from "../../components/Dashboard/ProductOption";
import { applyBuyXGetY, applyBuyXGetYChoice, applyComboOffer, applyDiscountOffer, applyFOCOffer, updateNormalRow } from "../../../../kit/helper/applyOffer";
import OfferChoiceModal from "../../components/Dashboard/OfferChoiceModal";
import { parseOfferRatio } from "../../../../kit/utils/offers";
import ComboOfferModal from "../../components/Dashboard/ComboOfferModal";
import FOCOfferModal from "../../components/Dashboard/FOCOfferModal";
import useKeyboardShortcuts from "../../../../kit/hooks/useKeyboardShortcuts";
import CashierFunctionsInfoModal from "../../components/Dashboard/CashierFunctionsInfoModal";
import KitLineLoader from "../../../../kit/components/KitLineLoader";
import useUser from "../../../../kit/hooks/useUser";
import PaymentCollectionModal, { buildEvaluateCouponItems } from "../../components/Dashboard/PaymentCollectionModal";
import { useGlobalCouponEvaluate } from "../../../../kit/hooks/data/globalCoupon";
import SaleReturnModal from "../../components/SaleReturn/SaleReturnModal";
import StartDayScreen from "../../components/Dashboard/StartDayScreen";
import { useDaySessionContext } from "../../../../kit/hooks/DaySessionProvider";
import { DAY_STATUS, getLocalDayStatus, getTodayDate } from "../../../../kit/utils/daySession";
import { useGetOneLastOrderNumber } from "../../../../kit/hooks/data/lastOrderNumber";
import useOnlineStatus from "../../../../kit/hooks/useOnlineStatus";
import useLoyaltyCart from "../../../../kit/hooks/useLoyaltyCart";
import { isLoyaltyRedeemRejected, getApiErrorMessage } from "../../../../kit/hooks/data/loyalty";
import { mergeServerLoyaltyBill } from "../../../../kit/utils/loyalty";
import LoyaltyRewardPanel from "../../components/Dashboard/LoyaltyRewardPanel";
import LoyaltyRewardModal from "../../components/Dashboard/LoyaltyRewardModal";
import { WheelCouponBadge } from "../../components/Dashboard/WheelCouponPanel";
import WheelTicketModal from "../../components/Dashboard/WheelTicketModal";
import MenuDrawer from "../../components/Dashboard/MenuDrawer";
import { useCashierLogs } from "../../../../kit/hooks/data/cashierLog";
import { useAutoSyncContext } from "../../../../kit/hooks/AutoSyncProvider";
import { getLoggedInCashier } from "../../../../kit/utils/cashierBills";
import BillFormModal from "../../components/collectPayment/BillFormModal";
import DayBillPrintModal from "../../components/collectPayment/DayBillPrintModal";
import SettlementSlipModal from "../../components/collectPayment/SettlementSlipModal";
import ShortcutBadge from "../../components/Dashboard/ShortcutBadge";
import { useGetLastOrderStats } from "../../../../kit/hooks/data/lastOrderStats";
import RemarkModal from "../../components/Dashboard/RemarkModal";
import ProductFilterModal from "../../components/Dashboard/ProductFilterModal";
import WarningModal from "../../components/Dashboard/WarningModal";
import HoldModal from "../../components/Dashboard/HoldModal";
import WarningBarcodeModal from "../../components/Dashboard/WarningBarCodeModal";
import PriceLayerModal from "../../components/Dashboard/PriceLayerModal";
import { getProductBarcodes } from "../../../../kit/utils/productBarcodes";
import { logPosError } from "../../../../kit/utils/errorLogger";

const formSchema = yup.object({
    name: yup.string().trim().required("Customer name is required"),
    phone: yup
        .string()
        .required("Phone number is required")
        .matches(/^\d+$/, "Phone number contain only digits")
        .length(10, "Phone number must be 10 digits"),
    gstNumber: yup
        .string()
        .trim()
        .when("gstCustomersOnly", {
            is: true,
            then: (schema) => schema.required("GST number is required"),
            otherwise: (schema) => schema.notRequired(),
        }),
});

export const POS_STORE_ID = 1;
const HOLD_BILL_STORAGE_KEY = "dashboardHoldBills";

// Weighing-scale label prints the product barcode and the weight as `barcode-qty`, e.g. 890556-1.068.
const SCALE_LABEL_PATTERN = /^(\d+)-(\d+(?:\.\d+)?)$/;

const roundQty = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.round(parsed * 1000) / 1000;
};

const parseScaleLabel = (value) => {
    const match = String(value || "").trim().match(SCALE_LABEL_PATTERN);
    if (!match) return null;
    const qty = roundQty(match[2]);
    if (!(qty > 0)) return null;
    return { code: match[1], qty };
};

const isLooseQty = (value) => {
    const qty = roundQty(value);
    return qty > 0 && Math.abs(qty - Math.round(qty)) > 0.0001;
};

const blurOnEscape = (event, inputRef) => {
    if (event.key !== "Escape") return false;

    event.preventDefault();
    event.stopPropagation();
    window.setTimeout(() => inputRef.current?.blur?.(), 0);
    return true;
};

export default function Dashboard() {
    const theme = useTheme();
    const isOnline = useOnlineStatus();
    const navigate = useNavigate();
    const customerNumberRef = useRef(null);
    const customerNameRef = useRef(null);
    const focusCustomerNumberAfterBillRef = useRef(false);
    const productSearchRef = useRef(null);
    const productSearchContainerRef = useRef(null);
    const quantityInputRefs = useRef(new Map());
    const barcodeSearchRef = useRef(null);
    const barcodeSearchTimerRef = useRef(null);
    const productSearchInputRef = useRef("");
    const productSearchRequestRef = useRef(0);
    const barcodeLookupInProgressRef = useRef(false);
    const barcodeScanSequenceRef = useRef({ digits: "", lastKeyAt: 0, startedAt: 0 });
    const lastBarcodeScanAtRef = useRef(0);
    const resolveScannedBarcodeRef = useRef(null);
    const gstNumberRef = useRef(null);
    const holdBillSelectRef = useRef(null);
    const customerSelectionModeRef = useRef(null);
    const userData = useUser();
    const cartStorageKey = `dashboardCartRows:${userData?.userId || userData?.id || userData?.email || "default"}`;
    const { dayAccess, dayBills, refreshDayAccess } = useDaySessionContext();
    const loggedInCashier = getLoggedInCashier(userData);
    const { triggerEndDaySync } = useAutoSyncContext();

    const [cartRows, setCartRows] = useState(() => {
        const savedCartRows = storage.getItem(cartStorageKey);
        return Array.isArray(savedCartRows) ? savedCartRows : [];
    });
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [rating, setRating] = useState(0);
    const [isSavingBillLoading, setIsSavingBillLoading] = useState(false);
    const [productsList, setProductsList] = useState([]);
    const [stores, setStores] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [productSearchInput, setProductSearchInput] = useState("");
    const [barcodeSearchInput, setBarcodeSearchInput] = useState("");
    const [unavailableBarcode, setUnavailableBarcode] = useState("");
    const [scanEnabled, setScanEnabled] = useState(false);
    const [selectedItems, setSelectedItems] = useState("");
    const [isKOTModalOpen, setIsKOTModalOpen] = useState(false);
    const [isAutoPrintingInvoice, setIsAutoPrintingInvoice] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showBillConfirmation, setShowBillConfirmation] = useState(false);
    const [pendingBillData, setPendingBillData] = useState(null);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [customerProfiles, setCustomerProfiles] = useState([]);
    const [isSyncProductLoading, setIsSyncProductLoading] = useState(false);
    const [isSyncCustomerLoading, setIsSyncCustomerLoading] = useState(false);
    const [isSyncStoreLoading, setIsSyncStoreLoading] = useState(false);
    const [showShortcutModal, setShowShortcutModal] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [showBuyWithoutOffer, setShowBuyWithoutOffer] = useState(true);
    const [offerChoiceOpen, setOfferChoiceOpen] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [pendingProduct, setPendingProduct] = useState(null);
    const [pendingQty, setPendingQty] = useState(0);
    const [comboOfferOpen, setComboOfferOpen] = useState(false);
    const [focOfferOpen, setFocOfferOpen] = useState(false);
    const [showMenuDrawer, setShowMenuDrawer] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    // Offers (schemes) picked in the Collect Payment popup. Kept here so they stay on the bill when the popup
    // is closed and come back when it is opened again.
    const [appliedSchemes, setAppliedSchemes] = useState([]);
    // Loyalty reward items (free products taken for loyalty points) popup.
    const [showRewardModal, setShowRewardModal] = useState(false);
    // Wheel coupon bill: ticket + coupon picked on this screen, applied when Collect Payment opens.
    const [showWheelTicket, setShowWheelTicket] = useState(false);
    const [wheelSelection, setWheelSelection] = useState(null);
    const [showSaleReturnModal, setShowSaleReturnModal] = useState(false);
    const [showStartDayModal, setShowStartDayModal] = useState(false);
    const [buttonText, setButtonText] = useState("Start Day");
    const [isBillFormModalOpen, setIsBillFormModalOpen] = useState(false);
    const [dayBillToPrint, setDayBillToPrint] = useState(null);
    const [isDayBillPrintModalOpen, setIsDayBillPrintModalOpen] = useState(false);
    const [settlementSlip, setSettlementSlip] = useState(null);
    const endDayPendingRef = useRef(false);
    const [showRemarkDialog, setShowRemarkDialog] = useState(false);
    const [remark, setRemark] = useState("");
    const [customerId, setCustomerId] = useState(null);
    const [showProductFilterModal, setShowProductFilterModal] = useState(false);
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [warningProduct, setWarningProduct] = useState(null);
    const [isPriceLayerModalOpen, setIsPriceLayerModalOpen] = useState(false);
    const [pendingPriceLayerProduct, setPendingPriceLayerProduct] = useState(null);
    const [selectedPriceLayerId, setSelectedPriceLayerId] = useState("");
    const [gstCustomersOnly, setGstCustomersOnly] = useState(false);
    const [holdBills, setHoldBills] = useState(() => {
        const savedHolds = storage.getItem(HOLD_BILL_STORAGE_KEY);
        return Array.isArray(savedHolds) ? savedHolds : [];
    });
    const [selectedHoldBill, setSelectedHoldBill] = useState(null);
    const [showAddHoldDialog, setShowAddHoldDialog] = useState(false);

    useEffect(() => {
        if (cartRows.length === 0) {
            storage.removeItem(cartStorageKey);
            return;
        }
        storage.setItem(cartStorageKey, cartRows);
    }, [cartRows, cartStorageKey]);

    useEffect(() => {
        storage.setItem(HOLD_BILL_STORAGE_KEY, holdBills);
    }, [holdBills]);

    const queryParams = {
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: format(new Date(), "yyyy-MM-dd"),
        page: 1,
        limit: 50,
        userId: userData?.userId,
    };

    const { lastOrderNumber, isLastOrderNumberLoading } = useGetOneLastOrderNumber();
    const { cashierLogs, isCashierLogsLoading, refreshCashierLogs } = useCashierLogs(queryParams);
    const { lastOrderStats, isLastOrderStatsLoading, lastOrderStatsError } = useGetLastOrderStats(customerId, Boolean(customerId));

    const requireDayStarted = () => {
        if (dayAccess.canUsePos) return true;

        toast.warning(
            dayAccess.status === DAY_STATUS.ENDED
                ? "Today's day is closed. You cannot generate new bills."
                : "Please start your day before taking orders."
        );
        return false;
    };

    const posStore = useMemo(() => {
        return stores.find(
            store => Number(store.id) === POS_STORE_ID
        );
    }, [stores]);

    const defaultValues = {
        name: "",
        phone: "",
        gstCustomersOnly: false,
    };

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        reset,
        getValues,
        formState: { errors },
    } = useForm({
        defaultValues,
        mode: "all",
        resolver: yupResolver(formSchema),
    });
    const phone = watch("phone");
    const customerName = watch("name");

    // The ticket belongs to one customer and one bill: drop the selection when the bill is cleared or the customer changes.
    useEffect(() => {
        if (!wheelSelection) return;
        if (cartRows.length === 0 || String(phone || "").trim() !== wheelSelection.phone) {
            setWheelSelection(null);
        }
    }, [cartRows.length, phone, wheelSelection]);

    // const selectedCustomerProfile = customerProfiles.find(
    //     (item) => item.customer.phone === phone
    // );

    const selectedCustomerProfile = customerProfiles.find(
        (item) => item.phone === phone
    );

    const isNewCustomer = !!phone && !selectedCustomerProfile;

    const productOptions = useMemo(() => {
        return (
            productsList?.map((product) => ({
                label: product.productName || "",
                value: String(product.id),
                obj: product,
            })) || []
        );
    }, [productsList]);

    // const customerOptions = useMemo(
    //     () =>
    //         customerProfiles?.map((customer) => ({
    //             label: `${customer.customer.phone}`,
    //             value: customer.customer.id ?? "",
    //             name: `${customer.customer.firstName ?? ""} ${customer.customer.lastName ?? ""}`.trim(),
    //         })) ?? [],
    //     [customerProfiles]
    // );

    const customerOptions = useMemo(
        () =>
            customerProfiles?.map((customer) => ({
                label: `${customer.phone}`,
                value: customer.id ?? "",
                name: `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim(),
                gstNumber: customer.gstNumber,
            })) ?? [],
        [customerProfiles]
    );

    const gstCustomerOptions = useMemo(
    () =>
        customerProfiles.map((customer) => ({
                label: customer.gstNumber ?? "",
                value: customer.id ?? "",
                name: `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim(),
                phone: customer.phone ?? "",
                gstNumber: customer.gstNumber ?? "",
                obj: customer,
            })) ?? [],
       [customerProfiles]
      );

    const holdBillOptions = useMemo(
        () =>
            holdBills.map((hold) => ({
                label: hold.name,
                value: hold.id,
            })) ?? [],
        [holdBills]
    );

    const toggleLogoutDialog = () => setShowLogoutDialog(!showLogoutDialog);
    const toggleDeleteDialog = () => setShowDeleteDialog(!showDeleteDialog);
    const toggleOfferChoiceModal = () => setOfferChoiceOpen(!offerChoiceOpen);
    const toggleComboModal = () => setComboOfferOpen(!comboOfferOpen);
    const toggleFOCModal = () => setFocOfferOpen(!focOfferOpen);
    const toggleShortcutModal = () => setShowShortcutModal(!showShortcutModal);
    const togglePaymentModal = () => setShowPaymentModal(!showPaymentModal);
    const toggleMenuDrawer = () => setShowMenuDrawer((isOpen) => !isOpen);
    const toggleBillFormModal = () => setIsBillFormModalOpen(!isBillFormModalOpen);
    const toggleRemarkModal = () => setShowRemarkDialog(!showRemarkDialog);
    const toggleProductFilterModal = () => setShowProductFilterModal(!showProductFilterModal);
    const toggleWarningModal = () => setIsWarningModalOpen(!isWarningModalOpen);

    const onLogout = () => {
        storage.removeItem("token");
        storage.removeItem("userData");
        toggleLogoutDialog();
        navigate("/");
    };

    const handleLogout = () => {
        toggleLogoutDialog();
    };    
    
    const closePriceLayerModal = () => {
        setIsPriceLayerModalOpen(false);
        setPendingPriceLayerProduct(null);
        setSelectedPriceLayerId("");
    };

    const savePriceLayerSelection = (selectedLayer) => {
        const pendingSelection = pendingPriceLayerProduct;
        if (!pendingSelection || !selectedLayer) {
            toast.error("Unable to find the selected sale price. Please select it again.");
            return;
        }

        closePriceLayerModal();
        handleProductSelect(pendingSelection.product, selectedLayer, pendingSelection.addQty ?? 1);
    };
    const toggleAddHoldModal = () => setShowAddHoldDialog(!showAddHoldDialog);

    const handleSaveHoldBill = (holdName) => {
        const trimmedName = holdName.trim();
        if (!trimmedName) return;

        const payload = {
            id: String(Date.now()),
            name: trimmedName,
            createdAt: new Date().toISOString(),
            cartRows: cartRows.map((row) => ({ ...row })),
            customerName: getValues("name") || "",
            phone: getValues("phone") || "",
            gstNumber: getValues("gstNumber") || "",
            remark,
            rating,
            customerId,
        };

        setHoldBills((prev) => {
            const filtered = prev.filter((item) => item.name !== trimmedName);
            return [payload, ...filtered];
        });

        setSelectedHoldBill(null);
        setCartRows([]);
        storage.removeItem(cartStorageKey);
        reset({
            name: "",
            phone: "",
            gstNumber: "",
            gstCustomersOnly: false,
        });
        setCustomerId(null);
        setGstCustomersOnly(false);
        setRemark("");
        setRating(0);
        setSelectedProduct(null);
        setSelectedRow(null);
        setInputValue("");
        setProductSearchInput("");
        setBarcodeSearchInput("");
        resetRedeem();
        setShowAddHoldDialog(false);
        toast.success("Hold bill saved. Ready for a new bill.");
    };

    const handleRestoreHoldBill = (option) => {
        if (!option) {
            setSelectedHoldBill(null);
            setCartRows([]);
            storage.removeItem(cartStorageKey);

            reset({
                name: "",
                phone: "",
                gstNumber: "",
                gstCustomersOnly: false,
            });

            setCustomerId(null);
            setGstCustomersOnly(false);
            setRemark("");
            setRating(0);
            setSelectedProduct(null);
            setSelectedRow(null);
            setInputValue("");
            setProductSearchInput("");
            setBarcodeSearchInput("");
            resetRedeem();

            return;
        }

        const hold = holdBills.find((item) => item.id === option.value);
        if (!hold) return;

        setSelectedHoldBill(option.value);
        setCartRows(Array.isArray(hold.cartRows) ? hold.cartRows : []);
        setCustomerId(hold.customerId ?? null);
        reset({
            name: hold.customerName ?? "",
            phone: hold.phone ?? "",
            gstNumber: hold.gstNumber ?? "",
            gstCustomersOnly: Boolean(hold.gstNumber),
        });
        setRemark(hold.remark ?? "");
        setRating(Number(hold.rating) || 0);
        setGstCustomersOnly(Boolean(hold.gstNumber));
        setInputValue("");
    };    

    const handleAddHold = () => {
        if (cartRows.length === 0) return;
        toggleAddHoldModal();
    };

    const handleProductFilter = () => {
        toggleProductFilterModal();
    };

    const handleKOTPrint = (item, autoPrint = false) => {
        setSelectedItems(item);
        setIsAutoPrintingInvoice(autoPrint);
        setIsKOTModalOpen(true);
    };

    // Selecting an ITEM_PRICE offer in the payment screen adds the scheme item to the bill by itself
    // (the item does not have to be scanned first). Rows added this way carry `schemeAdds`
    // so they can be swapped / removed when the cashier changes or clears the offer.
    // Returns the full cart that the scheme should be evaluated against.
    // `selections` = [{ schemeId, autoAddItems }] for every selected offer (several offers can apply to one bill);
    // an empty list takes every offer item back.
    // Wheel coupon bill: make sure the prize item is on the bill (adds 1 unit when missing).
    // Returns the cart rows to evaluate the coupon against (state updates are async).
    const handleEnsureWheelItem = async (wheelItem) => {
        const code = String(wheelItem?.itemCode ?? "").trim().toLowerCase();
        if (!code) return cartRows;
        const matches = (product) =>
            String(product.itemCode ?? product.productCode ?? "").trim().toLowerCase() === code;
        if (cartRows.some((row) => !row.isOfferItem && matches(row))) return cartRows;

        let product = productsList.find(matches);
        // The local product search works on name / barcode, so try the item code and the name.
        for (const query of [wheelItem.itemCode, wheelItem.itemName]) {
            if (product || !query) continue;
            try {
                const found = await window.api.getProducts(String(query));
                product = (found || []).find(matches);
            } catch (error) {
                product = null;
            }
        }
        if (!product) {
            toast.error(`Wheel item ${wheelItem.itemName || wheelItem.itemCode} was not found in this store's stock.`);
            return cartRows;
        }
        const nextRows = updateNormalRow(cartRows, product, 1);
        setCartRows(nextRows);
        return nextRows;
    };

    // Cashier picked the wheel coupon (customer number + ticket verified): put the prize item on the bill and
    // remember the ticket + coupon. Collect Payment applies them.
    const handleWheelPick = async ({ coupon, ticketNo }) => {
        setShowWheelTicket(false);
        const codes = new Set((coupon?.itemCodes || []).map((code) => String(code).trim().toLowerCase()));
        const inCart = cartRows.some(
            (row) => !row.isOfferItem && codes.has(String(row.itemCode ?? row.productCode ?? "").trim().toLowerCase())
        );
        if (!inCart && coupon?.items?.[0]) await handleEnsureWheelItem(coupon.items[0]);
        setWheelSelection({
            ticketNo,
            couponCode: coupon.code,
            couponName: coupon.name,
            phone: String(phone || "").trim(),
        });
        toast.success(`Wheel coupon ${coupon.code} selected for ticket ${ticketNo}. Press Collect Payment.`);
    };

    // Loyalty reward items: products the customer takes FREE for loyalty points. They live in the cart as free rows
    // (price 0, `isLoyaltyReward`) so the list, stock and bill show them; the points are deducted by the server
    // when the bill is generated. `selections` = [{ reward, qty }] replaces every reward row on the bill.
    const handleApplyRewards = async (selections = []) => {
        setShowRewardModal(false);
        const rows = [];
        for (const { reward, qty } of selections) {
            const code = String(reward.itemCode ?? "").trim().toLowerCase();
            const matches = (product) =>
                String(product.itemCode ?? product.productCode ?? "").trim().toLowerCase() === code;
            let product = productsList.find(matches);
            for (const query of [reward.itemCode, reward.itemName]) {
                if (product || !query) continue;
                try {
                    const found = await window.api.getProducts(String(query));
                    product = (found || []).find(matches);
                } catch (error) {
                    product = null;
                }
            }
            if (!product) {
                toast.error(`Reward item ${reward.itemName || reward.itemCode} was not found in this store's stock.`);
                continue;
            }
            const stock = Number(product.stockQty ?? product.stock);
            if (Number.isFinite(stock) && stock < qty) {
                toast.error(`Only ${stock} of ${reward.itemName || reward.itemCode} in stock.`);
                continue;
            }
            rows.push({
                ...product,
                id: `${product.id}-loyalty-${reward.id}`,
                quantity: qty,
                price: 0,
                salePrice: 0,
                latestSalePrice: 0,
                bkdAmount: 0,
                totalPrice: 0,
                offers: [],
                isOfferItem: true,
                isLoyaltyReward: true,
                rewardId: reward.id,
                rewardPointsPerUnit: Number(reward.pointsRequired) || 0,
                rewardPhone: String(phone || "").trim(),
            });
        }
        setCartRows((prev) => [...prev.filter((row) => !row.isLoyaltyReward), ...rows]);
        if (rows.length) {
            const points = rows.reduce((sum, row) => sum + row.rewardPointsPerUnit * row.quantity, 0);
            toast.success(`Reward items added free (${Math.round(points * 1000) / 1000} loyalty points).`);
        }
    };

    // Points belong to one customer: a reward row is dropped when the bill's customer number changes.
    useEffect(() => {
        const current = String(phone || "").trim();
        setCartRows((prev) =>
            prev.some((row) => row.isLoyaltyReward && row.rewardPhone !== current)
                ? prev.filter((row) => !row.isLoyaltyReward || row.rewardPhone === current)
                : prev
        );
    }, [phone]);

    // Offers drop out together with the bill: once the cart is empty (bill saved, held, cleared) nothing is applied.
    useEffect(() => {
        if (!cartRows.length && appliedSchemes.length) setAppliedSchemes([]);
    }, [cartRows.length, appliedSchemes.length]);

    // An item offer stays applied only while its item is on the bill: take the item off the list and the offer goes
    // with it, so Collect Payment does not bring it back. Bill discounts have no row and stay.
    useEffect(() => {
        if (!appliedSchemes.length) return;
        const onBill = new Set();
        cartRows.forEach((row) => Object.keys(row.schemeAdds || {}).forEach((id) => onBill.add(String(id))));
        const stillApplied = appliedSchemes.filter(
            (scheme) => scheme?.schemeType === "BILL_DISCOUNT" || onBill.has(String(scheme.id))
        );
        if (stillApplied.length !== appliedSchemes.length) setAppliedSchemes(stillApplied);
    }, [cartRows, appliedSchemes]);

    // What the applied offers give on the current bill, so the billing screen shows the offer price per row and the
    // net payable after the offers (Collect Payment evaluates the same thing again before the bill is saved).
    const { globalCouponEvaluate } = useGlobalCouponEvaluate();
    const [schemePreviewState, setSchemePreviewState] = useState(null);
    const appliedSchemeIdsKey = appliedSchemes.map((scheme) => Number(scheme.id)).join(",");
    const cartSignature = JSON.stringify(
        cartRows.map((row) => [row.id, row.quantity, row.price, row.isOfferItem ? 1 : 0])
    );
    useEffect(() => {
        if (!appliedSchemeIdsKey || !cartRows.length) return undefined;
        let isActive = true;
        const timer = setTimeout(async () => {
            try {
                const response = await globalCouponEvaluate({
                    storeId: POS_STORE_ID,
                    cartItems: buildEvaluateCouponItems(cartRows),
                    ...(phone && { customerPhone: phone }),
                    schemeIds: appliedSchemeIdsKey.split(",").map(Number),
                    date: format(new Date(), "yyyy-MM-dd"),
                });
                if (!isActive) return;
                const data = response?.data ?? {};
                const byCode = {};
                (data.cartItems || [])
                    .filter((line) => line.isBillingSchemeItem)
                    .forEach((line) => {
                        const code = String(line.itemCode ?? line.productCode ?? "").trim().toLowerCase();
                        const qty = Number(line.quantity ?? line.qty) || 0;
                        const discount = Number(line.offerDiscountAmount) || 0;
                        const entry = byCode[code] || { qty: 0, discount: 0, original: 0 };
                        entry.qty += qty;
                        entry.discount += discount;
                        entry.original = Number(line.originalSalePrice) || entry.original;
                        byCode[code] = entry;
                    });
                Object.values(byCode).forEach((entry) => {
                    entry.unitPrice = entry.qty > 0 ? roundToDecimals(entry.original - entry.discount / entry.qty) : entry.original;
                });
                setSchemePreviewState({ discount: Number(data.totalSchemeDiscount) || 0, byCode });
            } catch (error) {
                if (isActive) setSchemePreviewState(null);
            }
        }, 300);
        return () => {
            isActive = false;
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedSchemeIdsKey, cartSignature, phone]);
    const schemePreview = appliedSchemeIdsKey && cartRows.length ? schemePreviewState : null;
    const schemeDiscountOnScreen = Number(schemePreview?.discount || 0);
    const schemeInfoOf = (row) =>
        row.isOfferItem
            ? null
            : schemePreview?.byCode?.[String(row.itemCode ?? row.productCode ?? "").trim().toLowerCase()] || null;

    // item code -> names of the applied item offers, to tag the matching rows in the bill list.
    const schemeNamesByItemCode = useMemo(() => {
        const map = new Map();
        appliedSchemes
            .filter((scheme) => scheme?.schemeType !== "BILL_DISCOUNT")
            .forEach((scheme) => {
                (scheme.items || []).forEach((item) => {
                    const code = String(item.itemCode ?? "").trim().toLowerCase();
                    if (!code) return;
                    map.set(code, [...(map.get(code) || []), scheme.schemeName || scheme.schemeCode || "Scheme"]);
                });
            });
        return map;
    }, [appliedSchemes]);

    // A row an offer put on the bill carries `schemeAdds` = { [schemeId]: quantity that offer added } (one row can serve
    // several offers) and `schemeBaseQty` = what the cashier had scanned before (0 = the offer created the row).
    // Taking the offers back restores the scanned quantity, or removes the row the offer created.
    const clearSchemeRows = (rows, keepStale = false) =>
        rows.flatMap((row) => {
            if (!row.schemeAdds) return [row];
            const { schemeAdds: _adds, schemeBaseQty: _base, ...rest } = row;
            if (Number(row.schemeBaseQty) > 0) return [{ ...rest, quantity: row.schemeBaseQty }];
            // Stale rows keep their place in the list while the offers are put back; the ones nobody claims are dropped.
            return keepStale ? [{ ...rest, schemeStale: true }] : [];
        });

    const handleSyncSchemeItems = async (selections = []) => {
        const wanted = (Array.isArray(selections) ? selections : []).filter((selection) => selection?.schemeId);

        if (!wanted.length) {
            // Functional update so a late call (e.g. modal closing after the bill was saved) can't bring back a cleared cart.
            setCartRows((prev) => (prev.some((row) => row.schemeAdds) ? clearSchemeRows(prev) : prev));
            return clearSchemeRows(cartRows);
        }

        // Start from the bill without what the offers added before, then put every picked offer item (with the
        // quantity picked in the offers popup) back.
        let nextRows = clearSchemeRows(cartRows, true);

        for (const { schemeId, autoAddItems = [] } of wanted) {
            for (const schemeItem of autoAddItems) {
                const code = String(schemeItem.itemCode ?? "").trim().toLowerCase();
                const barcode = String(schemeItem.barcode ?? "").trim().toLowerCase();
                const matches = (product) =>
                    (code && String(product.itemCode ?? product.productCode ?? "").trim().toLowerCase() === code) ||
                    (barcode && getProductBarcodes(product).includes(barcode));
                const qty = Math.max(1, Number(schemeItem.qty) || 1);

                const existingRow = nextRows.find((row) => !row.isOfferItem && matches(row));
                if (existingRow) {
                    const { schemeStale: _stale, ...cleanRow } = existingRow;
                    const isStale = Boolean(existingRow.schemeStale);
                    // Scanned by the cashier: the offer needs its own quantity on top of it. A row an offer created
                    // (or another offer's row) just gets this offer's quantity added.
                    const currentQty = isStale ? 0 : Number(existingRow.quantity) || 0;
                    const baseQty = isStale ? 0 : existingRow.schemeAdds ? Number(existingRow.schemeBaseQty) || 0 : currentQty;
                    nextRows = nextRows.map((row) =>
                        row === existingRow
                            ? {
                                  ...cleanRow,
                                  quantity: currentQty + qty,
                                  schemeAdds: { ...(isStale ? {} : existingRow.schemeAdds || {}), [schemeId]: qty },
                                  schemeBaseQty: baseQty,
                              }
                            : row
                    );
                    continue;
                }

                let product = [...cartRows, ...productsList].find(matches);
                for (const query of [schemeItem.barcode, schemeItem.itemCode, schemeItem.itemName]) {
                    if (product || !query) continue;
                    try {
                        const found = await window.api.getProducts(String(query));
                        product = (found || []).find(matches);
                    } catch (error) {
                        product = null;
                    }
                }

                if (!product) {
                    toast.error(`Scheme item ${schemeItem.itemName || schemeItem.itemCode} was not found in this store's stock.`);
                    continue;
                }

                const allowedLayerIds = (schemeItem.selectedPriceLayerIds || []).map(String);
                const layer = Array.isArray(product.priceLayers)
                    ? product.priceLayers.find(
                        (l) => l.isActive !== false && allowedLayerIds.includes(String(l.id))
                    )
                    : null;
                const baseProduct = layer
                    ? {
                        ...product,
                        price: layer.salePrice,
                        salePrice: layer.salePrice,
                        latestSalePrice: layer.salePrice,
                        bkdAmount: layer.salePrice,
                        latestMRP: layer.mrp ?? product.latestMRP,
                        mrp: layer.mrp ?? product.mrp,
                        inventoryPriceLayerId: layer.id ?? null,
                    }
                    : product;

                nextRows = updateNormalRow(nextRows, baseProduct, qty).map((row) =>
                    String(row.id) === String(baseProduct.id) && !row.isOfferItem
                        ? { ...row, schemeAdds: { [schemeId]: qty }, schemeBaseQty: 0 }
                        : row
                );
            }
        }

        nextRows = nextRows.filter((row) => !row.schemeStale);
        setCartRows(nextRows);
        return nextRows;
    };

    const handleProductSelect = (productArg, selectedPriceLayer = null, addQty = 1) => {
        if (!productArg) return;
        if (!requireDayStarted()) return;

        const extraQty = roundQty(addQty) > 0 ? roundQty(addQty) : 1;
        let product = productArg.loose || isLooseQty(extraQty) ? { ...productArg, loose: true } : productArg;

        const stockPriceLayers = Array.isArray(product.priceLayers)
            ? product.priceLayers.filter(
                (layer) => layer.isActive !== false && Number.isFinite(Number(layer.salePrice))
            )
            : [];
        // Other MRPs of the item (BUSY purchases / manual) that have no stock layer: offered next to the stock layers.
        const fallbackSalePrice = Number(product.latestSalePrice ?? product.salePrice);
        const optionLayers = Array.isArray(product.priceOptions)
            ? product.priceOptions
                .filter((option) => Number(option?.mrp) > 0)
                .map((option) => ({
                    id: `opt-${option.id}`,
                    inventoryId: product.inventoryId,
                    itemCode: product.itemCode,
                    storeId: product.storeId,
                    mrp: Number(option.mrp),
                    salePrice:
                        option.salePrice != null && Number(option.salePrice) > 0
                            ? Number(option.salePrice)
                            : fallbackSalePrice,
                    purchasePrice: 0,
                    stockQty: null,
                    isActive: true,
                    sourceType: "PRICE_OPTION",
                    isPriceOption: true,
                    isDefault: !!option.isDefault,
                }))
                .filter((layer) => Number.isFinite(Number(layer.salePrice)))
            : [];
        const activePriceLayers = [...stockPriceLayers, ...optionLayers];

        if (product.mrpWise !== false && !selectedPriceLayer && activePriceLayers.length > 1) {
            const currentLayer = activePriceLayers.find(
                (layer) => String(layer.id) === String(product.inventoryPriceLayerId)
            );
            const initialLayer = currentLayer || activePriceLayers[0];
            const initialLayerIndex = activePriceLayers.indexOf(initialLayer);

            setPendingPriceLayerProduct({ product, priceLayers: activePriceLayers, addQty: extraQty });
            setSelectedPriceLayerId(String(initialLayer.id ?? initialLayerIndex));
            setIsPriceLayerModalOpen(true);
            return;
        }

        if (selectedPriceLayer) {
            // One cart row per MRP: the chosen price layer is part of the row id, so another MRP of the same item is a
            // new row instead of overwriting the first one (the same MRP again adds to its own row).
            product = {
                ...product,
                id: `${product.baseProductId ?? product.id}-pl-${selectedPriceLayer.id}`,
                baseProductId: product.baseProductId ?? product.id,
                price: selectedPriceLayer.salePrice,
                salePrice: selectedPriceLayer.salePrice,
                latestSalePrice: selectedPriceLayer.salePrice,
                bkdAmount: selectedPriceLayer.salePrice,
                latestMRP: selectedPriceLayer.mrp ?? product.latestMRP,
                mrp: selectedPriceLayer.mrp ?? product.mrp,
                // An MRP option has no stock layer: bill it like a product without layers.
                inventoryPriceLayerId: selectedPriceLayer.isPriceOption ? null : (selectedPriceLayer.id ?? null),
            };
        }

        if (Number(product.latestSalePrice) > Number(product.latestMRP)) {
            setWarningProduct(product);
            toggleWarningModal()
            return;
        }

        const offer = product.offers?.[0];
        let nextRows = cartRows;

        setCartRows((prev) => {
            const currentRows = prev;
            const paidRow = currentRows.find(x => x.id === product.id);
            const freeRow = currentRows.find(x => x.offerForId === product.id);
            const quantity = roundQty((paidRow?.quantity || 0) + (freeRow?.quantity || 0) + extraQty);
            const { buy, free } = parseOfferRatio(offer?.offerTypeName || "");
            const initialSetQty = buy && free ? buy + free : quantity;

            switch (offer?.offerType) {
                case offerTypes.BUY_X_GET_Y:
                    nextRows = applyBuyXGetY(
                        currentRows,
                        product,
                        paidRow || freeRow || product.loose ? quantity : initialSetQty
                    );
                    break;

                case offerTypes.BUY_X_GET_Y_CHOICE: {
                    const existingPaid = currentRows.find(x => x.id === product.id);
                    setSelectedRow(existingPaid || product);
                    setShowBuyWithoutOffer(!existingPaid);
                    setPendingProduct(existingPaid || product);
                    setPendingQty(quantity);
                    setSelectedOffer(offer);
                    toggleOfferChoiceModal();
                    return currentRows;
                }

                // case offerTypes.COMBO: {
                //     const normalRow = prev.find(
                //         x =>
                //             x.id === product.id &&
                //             x.comboStatus === "WITHOUT_COMBO"
                //     );

                //     const comboRow = prev.find(
                //         x =>
                //             x.parentId === product.id &&
                //             x.comboStatus === "WITH_COMBO"
                //     );

                //     setSelectedRow(comboRow || normalRow || product);
                //     setPendingProduct(product);
                //     setPendingQty(
                //         comboRow
                //             ? comboRow.quantity + comboRow.comboQty
                //             : normalRow ? normalRow.quantity + 1 : Number(offer.requiredItem.chargeableQty)
                //     );

                //     toggleComboModal();
                //     return prev;
                // }

                case offerTypes.COMBO: {
                    const normalRow = currentRows.find(
                        x =>
                            x.id === product.id &&
                            x.comboStatus === "WITHOUT_COMBO"
                    );

                    const comboRow = currentRows.find(
                        x =>
                            x.parentId === product.id &&
                            x.comboStatus === "WITH_COMBO"
                    );

                    setSelectedRow(comboRow || normalRow || product);
                    setPendingProduct(product);
                    const totalQty = (comboRow?.quantity || 0) + (normalRow?.quantity || 0);
                    setPendingQty(totalQty);

                    toggleComboModal();
                    return currentRows;
                }

                // case offerTypes.FOC_WITH_OFFER_PRICE: {
                //     const existing = prev.find(x => x.id === product.id);

                //     if (existing?.focStatus === "WITH_OFFER") {
                //         return applyFOCOffer(
                //             prev,
                //             product,
                //             existing.quantity + 1
                //         );
                //     }
                //     if (existing?.focStatus === "WITHOUT_OFFER") {
                //         return updateNormalRow(prev, product, existing.quantity + 1);
                //     }
                //     const hasComboPrice = Number(offer.reward?.comboSalesPrice || 0) > 0;
                //     const hasAlternateItems = (offer.alternateItems?.length || 0) > 0;
                //     const comboSameAsSalePrice = Number(offer.reward?.comboSalesPrice || 0) === Number(product.salePrice);

                //     // No popup needed
                //     if ((!hasComboPrice && !hasAlternateItems) || (hasComboPrice && !hasAlternateItems && comboSameAsSalePrice)) {
                //         const chargeableQty = Number(offer.requiredItem?.chargeableQty || 1);
                //         return applyFOCOffer(prev, product, chargeableQty);
                //     }

                //     // Popup required
                //     setSelectedRow(product);
                //     setPendingProduct(product);
                //     setSelectedOffer(offer);
                //     toggleFOCModal();
                //     return prev;
                // }

                case offerTypes.FOC_WITH_OFFER_PRICE: {
                    const hasComboPrice = Number(offer.reward?.comboSalesPrice || 0) > 0;
                    const hasAlternateItems = (offer.alternateItems?.length || 0) > 0;
                    const comboSameAsSalePrice = Number(offer.reward?.comboSalesPrice || 0) === Number(product.salePrice);

                    // If alternate items exist, ALWAYS show popup
                    if (hasAlternateItems) {
                        setSelectedRow(product);
                        setPendingProduct(product);
                        setSelectedOffer(offer);
                        toggleFOCModal();
                        return currentRows;
                    }

                    const existing = currentRows.find(
                        x =>
                            x.id === product.id &&
                            x.focStatus === "WITH_OFFER"
                    );

                    if (existing) {
                        return applyFOCOffer(currentRows, existing, roundQty(existing.quantity + extraQty));
                    }

                    const existingWithoutOffer = currentRows.find(
                        x =>
                            x.id === product.id &&
                            x.focStatus === "WITHOUT_OFFER"
                    );

                    if (existingWithoutOffer) {
                        setSelectedRow(existingWithoutOffer);
                        setPendingProduct(existingWithoutOffer);
                        setSelectedOffer(offer);
                        toggleFOCModal();
                        return currentRows;
                    }

                    if ((!hasComboPrice && !hasAlternateItems) || (hasComboPrice && !hasAlternateItems && comboSameAsSalePrice)) {
                        const chargeableQty = Number(offer.requiredItem?.chargeableQty || 1);
                        return applyFOCOffer(currentRows, product, chargeableQty);
                    }

                    setSelectedRow(product);
                    setPendingProduct(product);
                    setSelectedOffer(offer);
                    toggleFOCModal();
                    return currentRows;
                }

                case offerTypes.DISCOUNT:
                    nextRows = applyDiscountOffer(currentRows, product, quantity);
                    break;

                default:
                    nextRows = updateNormalRow(currentRows, product, quantity);
                    break;
            }

            return nextRows;
        });

        const selectedCartRow = nextRows.find((row) => !row.isOfferItem && String(row.id) === String(product.id));
        if (selectedCartRow) {
            setSelectedRow(selectedCartRow);
        }
    };

    const handleQuantityChange = (id, quantity, action) => {
        setCartRows((prev) => {
            const row = prev.find((x) => x.id === id);

            if (row) {
                setSelectedRow(row);
            }

            if (!row) return prev;

            const freeRow = prev.find((x) => x.offerForId === row.id);
            const oldTotal = row.quantity + (freeRow?.quantity || 0);
            const loose = Boolean(row.loose);
            const minQty = loose ? 0.001 : 1;
            const nextQty = (value) => {
                const rounded = roundQty(value);
                return Math.max(minQty, loose ? rounded : Math.round(rounded) || minQty);
            };

            let totalQty;

            if (action === "increment") {
                totalQty = nextQty(oldTotal + 1);
            } else if (action === "decrement") {
                totalQty = nextQty(oldTotal - 1);
            } else {
                totalQty = nextQty(quantity);
            }

            const isIncrease = totalQty > oldTotal;

            const offer = row.offers?.[0];

            switch (offer?.offerType) {
                case offerTypes.BUY_X_GET_Y:
                    return applyBuyXGetY(prev, row, Math.max(1, totalQty));

                case offerTypes.BUY_X_GET_Y_CHOICE: {
                    const paidQty =
                        action === "input"
                            ? totalQty
                            : isIncrease
                                ? row.quantity + 1
                                : Math.max(1, row.quantity - 1);

                    if (row.offerChoiceStatus === "WITH_OFFER") {
                        return applyBuyXGetYChoice(
                            prev,
                            row,
                            paidQty,
                            row.selectedAlternate
                        );
                    }

                    setShowBuyWithoutOffer(false);
                    setPendingProduct(row);
                    setPendingQty(Math.max(1, totalQty));
                    setSelectedOffer(offer);
                    toggleOfferChoiceModal();

                    return prev;
                }

                // case offerTypes.COMBO: {
                //     if (row.comboStatus === "WITH_COMBO") {
                //         const updated = applyComboOffer(
                //             prev,
                //             row,
                //             isIncrease
                //                 ? row.quantity + row.comboQty
                //                 : Math.max(row.comboQty, row.quantity - row.comboQty)
                //         );

                //         return syncComboRows(updated, row.parentId);
                //     }

                //     const updated = updateNormalRow(prev, row, Math.max(1, totalQty));
                //     return syncComboRows(updated, row.id);
                // }

                case offerTypes.COMBO: {
                    const requiredQty = Number(row.offers[0].requiredItem.chargeableQty);

                    let totalQty;

                    if (row.comboStatus === "WITH_COMBO") {
                        totalQty =
                            action === "increment"
                                ? row.quantity + requiredQty
                                : Math.max(requiredQty, row.quantity - requiredQty);
                    } else {
                        const comboRow = prev.find(
                            x =>
                                x.parentId === row.id &&
                                x.comboStatus === "WITH_COMBO"
                        );

                        totalQty = (comboRow?.quantity || 0) +
                            (action === "increment"
                                ? row.quantity + 1
                                : Math.max(1, row.quantity - 1));
                    }

                    return applyComboOffer(prev, row, totalQty);
                }

                case offerTypes.FOC_WITH_OFFER_PRICE: {
                    const paidQty =
                        action === "input"
                            ? totalQty
                            : isIncrease
                                ? row.quantity + 1
                                : Math.max(1, row.quantity - 1);

                    if (row.focStatus === "WITH_OFFER") {
                        return applyFOCOffer(
                            prev,
                            row,
                            paidQty,
                            row.selectedAlternate
                        );
                    }

                    if (row.focStatus === "WITHOUT_OFFER") {
                        return updateNormalRow(prev, row, paidQty);
                    }

                    return prev;
                }

                case offerTypes.DISCOUNT:
                    return applyDiscountOffer(prev, row, Math.max(1, totalQty));

                default:
                    return updateNormalRow(prev, row, totalQty);
            }
        });
    };

    const handleRemoveOfferSet = (id) => {
        const selectedRow = cartRows.find(row => row.id === id);
        if (!selectedRow) return false;

        const row = selectedRow.isOfferItem
            ? cartRows.find(item => item.id === selectedRow.offerForId) || selectedRow
            : selectedRow;
        const offer = row.offers?.[0];
        const offerType = offer?.offerType;

        const comboSameAsSalePrice = offerType === offerTypes.FOC_WITH_OFFER_PRICE && Number(offer.reward?.comboSalesPrice || 0) === Number(row.salePrice);
        if (comboSameAsSalePrice) {
            return false;
        }

        if (![offerTypes.BUY_X_GET_Y, offerTypes.BUY_X_GET_Y_CHOICE, offerTypes.FOC_WITH_OFFER_PRICE].includes(offerType)) {
            setCartRows(prev => prev.filter(item =>
                item.id !== selectedRow.id && item.offerForId !== selectedRow.id
            ));
            setSelectedRow(null);
            return true;
        }

        const hasFreeRow = cartRows.some(item => item.offerForId === row.id);
        const isWithoutOffer =
            row.offerChoiceStatus === "WITHOUT_OFFER" ||
            row.focStatus === "WITHOUT_OFFER" ||
            (offerType === offerTypes.BUY_X_GET_Y && !hasFreeRow);

        if (isWithoutOffer) {
            setCartRows(prev => prev.filter(item =>
                item.id !== row.id && item.offerForId !== row.id
            ));
            setSelectedRow(null);
            return true;
        }

        setCartRows(prev => prev
            .filter(item => item.offerForId !== row.id)
            .map(item => {
                if (item.id !== row.id) return item;

                const withoutOfferPrice = item.withoutOfferPrice ?? item.bkdAmount ?? item.salePrice;
                return {
                    ...item,
                    price: withoutOfferPrice,
                    salePrice: withoutOfferPrice,
                    latestSalePrice: withoutOfferPrice,
                    totalPrice: withoutOfferPrice * Number(item.quantity || 0),
                    offerChoiceStatus: offerType === offerTypes.BUY_X_GET_Y_CHOICE ? "WITHOUT_OFFER" : item.offerChoiceStatus,
                    focStatus: offerType === offerTypes.FOC_WITH_OFFER_PRICE ? "WITHOUT_OFFER" : item.focStatus,
                    selectedAlternate: null,
                };
            })
        );
        setSelectedRow(null);
        return true;
    };

    const handleOfferSelection = (alternate) => {
        const chargeableQty = Number(pendingProduct.offers[0].requiredItem.chargeableQty);
        setCartRows(prev => {
            const existingPaid = prev.find(
                x =>
                    !x.isOfferItem &&
                    x.productCode === pendingProduct.productCode &&
                    x.selectedAlternate?.itemCode === alternate.itemCode
            );

            // Same alternate -> increase quantity
            if (existingPaid) {
                return applyBuyXGetYChoice(
                    prev,
                    existingPaid,
                    existingPaid.quantity + chargeableQty,
                    alternate
                );
            }

            // Different alternate -> create new offer set
            const uniqueProduct = {
                ...pendingProduct,
                id: `${pendingProduct.id}-${Date.now()}`
            };

            return applyBuyXGetYChoice(
                prev,
                uniqueProduct,
                chargeableQty,
                alternate
            );
        });

        toggleOfferChoiceModal();
    };

    const handleBuyWithoutOffer = () => {
        setCartRows(prev =>
            updateNormalRow(
                prev,
                {
                    ...pendingProduct,
                    offerChoiceStatus: "WITHOUT_OFFER",
                    selectedAlternate: null,
                },
                pendingQty
            )
        );
        toggleOfferChoiceModal();
    };

    // const handleComboOfferSelection = () => {
    //     const comboQty = Number(pendingProduct.offers[0].requiredItem.chargeableQty);
    //     setCartRows(prev => {
    //         const comboRow = prev.find(
    //             x =>
    //                 x.parentId === pendingProduct.id &&
    //                 x.comboStatus === "WITH_COMBO"
    //         );

    //         const updated = applyComboOffer(
    //             prev,
    //             pendingProduct,
    //             (comboRow?.quantity || 0) + comboQty
    //         );

    //         return syncComboRows(updated, pendingProduct.id);
    //     });
    //     toggleComboModal();
    // }

    const handleComboOfferSelection = () => {
        const comboQty = Number(pendingProduct.offers[0].requiredItem.chargeableQty);
        setCartRows(prev => {
            const comboRow = prev.find(
                x =>
                    x.parentId === pendingProduct.id &&
                    x.comboStatus === "WITH_COMBO"
            );

            const normalRow = prev.find(
                x =>
                    x.id === pendingProduct.id &&
                    x.comboStatus === "WITHOUT_COMBO"
            );

            const totalQty =
                (comboRow?.quantity || 0) +
                (normalRow?.quantity || 0) +
                comboQty;

            return applyComboOffer(prev, pendingProduct, totalQty);
        });
        toggleComboModal();
    }

    // const handleBuyWithoutCombo = () => {
    //     setCartRows(prev => {
    //         const normalRow = prev.find(
    //             x =>
    //                 x.id === pendingProduct.id &&
    //                 x.comboStatus === "WITHOUT_COMBO"
    //         );

    //         const updated = updateNormalRow(
    //             prev,
    //             {
    //                 ...pendingProduct,
    //                 id: pendingProduct.parentId || pendingProduct.id,
    //                 parentId: undefined,
    //                 comboStatus: "WITHOUT_COMBO",
    //                 price: pendingProduct.latestMRP ?? pendingProduct.salePrice,
    //                 salePrice: pendingProduct.latestMRP ?? pendingProduct.salePrice,
    //                 latestSalePrice: pendingProduct.latestMRP ?? pendingProduct.salePrice,
    //             },
    //             (normalRow?.quantity || 0) + 1
    //         );

    //         return syncComboRows(updated, pendingProduct.parentId || pendingProduct.id);
    //     });
    //     toggleComboModal();
    // };

    const handleBuyWithoutCombo = () => {
        setCartRows(prev => {
            const comboRow = prev.find(
                x =>
                    x.parentId === pendingProduct.id &&
                    x.comboStatus === "WITH_COMBO"
            );

            const normalRow = prev.find(
                x =>
                    x.id === pendingProduct.id &&
                    x.comboStatus === "WITHOUT_COMBO"
            );

            const totalQty =
                (comboRow?.quantity || 0) +
                (normalRow?.quantity || 0) +
                1;

            return applyComboOffer(prev, pendingProduct, totalQty);
        });
        toggleComboModal();
    };

    // const handleFOCOfferSelection = (alternate = null) => {
    //     const chargeableQty = Number(pendingProduct.offers[0].requiredItem.chargeableQty);
    //     setCartRows(prev =>
    //         applyFOCOffer(
    //             prev,
    //             pendingProduct,
    //             chargeableQty,
    //             alternate
    //         )
    //     );
    //     toggleFOCModal();
    // };

    const handleFOCOfferSelection = (alternate = null) => {
        const chargeableQty = Number(pendingProduct.offers[0].requiredItem.chargeableQty);
        setCartRows(prev => {
            const existingPaid = prev.find(
                x =>
                    !x.isOfferItem &&
                    x.productCode === pendingProduct.productCode &&
                    x.focStatus === "WITH_OFFER" &&
                    x.selectedAlternate?.itemCode === alternate?.itemCode
            );
            // Existing WITH_OFFER row → increase only that row
            if (existingPaid) {
                return applyFOCOffer(
                    prev,
                    existingPaid,
                    existingPaid.quantity + chargeableQty,
                    alternate
                );
            }

            // No WITH_OFFER row → create a separate row
            const uniqueProduct = {
                ...pendingProduct,
                id: `${pendingProduct.id}-${Date.now()}`
            };
            return applyFOCOffer(
                prev,
                uniqueProduct,
                chargeableQty,
                alternate
            );
        });
        toggleFOCModal();
    };

    // const handleBuyWithoutFOC = () => {
    //     setCartRows(prev =>
    //         updateNormalRow(
    //             prev,
    //             {
    //                 ...pendingProduct,
    //                 focStatus: "WITHOUT_OFFER"
    //             },
    //             1
    //         )
    //     );
    //     toggleFOCModal();
    // };

    const handleBuyWithoutFOC = () => {
        setCartRows(prev => {
            const existingWithoutOffer = prev.find(
                x =>
                    x.productCode === pendingProduct.productCode &&
                    x.focStatus === "WITHOUT_OFFER"
            );

            return updateNormalRow(
                prev,
                {
                    ...pendingProduct,
                    focStatus: "WITHOUT_OFFER"
                },
                (existingWithoutOffer?.quantity || 0) + 1
            );
        });

        toggleFOCModal();
    };

    const handleRatingChange = (newRating) => {
        setRating(newRating);
    };

    const mrpTotal = cartRows.reduce((acc, item) => {
        return acc + Number(item.latestMRP) * Number(item.quantity);
    }, 0);

    const saleTotal = cartRows.reduce((acc, item) => {
        if (item.isOfferItem) {
            return acc;
        }

        return acc + Number(item.totalPrice ?? (Number(item.price) * Number(item.quantity)));
    }, 0);

    const discountPrice = 0;
    const discountTotal = mrpTotal - saleTotal + discountPrice;
    const totalPay = saleTotal;

    const {
        loyaltyBalance,
        loyaltyPreview,
        balanceLoading: loyaltyBalanceLoading,
        previewLoading: loyaltyPreviewLoading,
        redeemEnabled,
        setRedeemEnabled,
        redeemPointsInput,
        setRedeemPointsInput,
        redeemDiscount,
        redeemPoints,
        netPayable,
        excludedItemCodes,
        resetRedeem,
        handleRedeemAll,
    } = useLoyaltyCart({ phone, cartRows, totalPay, isOnline });

    const itemCount = cartRows.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    const openPaymentCollection = async () => {
        if (!requireDayStarted()) return;

        if (cartRows.length === 0) {
            toast.warning("Please add at least one product before collecting payment.");
            return;
        }

        const isValid = await new Promise((resolve) => {
            handleSubmit(
                () => resolve(true),
                () => resolve(false)
            )();
        });

        if (!isValid) {
            toast.error("Please fill customer details before collecting payment.");
            return;
        }

        togglePaymentModal();
    };

    const onDelete = () => {
        if (selectedRow?.isLoyaltyReward) {
            setCartRows((prev) => prev.filter((row) => row.id !== selectedRow.id));
            setSelectedRow(null);
            toggleDeleteDialog();
            return;
        }
        setCartRows((prev) => {
            const isBuyXGetYFreeItem = selectedRow?.isOfferItem && selectedRow?.offers?.[0]?.offerType === offerTypes.BUY_X_GET_Y;

            if (isBuyXGetYFreeItem) {
                const paidId = selectedRow.offerForId;
                const paidRow = prev.find(row => row.id === paidId);
                const latestSalePrice = paidRow?.latestSalePrice ?? paidRow?.salePrice ?? paidRow?.price;

                return prev
                    .filter(row => row.id !== selectedRow.id)
                    .map(row => row.id === paidId
                        ? {
                            ...row,
                            price: latestSalePrice,
                            salePrice: latestSalePrice,
                            latestSalePrice,
                            totalPrice: Number(latestSalePrice) * Number(row.quantity || 0),
                        }
                        : row
                    );
            }

            const paidId = selectedRow.isOfferItem
                ? selectedRow.offerForId
                : selectedRow.id;

            return prev.filter(
                (row) =>
                    row.id !== paidId &&
                    row.offerForId !== paidId
            );
        });
        setSelectedRow(null);
        toggleDeleteDialog();
    };

    const columns = [
        {
            field: "productName",
            headerName: "Product name",
            minWidth: 500,
            flex: 1,
            renderCell: (params) =>
                <div className="flex min-w-0 flex-col justify-center leading-tight">
                <div className="flex items-center gap-2">
                    <EllipsisText className="text-[15px]! font-semibold! text-app-text!" text={params.row.productName || "-"} />
                    {params.row.comboStatus === 'WITH_COMBO' && (
                        <Chip
                            label="Combo"
                            color="success"
                            size='small'
                            className="text-xs! p-0!"
                        />
                    )}
                    {params.row.discountStatus === "WITH_DISCOUNT" && (
                        <Chip
                            label="Discount"
                            color="success"
                            size='small'
                            className="text-xs! p-0!"
                        />
                    )}
                    {params.row.isOfferItem && (
                        <Chip
                            label="FREE"
                            color="success"
                            size='small'
                            className="text-xs! p-0!"
                        />
                    )}
                    {params.row.isLoyaltyReward && (
                        <Chip
                            label={`Loyalty: ${roundToDecimals(params.row.rewardPointsPerUnit * params.row.quantity)} pts`}
                            color="warning"
                            size="small"
                            className="text-xs! p-0!"
                        />
                    )}
                </div>
                {!params.row.isOfferItem &&
                    (() => {
                        const names = schemeNamesByItemCode.get(
                            String(params.row.itemCode ?? params.row.productCode ?? "").trim().toLowerCase()
                        );
                        if (!names?.length) return null;
                        const info = schemeInfoOf(params.row);
                        return (
                            <span className="truncate text-xs font-semibold text-amber-700" title={`Scheme applied: ${names.join(", ")}`}>
                                Scheme: {names.join(", ")}
                                {info ? ` - ${info.qty} qty at ${priceFormat(info.unitPrice)}, saves ${priceFormat(info.discount)}` : ""}
                            </span>
                        );
                    })()}
                {/* {!params.row.isOfferItem && excludedItemCodes.has(params.row.itemCode) && (
                        <LoyaltyExcludedBadge />
                    )} */}
                </div>
            ,
        },
        {
            field: "quantity",
            headerName: "Quantity",
            flex: 1,
            minWidth: 150,
            sortable: false,
            renderCell: (params) => (
                <NumberSpinner
                    ref={(input) => {
                        const rowId = String(params.row.id);
                        if (input) {
                            quantityInputRefs.current.set(rowId, input);
                        } else {
                            quantityInputRefs.current.delete(rowId);
                        }
                    }}
                    size="small"
                    disabled={
                        params.row.isOfferItem ||
                        Boolean(params.row.schemeAdds) ||
                        (
                            params.row.comboStatus === "WITHOUT_COMBO" &&
                            params.row.comboMode === "WITHOUT" &&
                            cartRows.some(x => x.id === `${params.row.id}-combo`)
                        )
                    }
                    value={params.row.quantity}
                    autoFocus={!scanEnabled && params.row.id === selectedRow?.id}
                    onFocus={() => setSelectedRow(params.row)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            event.stopPropagation();
                            productSearchRef.current?.focus();
                        }
                        if (event.key === "ArrowUp") {
                            event.preventDefault();
                            event.stopPropagation();
                            const index = cartRows.findIndex((row) => row.id === params.row.id);
                            for (let i = index - 1; i >= 0; i--) {
                                const target = quantityInputRefs.current.get(String(cartRows[i].id));
                                const row = cartRows[i];
                                const locked =
                                    row.isOfferItem ||
                                    Boolean(row.schemeAdds) ||
                                    (row.comboStatus === "WITHOUT_COMBO" &&
                                        row.comboMode === "WITHOUT" &&
                                        cartRows.some((x) => x.id === `${row.id}-combo`));
                                if (target && !locked) {
                                    target.focus();
                                    break;
                                }
                            }
                        }
                    }}
                    onValueChange={(value, action) => {
                        if (action === "decrement" && Number(params.row.quantity) <= 1) {
                            setSelectedRow(params.row);
                            toggleDeleteDialog();
                            return;
                        }
                        handleQuantityChange(params.row.id, Number(value) || (params.row.loose ? 0.001 : 1), action);
                    }}
                />
            ),
        },
        {
            field: "mrp",
            headerName: "MRP",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" className="text-[15px]! font-semibold! text-app-text!">
                    {priceFormat(params.row.latestMRP || params.row.mrp)}
                </Typography>
            ),
        },
        {
            field: "price",
            headerName: "Sale Price",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => {
                const info = schemeInfoOf(params.row);
                if (!info) {
                    return (
                        <Typography variant="body1" className="text-[15px]! font-semibold! text-app-text!">
                            {priceFormat(params.row.price)}
                        </Typography>
                    );
                }
                return (
                    <div className="flex flex-col justify-center leading-tight">
                        <span className="text-xs text-gray-400 line-through">{priceFormat(params.row.price)}</span>
                        <span className="text-[15px] font-semibold text-green-700">
                            {priceFormat(info.unitPrice)}
                            {info.qty < Number(params.row.quantity) ? ` x${info.qty}` : ""}
                        </span>
                    </div>
                );
            },
        },
        {
            field: "total",
            headerName: "Total amount",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => {
                const rowTotal = params.row.isOfferItem
                    ? 0
                    : (params.row.totalPrice ?? (params.row.price * params.row.quantity));
                const info = schemeInfoOf(params.row);
                if (info && info.discount > 0) {
                    return (
                        <div className="flex flex-col justify-center leading-tight">
                            <span className="text-xs text-gray-400 line-through">{priceFormat(rowTotal)}</span>
                            <span className="text-[15px] font-semibold text-green-700">
                                {priceFormat(Math.max(0, rowTotal - info.discount))}
                            </span>
                        </div>
                    );
                }
                return (
                    <Typography variant="body1" className="text-[15px]! font-semibold! text-app-text!">
                        {priceFormat(rowTotal)}
                    </Typography>
                );
            },
        },
        {
            field: "actions",
            headerName: "",
            width: 60,
            sortable: false,
            disableColumnMenu: true,
            headerClassName: "sticky-column",
            cellClassName: "sticky-column",
            renderCell: (params) => {
                const isBuyXGetYOffer = params.row.offers?.[0]?.offerType === offerTypes.BUY_X_GET_Y;

                if (params.row.isLoyaltyReward) {
                    return (
                        <IconButton
                            edge="end"
                            onClick={() => {
                                setSelectedRow(params.row);
                                toggleDeleteDialog();
                            }}
                        >
                            <DeleteIcon color="error" fontSize="small" />
                        </IconButton>
                    );
                }

                if (params.row.isOfferItem && !isBuyXGetYOffer) {
                    return null;
                }

                if (!params.row.isOfferItem && isBuyXGetYOffer && !params.row.offerForId) {
                    return (
                        <IconButton
                            edge="end"
                            onClick={() => {
                                setSelectedRow(params.row);
                                toggleDeleteDialog();
                            }}
                        >
                            <DeleteIcon color="error" fontSize="small" />
                        </IconButton>
                    );
                }

                if (params.row.isOfferItem && isBuyXGetYOffer) {
                    return (
                        <IconButton
                            edge="end"
                            onClick={() => {
                                setSelectedRow(params.row);
                                toggleDeleteDialog();
                            }}
                        >
                            <DeleteIcon color="error" fontSize="small" />
                        </IconButton>
                    );
                }

                if (!params.row.isOfferItem && !isBuyXGetYOffer) {
                    return (
                        <IconButton
                            edge="end"
                            onClick={() => {
                                setSelectedRow(params.row);
                                toggleDeleteDialog();
                            }}
                        >
                            <DeleteIcon color="error" fontSize="small" />
                        </IconButton>
                    );
                }

                return null;
            },
        },
    ];

    const handleGenerateBill = (paymentData) => {
        if (!requireDayStarted()) return;

        if (cartRows.length === 0) {
            toast.warning("Please add at least one product before generating a bill.");
            return;
        }

        const values = getValues();

        if (!paymentData?.payments?.length) {
            toast.warning("Please collect payment before generating the invoice.");
            return;
        }

        if (!paymentData.isCreditSale && paymentData.remainingAmount > 0) {
            toast.warning("Payment is incomplete. Remaining amount must be zero.");
            return;
        }

        setPendingBillData({ paymentData, customerValues: values });
        setShowBillConfirmation(true);
    };

    const handleCancelBillConfirmation = () => {
        setShowBillConfirmation(false);
        setPendingBillData(null);
    };

    const handleConfirmGenerateBill = async () => {
        if (!pendingBillData) return;

        const { paymentData, customerValues: values } = pendingBillData;
        setShowBillConfirmation(false);
        setIsSavingBillLoading(true);

        
        try {
            const indexNo = await window.api.getNextIndexNo(userData?.userId);
    
            const schemeDiscountAmount = Number(paymentData.schemeDiscountAmount || 0);
            const totalDiscountAmount = roundToDecimals(
                discountTotal +
                    Number(paymentData.couponDiscountAmount || 0) +
                    schemeDiscountAmount
            );
            const billPayload = {
                indexNo: indexNo,
                totalAmount: roundToDecimals(mrpTotal),
                savingAmount: totalDiscountAmount,
                payAmount: roundToWholeRupee(paymentData.netPayable),
                netPayable: roundToWholeRupee(paymentData.netPayable),
                couponCode: paymentData.couponCode,
                // Wheel coupon bill: the ticket being cashed in (server marks it used).
                ...(paymentData.wheelTicketNo && { wheelTicketNo: paymentData.wheelTicketNo }),
                couponDiscountAmount: roundToDecimals(paymentData.couponDiscountAmount || 0),
                // Schemes that gave a discount (item price + bill discount): printed under the totals.
                billingSchemes: Array.isArray(paymentData.schemeBreakdown) ? paymentData.schemeBreakdown : [],
                // Bill-discount offer: the server re-checks it and records the discount against the bill.
                ...(paymentData.billingSchemeIds?.length > 0 && { billingSchemeIds: paymentData.billingSchemeIds }),
                loyaltyRedeem: redeemPoints,
                loyaltyRedeemDiscount: roundToDecimals(redeemDiscount),
                loyaltyRedeemed: roundToDecimals(redeemDiscount),
                discountAmount: totalDiscountAmount,
                totalItems: cartRows.length,
                totalQuantity: cartRows.reduce((sum, item) => sum + Number(item.quantity), 0),
                date: format(new Date(), 'yyyy-MM-dd'),
                customerName: values.name,
                customerPhone: values.phone,
                cashierId: userData?.userId || userData?.id || null,
                cashierEmail: userData?.email || null,
                cashierName: `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim() || userData?.email || "Unknown",
                gstNumber: userData?.gstNumber || null,
                paymentMethod: paymentData.paymentMethod,
                payments: paymentData.payments,
                billPayments: paymentData.payments.map((payment) => ({
                    paymentMode: payment.paymentMode || payment.mode,
                    amount: roundToWholeRupee(payment.amount),
                    ...(payment.redeemedPoints && { redeemedPoints: payment.redeemedPoints }),
                    ...(payment.pointsToRupeeRate && { pointsToRupeeRate: payment.pointsToRupeeRate }),
                })),
                totalReceived: roundToWholeRupee(paymentData.totalReceived),
                remainingAmount: roundToWholeRupee(paymentData.remainingAmount),
                balanceToReturn: roundToWholeRupee(paymentData.balanceToReturn),
                cashTendered: roundToWholeRupee(paymentData.cashTendered),
                cashAmount: roundToWholeRupee(paymentData.cashAmount),
                isCreditSale: paymentData.isCreditSale,
                storeName: posStore?.storeName || "Store",
                storeId: POS_STORE_ID,
                storeRating: rating,
                remark: remark.trim(),
                syncStatus: "PENDING",
                loyalty: loyaltyPreview
                    ? {
                        tier: loyaltyPreview.tier,
                        eligibleInvoiceValue: loyaltyPreview.eligibleInvoiceValue,
                        excludedInvoiceValue: loyaltyPreview.excludedInvoiceValue,
                        earnedPoints: loyaltyPreview.earnedPoints,
                        redeemedPoints: redeemPoints,
                        redeemDiscount: redeemDiscount,
                        pointsToRupeeRate: loyaltyPreview.pointsToRupeeRate,
                        balanceAfter: loyaltyPreview.balanceAfter,
                    }
                    : null,
                // Item offers: the evaluated lines carry the offer price + offer tags, so the invoice total
                // matches what was collected and the discount shows in the scheme reports.
                saleItems: Array.isArray(paymentData.schemeCartItems)
                    ? paymentData.schemeCartItems.map(({ id: _cartLineId, ...line }) => ({
                        ...line,
                        qty: Number(line.qty ?? line.quantity),
                        mrp: roundToDecimals(line.mrp ?? 0),
                        salePrice: roundToDecimals(line.salePrice ?? 0),
                        isReturnBill: false,
                        isOfferFreeItem: Boolean(line.isOfferFreeItem),
                    }))
                    : cartRows.map((item) => ({
                    itemCode: item.itemCode,
                    itemName: item.productName,
                    qty: item.quantity,
                    mrp: roundToDecimals(item.latestMRP ?? item?.mrp),
                    salePrice: roundToDecimals(item?.latestSalePrice ?? item?.salePrice ?? item?.price ?? 0),
                    inventoryPriceLayerId: item.inventoryPriceLayerId,
                    isReturnBill: false,
                    isOfferFreeItem: Boolean(item.isOfferItem),
                })),
            };

            // Loyalty reward items (free for points): tagged lines + the selection the server checks and charges.
            const rewardRows = cartRows.filter((row) => row.isLoyaltyReward);
            if (rewardRows.length) {
                const normCode = (value) => String(value ?? "").trim().toLowerCase();
                const rewardCodes = new Set(rewardRows.map((row) => normCode(row.itemCode ?? row.productCode)));
                billPayload.saleItems = [
                    ...billPayload.saleItems.filter(
                        (line) => !(rewardCodes.has(normCode(line.itemCode)) && Number(line.salePrice) === 0)
                    ),
                    ...rewardRows.map((row) => ({
                        itemCode: row.itemCode ?? row.productCode,
                        itemName: row.productName,
                        qty: Number(row.quantity),
                        mrp: roundToDecimals(row.latestMRP ?? row?.mrp),
                        salePrice: 0,
                        inventoryPriceLayerId: row.inventoryPriceLayerId,
                        isReturnBill: false,
                        isOfferFreeItem: true,
                        offerName: `Loyalty Reward (${roundToDecimals(row.rewardPointsPerUnit * row.quantity)} pts)`,
                        offerAppliedType: "LOYALTY_REWARD",
                    })),
                ];
                billPayload.loyaltyRewards = rewardRows.map((row) => ({
                    rewardId: row.rewardId,
                    qty: Number(row.quantity),
                }));
                billPayload.loyaltyRewardPoints = roundToDecimals(
                    rewardRows.reduce((sum, row) => sum + row.rewardPointsPerUnit * row.quantity, 0)
                );
            }

            let finalPayload = billPayload;
            let uploaded = false;

            if (isOnline) {
                try {
                    const uploadResponse = await uploadInvoiceToServer(finalPayload);
                    const serverBill =
                        uploadResponse?.bills?.[0] ||
                        uploadResponse?.data?.bills?.[0];
                    if (serverBill) {
                        finalPayload = mergeServerLoyaltyBill(finalPayload, serverBill);
                        uploaded = true;
                    }
                } catch (uploadError) {
                    if (isLoyaltyRedeemRejected(uploadError)) {
                        toast.error(getApiErrorMessage(uploadError));
                        resetRedeem();
                        setIsSavingBillLoading(false);
                        return;
                    }
                }
            }

            const result = await window.api.saveBill(finalPayload);

            if (isOnline && !uploaded) {
                try {
                    const uploadResponse = await uploadInvoiceToServer(finalPayload);
                    const serverBill =
                        uploadResponse?.bills?.[0] ||
                        uploadResponse?.data?.bills?.[0];
                    if (serverBill) {
                        finalPayload = mergeServerLoyaltyBill(finalPayload, serverBill);
                        await window.api.saveBill(finalPayload);
                    }
                    try {
                        await window.api.updateBillSyncStatus(finalPayload.indexNo, "SYNCED");
                    } catch (syncError) {
                        console.error("Failed to mark bill as synced:", syncError);
                    }
                } catch (error) {
                    try {
                        await window.api.updateBillSyncStatus(finalPayload.indexNo, "FAILED");
                    } catch (syncError) {
                        console.error("Failed to mark bill sync as failed:", syncError);
                    }
                }
            } else if (isOnline && uploaded) {
                try {
                    await window.api.updateBillSyncStatus(finalPayload.indexNo, "SYNCED");
                } catch (syncError) {
                    console.error("Failed to mark bill as synced:", syncError);
                }
            }
            const currentInvoiceValue = Number(totalPay || 0);
            const previousInvoiceCount = Number(selectedCustomerProfile?.invoiceCount || 0);
            const previousAvgInvoiceValue = Number(selectedCustomerProfile?.avgInvoiceValue || 0);
            const nextInvoiceCount = previousInvoiceCount + 1;
            const nextAvgInvoiceValue = previousInvoiceCount === 0
                ? currentInvoiceValue
                : ((previousAvgInvoiceValue * previousInvoiceCount) + currentInvoiceValue) / nextInvoiceCount;

            const profile = {
                isExisting: true,
                avgInvoiceValue: Number(nextAvgInvoiceValue || 0),
                customer: {
                    firstName: values.name,
                    lastName: "",
                    phone: values.phone,
                    email: null,
                    address: null,
                    city: null,
                    state: null,
                    pincode: null,
                    gender: null,
                    gstNumber: null,
                    customerCategory: null,
                    isActive: true,
                    lastPurchaseDate: new Date().toISOString(),
                    firstPurchaseDate: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                inventories: [],
                relatedProducts: [],
            };
            if (!gstCustomersOnly) {
                await window.api.saveCustomerProfile(profile);
                await loadCustomers("",gstCustomersOnly);
            }
            toast.success(`Bill saved locally with ID ${result.id}`);
            if (selectedHoldBill) {
                setHoldBills((prev) => prev.filter((item) => item.id !== selectedHoldBill));
                setSelectedHoldBill(null);
            }
            resetRedeem();
            setCartRows([]);
            storage.removeItem(cartStorageKey);
            setSelectedProduct(null);
            reset({ name: "", phone: "", gstCustomersOnly });
            setInputValue("");
            focusCustomerNumberAfterBillRef.current = true;
            handleKOTPrint(finalPayload || billPayload, true);
        } catch (error) {
            await logPosError(error, {
                type: "bill-generation-error",
                source: "handleConfirmGenerateBill",
                details: {
                    itemCount: cartRows.length,
                    isOnline,
                },
            });
            toast.error(error instanceof Error ? error.message : "Unable to save the bill. Please try again.");
        } finally {
            setIsSavingBillLoading(false);
            setShowPaymentModal(false);
            setPendingBillData(null);
        }
    };

    const ScanIndicator = (props) => (
        <components.DropdownIndicator {...props}>
            <QrCodeScannerIcon fontSize="small" className="cursor-pointer text-black" />
        </components.DropdownIndicator>
    );

    const loadDayStatus = async (logsResponse = cashierLogs) => {
        if (getLocalDayStatus(dayBills).status === DAY_STATUS.ENDED) {
            setButtonText("Day Closed");
            return;
        }

        // Local date (like the day form), not UTC: before 5:30 AM IST the UTC date is still "yesterday".
        const today = getTodayDate();
        const todayLog = logsResponse?.data?.logs?.find(
            (log) => log.cashier?.id === loggedInCashier.id && log.date === today
        );

        if (!todayLog) {
            setButtonText("Start Day");
        } else if (!todayLog.endAt) {
            setButtonText("End Day");
        } else {
            setButtonText("Day Closed");
        }
    };

    // The POS screen stays until the settlement slip is closed; the slow end-day sync then runs in the background.
    const finishEndDay = async () => {
        if (!endDayPendingRef.current) return;
        endDayPendingRef.current = false;

        await refreshDayAccess({ silent: true });

        await triggerEndDaySync();
        try {
            const refreshedLogs = await refreshCashierLogs();
            await loadDayStatus(refreshedLogs);
        } catch {
            toast.warning("Day ended, but cashier logs could not be refreshed.");
        }

        setButtonText("Day Closed");
    };

    const handleEndDayComplete = (slip) => {
        setButtonText("Day Closed");
        endDayPendingRef.current = true;
        if (slip) setSettlementSlip(slip);
        else finishEndDay();
    };

    const closeSettlementSlip = () => {
        setSettlementSlip(null);
        finishEndDay();
    };

    const handleStartDayComplete = (dayBill) => {
        setDayBillToPrint(dayBill);
        setIsDayBillPrintModalOpen(true);
    };

    const closeDayBillPrintModal = () => {
        setIsDayBillPrintModalOpen(false);
        setDayBillToPrint(null);
    };

    const handleBillForm = () => {
        toggleBillFormModal()
    }

    useEffect(() => {
        if (cashierLogs?.data?.logs?.length >= 0) {
            loadDayStatus();
        }
    }, [cashierLogs, dayBills, loggedInCashier.id]);

    const loadProducts = async (search) => {
        const requestId = ++productSearchRequestRef.current;
        const products = await window.api.getProducts(search);
        if (requestId === productSearchRequestRef.current) {
            setProductsList(products);
        }
    };

    const resolveScannedBarcode = async (barcode, source = "barcode") => {
        if (barcodeLookupInProgressRef.current) return;
        barcodeLookupInProgressRef.current = true;

        try {
            const scale = parseScaleLabel(barcode);
            const lookup = scale ? scale.code : barcode.trim();
            const scannedBarcode = lookup.toLowerCase();
            const matchesBarcode = (item) => getProductBarcodes(item).includes(scannedBarcode);
            const matchesItemCode = (item) =>
                String(item.itemCode ?? item.productCode ?? "").trim().toLowerCase() === scannedBarcode;
            const inMemoryProducts = [...cartRows, ...productsList];
            let product = inMemoryProducts.find(matchesBarcode);

            if (!product) {
                const products = (await window.api.getProducts(lookup)) || [];
                // Barcode can be any length (even 2 digits): exact barcode first, then exact item code, and a
                // single remaining search hit is taken as the product the cashier meant.
                product =
                    products.find(matchesBarcode) ||
                    products.find(matchesItemCode) ||
                    (products.length === 1 ? products[0] : undefined);
            }

            if (product) {
                handleProductSelect(
                    scale ? { ...product, loose: true } : product,
                    null,
                    scale ? scale.qty : 1
                );
                if (source === "barcode") {
                    setSelectedRow(null);
                    if (!scanEnabled) {
                        window.requestAnimationFrame(() => barcodeSearchRef.current?.focus?.());
                    }
                }
            } else {
                setUnavailableBarcode(barcode);
            }
        } catch {
            toast.error("Unable to check the scanned barcode. Please try again.");
        } finally {
            barcodeLookupInProgressRef.current = false;
            if (source === "product-search") {
                productSearchInputRef.current = "";
                setProductSearchInput("");
                setSelectedProduct(null);
                loadProducts("").catch(() => {
                    toast.error("Unable to reload the product list. Please try again.");
                });
            } else {
                setBarcodeSearchInput("");
            }
        }
    };
    resolveScannedBarcodeRef.current = resolveScannedBarcode;

    useEffect(() => () => clearTimeout(barcodeSearchTimerRef.current), []);

    const setBarcodeScanMode = (enabled) => {
        setScanEnabled(enabled);
        barcodeScanSequenceRef.current = { digits: "", lastKeyAt: 0, startedAt: 0 };

        window.requestAnimationFrame(() => {
            if (enabled) {
                document.activeElement?.blur?.();
            } else {
                customerNumberRef.current?.focus?.();
            }
        });
    };

    useEffect(() => {
        if (!dayAccess.canUsePos) return undefined;

        const handleGlobalScanKeyDown = (event) => {
            if (event.key === "F10") {
                event.preventDefault();
                setBarcodeScanMode(!scanEnabled);
                return;
            }

            const target = event.target;

            const scanningFromProductSearch = productSearchContainerRef.current?.contains(target);

            const isEditableTarget =
                target instanceof HTMLElement &&
                (target.isContentEditable ||
                    target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]'));

            if (
                (!scanEnabled && !scanningFromProductSearch) ||
                (scanEnabled && isEditableTarget && !scanningFromProductSearch) ||
                event.ctrlKey ||
                event.altKey ||
                event.metaKey
            ) {
                barcodeScanSequenceRef.current = {
                    digits: "",
                    lastKeyAt: 0,
                    startedAt: 0,
                };

                return;
            }

            const sequence = barcodeScanSequenceRef.current;
            const now = Date.now();
            if (event.key === "Enter" && now - lastBarcodeScanAtRef.current < 400) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }

            const buffer = now - sequence.lastKeyAt > 1000 ? "" : sequence.digits;
            const nextBuffer = /^\d$/.test(event.key)
                ? buffer + event.key
                : event.key === "-" && /^\d+$/.test(buffer)
                    ? buffer + "-"
                    : event.key === "." && /^\d+-\d+$/.test(buffer)
                        ? buffer + "."
                        : null;

            if (nextBuffer !== null) {
                if (!buffer.length) sequence.startedAt = now;
                sequence.digits = nextBuffer;
                sequence.lastKeyAt = now;

                if (scanEnabled && !isEditableTarget) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }

                return;
            }

            if (scanEnabled && (event.key === "NumLock" || event.key === "ScrollLock")) {
                const isScaleLabel = SCALE_LABEL_PATTERN.test(sequence.digits);
                const isFastBarcode =
                    (isScaleLabel || sequence.digits.length >= 8) &&
                    now - sequence.lastKeyAt <= 1000 &&
                    (isScaleLabel || now - sequence.startedAt <= 250);

                if (isFastBarcode) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    const scannedBarcode = sequence.digits;
                    barcodeScanSequenceRef.current = {
                        digits: "",
                        lastKeyAt: 0,
                        startedAt: 0,
                    };
                    lastBarcodeScanAtRef.current = now;
                    resolveScannedBarcodeRef.current?.(
                        scannedBarcode,
                        scanningFromProductSearch ? "product-search" : "barcode"
                    );
                } else {
                    barcodeScanSequenceRef.current = {
                        digits: "",
                        lastKeyAt: 0,
                        startedAt: 0,
                    };
                }

                return;
            }

            if (event.key === "Enter") {
                const hasRecentDigits = sequence.digits.length > 0 && now - sequence.lastKeyAt <= 1000;
                const isScaleLabel = SCALE_LABEL_PATTERN.test(sequence.digits);
                const isFastBarcode =
                    sequence.digits.length >= 8 &&
                    hasRecentDigits &&
                    now - sequence.startedAt <= 250;
                const scannedBarcode = sequence.digits;

                barcodeScanSequenceRef.current = {
                    digits: "",
                    lastKeyAt: 0,
                    startedAt: 0,
                };

                if (scanEnabled && hasRecentDigits && (isScaleLabel || (isFastBarcode && /^\d{8,}$/.test(scannedBarcode)))) {
                    event.preventDefault();
                    event.stopImmediatePropagation();

                    lastBarcodeScanAtRef.current = now;
                    resolveScannedBarcodeRef.current?.(
                        scannedBarcode,
                        scanningFromProductSearch ? "product-search" : "barcode"
                    );
                }
                return;
            }

            barcodeScanSequenceRef.current = { digits: "", lastKeyAt: 0, startedAt: 0 };
        };

        window.addEventListener("keydown", handleGlobalScanKeyDown, true);
        return () => window.removeEventListener("keydown", handleGlobalScanKeyDown, true);
    }, [dayAccess.canUsePos, scanEnabled]);

    const loadCustomers = async (search = "", gstOnly = gstCustomersOnly) => {
        try {
            const customers = await window.api.getCustomers(search, gstOnly);
            setCustomerProfiles(customers);
        } catch (error) {
            await logPosError(error, {
                type: "customer-load-error",
                source: "loadCustomers",
            });

            setCustomerProfiles([]);
            toast.error("Failed to load customers.");
        }
    };

    const handleGstFilterChange = async (checked) => {
    setGstCustomersOnly(checked);
    setValue("gstCustomersOnly", checked, { shouldValidate: true });
    await loadCustomers("", checked);

    if (checked) {
        setTimeout(() => {
            gstNumberRef.current?.focus?.();
        }, 100);
    } else {
        setTimeout(() => {
            customerNumberRef.current?.focus?.();
        }, 100);
    }
};

    const loadStores = async () => {
        const result = await window.api.getStores();
        setStores(result);
    };

    useEffect(() => {
        loadCustomers(inputValue, gstCustomersOnly);
    }, [inputValue]);

    useEffect(() => {
        loadProducts("");
        loadCustomers("", gstCustomersOnly);
        loadStores();
    }, []);

    useEffect(() => {
        if (!lastOrderNumber || !userData?.userId) return;
        const { bill, suggestedNextIndexNo, scopedToUserId } = lastOrderNumber.data;
        const nextIndexNo = bill ? suggestedNextIndexNo : `${String(scopedToUserId).padStart(2, "0")}${String(suggestedNextIndexNo).padStart(4, "0")}`;
        window.api.saveNextIndexNo({
            cashierId: userData.userId,
            nextIndexNo: nextIndexNo
        });
    }, [lastOrderNumber, userData?.userId]);

    useKeyboardShortcuts({
        canUsePos: dayAccess.canUsePos,
        handleSubmit,
        handleGenerateBill,
        openPaymentCollection,
        handleLogout,
        handleRemoveOfferSet,
        navigate,
        toggleDeleteDialog,
        onDelete,
        toggleOfferChoiceModal,
        toggleComboModal,
        toggleFOCModal,
        togglePaymentModal,
        customerNumberRef,
        customerNameRef,
        productSearchRef,
        barcodeSearchRef,
        gstNumberRef,
        holdBillSelectRef,
        gstCustomersOnly,
        handleGstFilterChange,
        selectedItems,
        selectedRow,
        offerChoiceOpen,
        comboOfferOpen,
        focOfferOpen,
        showDeleteDialog,
        isSavingBillLoading,
        cartRows,
        showPaymentModal,
        showWheelTicket,
        toggleShortcutModal,
        handleQuantityChange,
        toggleMenuDrawer,
        handleBillForm,
        setShowSaleReturnModal,
        setRating,
        toggleRemarkModal,
        handleProductFilter,
    });

    // const quickActions = [
    //     {
    //         title: "Info",
    //         icon: "tabler:info-circle",
    //         color: "text-blue-600",
    //         shortcut: "F1",
    //         onClick: () => toggleShortcutModal(),
    //     },
    //     {
    //         title: "Invoices",
    //         icon: "tabler:cash",
    //         color: "text-purple-600",
    //         shortcut: "Alt + I",
    //         onClick: () => navigate("/collect-payments"),
    //     },
    //     {
    //         title: "Collection",
    //         icon: "tabler:report-analytics",
    //         color: "text-orange-600",
    //         shortcut: "Alt + R",
    //         onClick: () => navigate("/collection-report"),
    //     },
    //     {
    //         title: buttonText,
    //         icon: buttonText === "Start Day" ? "tabler:sunrise" : "tabler:sunset",
    //         color: buttonText === "Start Day" ? "text-amber-500" : "text-red-500",
    //         shortcut: "Alt + D",
    //         disabled: buttonText === "Day Closed",
    //         onClick: handleBillForm,
    //     },
    //     {
    //         title: "Advance Slips",
    //         icon: "tabler:file-dollar",
    //         color: "text-green-600",
    //         shortcut: "Alt + A",
    //         onClick: () => navigate("/advance-slips"),
    //     },
    //     {
    //         title: "Menu",
    //         icon: "tabler:menu-2",
    //         color: "text-blue-600",
    //         shortcut: "Alt + M",
    //         onClick: () => toggleMenuDrawer(),
    //     },
    // ];

    useEffect(() => {
        const handleWindowError = (event) => {
            logPosError(event.error || event.message, {
                type: "window-error",
                source: "window.onerror",
                details: {
                    filename: event.filename,
                    line: event.lineno,
                    column: event.colno,
                },
            });
        };

        const handleUnhandledRejection = (event) => {
            logPosError(event.reason, {
                type: "unhandled-rejection",
                source: "unhandledrejection",
            });
        };

        window.addEventListener("error", handleWindowError);
        window.addEventListener("unhandledrejection", handleUnhandledRejection);

        return () => {
            window.removeEventListener("error", handleWindowError);
            window.removeEventListener("unhandledrejection", handleUnhandledRejection);
        };
    }, []);

    return (
        <>
            {dayAccess.loading && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center bg-header-background">
                    <KitLineLoader isLoading label="Checking day session..." />
                </div>
            )}

            {!dayAccess.loading && !dayAccess.canUsePos && (
                <StartDayScreen
                    status={dayAccess.status}
                    dayBills={dayBills}
                    onStartDayClick={() => setShowStartDayModal(true)}
                    onDayStarted={() => refreshDayAccess({ silent: true })}
                    onStartDayComplete={handleStartDayComplete}
                    onLogout={handleLogout}
                    showStartDayModal={showStartDayModal}
                    onCloseStartDayModal={() => setShowStartDayModal(false)}
                    onRefresh={refreshCashierLogs}
                />
            )}

            {!dayAccess.loading && dayAccess.canUsePos && (
                <>
                    {(isSyncProductLoading) && (
                        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                            <KitLineLoader isLoading label="Downloading products..." />
                        </div>
                    )}

                    {(isSyncCustomerLoading) && (
                        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                            <KitLineLoader isLoading label="Downloading customers..." />
                        </div>
                    )}

                    {(isSyncStoreLoading) && (
                        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                            <KitLineLoader isLoading label="Downloading stores..." />
                        </div>
                    )}

                    <div className="flex h-full min-h-0 flex-col overflow-hidden p-3" style={{ minWidth: 1400 }}>
                        <div className="mb-5 flex shrink-0 justify-between items-center gap-2 pt-3">
                            <div className="flex gap-2">
                                <Tooltip title="Show GST customers only">
                                    <div className="flex items-center">
                                        <span className="text-xs text-third-600 mr-1">GST</span>

                                        <Switch
                                            checked={gstCustomersOnly}
                                            onChange={(e) =>
                                                handleGstFilterChange(e.target.checked)
                                            }
                                            size="small"
                                        />
                                    </div>
                                </Tooltip>
                                <div className="flex items-center gap-1">
                                    <label className="text-sm">Number:</label>
                                    <Controller
                                        name="phone"
                                        control={control}
                                        render={({ field: { value, onChange, onBlur } }) => (
                                            <div className="w-56 flex flex-col relative">
                                                <KitCreatableSelect
                                                    ref={customerNumberRef}
                                                    autoFocus
                                                    placeholder="Search Customer"
                                                    placeholderFontSize={14}
                                                    inputFontSize={14}
                                                    size="small"
                                                    isClearable
                                                    options={customerOptions}
                                                    value={value ? { label: value, value } : null}
                                                    inputValue={inputValue}
                                                    error={!!errors.phone}
                                                    onKeyDown={(event) => {
                                                        if (blurOnEscape(event, customerNumberRef)) return;

                                                        if (event.key === "Enter") {
                                                            customerSelectionModeRef.current = "enter";
                                                            window.setTimeout(() => customerNameRef.current?.focus(), 0);
                                                        }
                                                    }}
                                                    onInputChange={(value, meta) => {
                                                        if (meta.action === "input-change") {
                                                            const digits = value.replace(/\D/g, "").slice(0, 10);
                                                            setInputValue(digits);
                                                            setValue("name", "");
                                                            return digits;
                                                        }
                                                        return value;
                                                    }}
                                                    onBlur={() => {
                                                        if (inputValue && inputValue !== value) {
                                                            onChange(inputValue);
                                                        }
                                                        onBlur();
                                                    }}
                                                    onChange={(option) => {
                                                        if (!option) {
                                                            onChange("");
                                                            setCustomerId(null);
                                                            setValue("name", "", {
                                                                shouldValidate: true,
                                                                shouldDirty: true,
                                                                shouldTouch: true,
                                                            });
                                                            if (gstCustomersOnly) {
                                                                setValue("gstNumber", "", {
                                                                    shouldValidate: true,
                                                                    shouldDirty: true,
                                                                    shouldTouch: true,
                                                                });
                                                            }
                                                            customerSelectionModeRef.current = null;
                                                            return;
                                                        }
                                                        onChange(option.label);
                                                        setCustomerId(option.value);
                                                        setValue("name", option.name ?? "", {
                                                            shouldValidate: true,
                                                            shouldDirty: true,
                                                            shouldTouch: true,
                                                        });
                                                        if (gstCustomersOnly) {
                                                          setValue("gstNumber", option.gstNumber ?? "", {
                                                              shouldValidate: true,
                                                              shouldDirty: true,
                                                              shouldTouch: true,
                                                          });
                                                         }
                                                        setInputValue("");

                                                        const nextTarget = customerSelectionModeRef.current === "enter"
                                                            ? customerNameRef
                                                            : barcodeSearchRef;
                                                        customerSelectionModeRef.current = null;

                                                        window.setTimeout(() => nextTarget.current?.focus(), 0);
                                                    }}
                                                />
                                                <ShortcutBadge shortcut="C" />
                                                {errors.phone && (
                                                    <div className="absolute left-0 top-full mt-0.5 text-xs text-red-600">
                                                        {" "}
                                                        {errors.phone?.message}{" "}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    />
                                    {/* {phone?.length === 10 && (
                                        <Chip
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            label={
                                                loyaltyBalanceLoading
                                                    ? "Loyalty: ..."
                                                    : `Loyalty: ${Number(loyaltyBalance?.balance ?? 0)} pts (≈ ${priceFormat(loyaltyBalance?.rupeeValueAtCurrentRate ?? 0)})`
                                            }
                                        />
                                    )} */}
                                    <WheelCouponBadge customerPhone={phone} storeId={POS_STORE_ID} />
                                </div>
                                <div className="flex items-center gap-1">
                                    <label className="text-sm">Name:</label>
                                    <Controller
                                        name="name"
                                        control={control}
                                        render={({ field: { value, onChange } }) => (
                                            <div className="flex flex-col relative">
                                                <KitTextField
                                                    inputRef={customerNameRef}
                                                    fullWidth
                                                    size="small"
                                                    height="32px"
                                                    placeholder="Enter Name"
                                                    placeholderFontSize={14}
                                                    value={value}
                                                    onKeyDown={(event) => {
                                                        if (blurOnEscape(event, customerNameRef)) return;

                                                        if (event.key === "Enter") {
                                                            event.preventDefault();
                                                            event.stopPropagation();
                                                            if (scanEnabled) {
                                                                document.activeElement?.blur();
                                                                return;
                                                            }
                                                            barcodeSearchRef.current?.focus();
                                                        }
                                                    }}
                                                    onChange={onChange}
                                                    error={!!errors.name}
                                                />
                                                <ShortcutBadge shortcut="N" />
                                                {errors.name && (
                                                    <div className="absolute left-0 top-full mt-0.5 text-xs text-red-600">
                                                        {" "}
                                                        {errors.name?.message}{" "}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    />
                                </div>

                                {gstCustomersOnly && (
                                    <div className="flex items-center gap-1">
                                        <label className="text-sm">GST Number:</label>
                                        <Controller
                                            name="gstNumber"
                                            control={control}
                                            render={({ field: { value, onChange, onBlur } }) => (
                                                <div className="w-56 flex flex-col relative">
                                                    <KitSelect
                                                        ref={gstNumberRef}
                                                        autoFocus
                                                        placeholder="Search GST Number"
                                                        placeholderFontSize={14}
                                                        inputFontSize={14}
                                                        size="small"
                                                        isClearable
                                                        options={gstCustomerOptions}
                                                        value={
                                                            value
                                                                ? (gstCustomerOptions.find(
                                                                      (option) => option.gstNumber === value
                                                                  ) ?? null)
                                                                : null
                                                        }
                                                        onChange={(option) => {
                                                            if (!option) {
                                                                onChange("");
                                                                setValue("name", "", {
                                                                    shouldValidate: true,
                                                                    shouldDirty: true,
                                                                    shouldTouch: true,
                                                                });
                                                                setValue("phone", "", {
                                                                    shouldValidate: true,
                                                                    shouldDirty: true,
                                                                    shouldTouch: true,
                                                                });

                                                                return;
                                                            }
                                                            onChange(option.gstNumber);
                                                            setValue("name", option.name ?? "", {
                                                                shouldValidate: true,
                                                                shouldDirty: true,
                                                                shouldTouch: true,
                                                            });
                                                            setValue("phone", option.phone ?? "", {
                                                                shouldValidate: true,
                                                                shouldDirty: true,
                                                                shouldTouch: true,
                                                            });
                                                        }}
                                                        onInputChange={(value) => {
                                                            loadCustomers(value, true);
                                                            return value;
                                                        }}
                                                        onBlur={onBlur}
                                                        error={!!errors.gstNumber}
                                                    />
                                                    <ShortcutBadge shortcut="Alt + G" />
                                                    {errors.gstNumber && (
                                                    <div className="absolute left-0 top-full mt-0.5 text-xs text-red-600">
                                                        {" "}
                                                        {errors.gstNumber.message}{" "}
                                                    </div>
                                                     )}
                                                </div>
                                            )}
                                        />
                                    </div>
                                )}

                                <div className="flex items-center gap-1">
                                    <label className="text-sm">Hold Bills:</label>
                                    <div className="w-56 relative">
                                        <ShortcutBadge shortcut="B" />
                                        <KitSelect
                                            ref={holdBillSelectRef}
                                            placeholder="Select hold bill"
                                            placeholderFontSize={14}
                                            inputFontSize={14}
                                            size="small"
                                            options={holdBillOptions}
                                            value={
                                                selectedHoldBill
                                                    ? (holdBillOptions.find(
                                                          (option) => option.value === selectedHoldBill
                                                      ) ?? null)
                                                    : null
                                            }
                                            isClearable
                                            onKeyDown={(event) => blurOnEscape(event, holdBillSelectRef)}
                                            onChange={(option) => handleRestoreHoldBill(option)}
                                        />
                                    </div>
                                </div>
                                <KitButton
                                    size="small"
                                    variant="outlined"
                                    className="w-auto"
                                    startIcon={<KitIcon icon="tabler:plus" />}
                                    onClick={handleAddHold}
                                    disabled={cartRows.length === 0}
                                >
                                    Add Hold
                                </KitButton>
                            </div>
                            {/* <div className="flex items-center gap-2">
                                {quickActions.map((item) => (
                                    <button
                                        key={item.title}
                                        onClick={item.onClick}
                                        className="relative w-24 h-14 shrink-0 flex flex-col items-center justify-center rounded-xl border border-gray-200 cursor-pointer transition-all duration-200 hover:border-primary hover:bg-primary-hover hover:shadow-sm"
                                    >
                                        {item.shortcut && (
                                            <ShortcutBadge shortcut={item.shortcut} />
                                        )}

                                        <KitIcon
                                            icon={item.icon}
                                            className={`text-xl ${item.color}`}
                                        />

                                        <span className="text-[11px] leading-4 font-medium text-center text-third-800 px-1">
                                            {item.title}
                                        </span>
                                    </button>
                                ))}
                            </div> */}
                            <button onClick={() => toggleMenuDrawer()} className="cursor-pointer">
                                <KitIcon
                                    icon="tabler:menu-2"
                                    className={`text-xl text-blue-600`}
                                />
                            </button>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col gap-3">
                        <div className="grid min-h-0 flex-1 grid-cols-12 gap-3">
                            <div className="col-span-9 h-full min-h-0 xl:col-span-9 2xl:col-span-10">
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        border: "1px solid #e0e0e0",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <Box sx={{ flex: 1, minHeight: 0 }}>
                                        <KitDataGrid
                                            rows={cartRows}
                                            columns={columns}
                                            hideFooter
                                            disableRowSelectionOnClick
                                            rowHeight={50}
                                            localeText={{ noRowsLabel: "No products added yet — search below to add one" }}
                                            getRowId={(row) => row.id}
                                            onRowClick={(params) => {
                                                setSelectedRow(params.row);
                                            }}
                                            getRowClassName={(params) => {
                                                if (params.row.id === selectedRow?.id) {
                                                    return "selected-row";
                                                }

                                                if (params.row.isOfferItem || params.row.comboStatus === "WITH_COMBO") {
                                                    return "offer-row";
                                                }

                                                return "";
                                            }}
                                            sx={(theme) => ({
                                                height: "100%",
                                                backgroundColor: theme.palette.background.paper,
                                                color: theme.palette.text.primary,
                                                "& .MuiDataGrid-row:hover": {
                                                    backgroundColor: theme.palette.mode === "dark"
                                                        ? "rgba(96, 165, 250, 0.18) !important"
                                                        : "#E3F2FD !important",
                                                    cursor: "pointer",
                                                },
                                                "& .offer-row": {
                                                    backgroundColor: theme.palette.mode === "dark"
                                                        ? "rgba(34, 197, 94, 0.14)"
                                                        : "#E8F5E9",
                                                },
                                                "& .offer-row:hover": {
                                                    backgroundColor: theme.palette.mode === "dark"
                                                        ? "rgba(34, 197, 94, 0.22)"
                                                        : "#DFF3E3",
                                                },
                                                "& .selected-row": {
                                                    backgroundColor: theme.palette.mode === "dark"
                                                        ? "rgba(59, 130, 246, 0.25) !important"
                                                        : "#d6ebfb !important",
                                                },
                                                "& .selected-row:hover": {
                                                    backgroundColor: theme.palette.mode === "dark"
                                                        ? "rgba(59, 130, 246, 0.25) !important"
                                                        : "#d6ebfb !important",
                                                },
                                            })}
                                        />
                                    </Box>

                                    <div className="mt-4 flex w-full items-end gap-2">
                                        <div ref={productSearchContainerRef} className="relative flex-1 min-w-0">
                                            <ShortcutBadge className="top-0" shortcut="P" />
                                            <KitSelect
                                                ref={productSearchRef}
                                                label="Product Search"
                                                placeholder="Search product"
                                                placeholderFontSize={14}
                                                inputFontSize={14}
                                                size="small"
                                                instanceId="slot-select"
                                                options={productOptions}
                                                value={selectedProduct}
                                                inputValue={productSearchInput}
                                                isLoading={false}
                                                isClearable
                                                menuPlacement="top"
                                                menuPosition="fixed"
                                                maxMenuHeight={320}
                                                components={{
                                                    Option: ProductOption,
                                                    // DropdownIndicator: ScanIndicator,
                                                    IndicatorSeparator: () => null,
                                                }}
                                                onKeyDown={(event) => blurOnEscape(event, productSearchRef)}
                                                onChange={(option) => {
                                                    setSelectedProduct(null);
                                                    if (option) {
                                                        const search = productSearchInputRef.current.trim();
                                                        const exactBarcodeMatch =
                                                            String(option.obj.barcode ?? "").trim() === search;

                                                        if ((/^\d{8,}$/.test(search) || SCALE_LABEL_PATTERN.test(search)) && !exactBarcodeMatch) {
                                                            resolveScannedBarcode(search, "product-search");
                                                            return;
                                                        }

                                                        productSearchInputRef.current = "";
                                                        setProductSearchInput("");
                                                        handleProductSelect(option.obj);
                                                        if (!scanEnabled) {
                                                            window.setTimeout(() => {
                                                                window.requestAnimationFrame(() => {
                                                                    quantityInputRefs.current
                                                                        .get(String(option.obj.id))
                                                                        ?.focus?.();
                                                                });
                                                            }, 0);
                                                        }
                                                        productSearchRef.current?.blur?.();
                                                        document.activeElement?.blur();
                                                    }
                                                }}
                                                onInputChange={(value, meta) => {
                                                    if (meta.action !== "input-change" || value === productSearchInputRef.current) {
                                                        return value;
                                                    }

                                                    productSearchInputRef.current = value;
                                                    setProductSearchInput(value);
                                                    loadProducts(value).catch(() => {
                                                        toast.error("Unable to load products. Please try again.");
                                                    });
                                                    return value;
                                                }}
                                            />
                                        </div>
                                        <div className="relative flex-1 min-w-0">
                                            <ShortcutBadge className="top-0" shortcut="F4" />
                                            <KitTextField
                                                inputRef={barcodeSearchRef}
                                                fullWidth
                                                size="small"
                                                height="32px"
                                                label="Barcode Scan"
                                                placeholder="Scan barcode"
                                                placeholderFontSize={14}
                                                value={barcodeSearchInput}
                                                onChange={(event) => {
                                                    const barcode = event.target.value;
                                                    setBarcodeSearchInput(barcode);
                                                    clearTimeout(barcodeSearchTimerRef.current);

                                                    if (/^\d{8,}$/.test(barcode.trim()) || SCALE_LABEL_PATTERN.test(barcode.trim())) {
                                                        barcodeSearchTimerRef.current = window.setTimeout(() => {
                                                            resolveScannedBarcode(barcode.trim());
                                                        }, 180);
                                                    }
                                                }}
                                                onKeyDown={(event) => {
                                                    if (blurOnEscape(event, barcodeSearchRef)) return;

                                                    if (event.key !== "Enter") return;

                                                    // Any length is allowed: a short barcode typed by hand is searched on Enter.
                                                    const barcode = barcodeSearchInput.trim();
                                                    if (!barcode) return;

                                                    event.preventDefault();
                                                    clearTimeout(barcodeSearchTimerRef.current);
                                                    resolveScannedBarcode(barcode);
                                                }}
                                            />
                                        </div>
                                        {/* <div className="relative shrink-0">
                                            <ShortcutBadge className="-top-5" shortcut="F" />
                                            <KitButton
                                                size="small"
                                                variant="outlined"
                                                className="w-auto"
                                                startIcon={<KitIcon icon="tabler:adjustments" />}
                                                onClick={() => handleProductFilter()}
                                            >
                                                Filter
                                            </KitButton>
                                        </div> */}
                                        <div className="relative shrink-0">
                                            <ShortcutBadge className="-top-5" shortcut="F10" />
                                            <Tooltip title="Scan Product">
                                                <div className="flex items-center mb-1">
                                                    <span className="text-xs text-third-600 mr-1">Scan</span>
                                                    <Switch
                                                        checked={scanEnabled}
                                                        onChange={(e) => setBarcodeScanMode(e.target.checked)}
                                                        size="small"
                                                    />
                                                </div>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </Paper>
                            </div>

                            <div className="col-span-3 flex min-h-0 flex-col gap-3 xl:col-span-3 2xl:col-span-2">
                                <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid #e0e0e0", height: "100%", minHeight: 0, display: "flex", flexDirection: "column", overflowY: redeemEnabled ? "auto" : "hidden" }}>
                                    <div className="flex flex-1 flex-col justify-evenly gap-2 px-3 py-3 text-center">
                                        <div className="flex flex-col items-center gap-0.5">
                                            <div className="text-sm font-semibold text-third-500">Total Amount</div>
                                            <div className="text-base text-third font-semibold">{priceFormat(mrpTotal)}</div>
                                        </div>
                                        <Divider />
                                        <div className="flex flex-col items-center gap-0.5">
                                            <div className="text-sm font-semibold text-third-500">Pay Amount</div>
                                            <div className="text-base text-third font-semibold">{priceFormat(totalPay)}</div>
                                        </div>
                                        {schemeDiscountOnScreen > 0 && (
                                            <div className="flex flex-col items-center gap-0.5">
                                                <div className="text-sm font-semibold text-third-500">Scheme Discount</div>
                                                <div className="text-base font-semibold text-green-700">
                                                    - {priceFormat(schemeDiscountOnScreen)}
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex flex-col items-center gap-0.5 rounded-lg bg-blue-50 py-2">
                                            <div className="text-sm font-semibold text-third-500">Net Payable</div>
                                            <div className="text-xl text-primary font-bold">
                                                {priceFinalAmountFormat(Math.max(0, Number(netPayable || 0) - schemeDiscountOnScreen))}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center gap-0.5">
                                            <div className="text-sm font-semibold text-third-500">Items Qty</div>
                                            <div className="text-base text-third font-semibold">{itemCount}</div>
                                        </div>
                                        {/* <Divider />
                                        <div className="flex flex-col justify-center items-center gap-1">
                                            <div className="text-lg font-semibold text-third-400">Total Savings</div>
                                            <div className="text-base text-primary font-semibold">
                                                {priceFormat(discountTotal)}
                                            </div>
                                        </div> */}
                                    </div>
                                    <hr className="border-gray-300" />
                                    <LoyaltyRewardPanel
                                        balance={loyaltyBalance}
                                        balanceLoading={loyaltyBalanceLoading}
                                        previewLoading={loyaltyPreviewLoading}
                                        earnedPoints={Number(loyaltyPreview?.earnedPoints ?? 0)}
                                        rewardRows={cartRows.filter((row) => row.isLoyaltyReward)}
                                        disabled={!isOnline || String(phone || "").length !== 10}
                                        disabledReason={
                                            !isOnline
                                                ? "Reward items need internet"
                                                : "Enter the customer number to use loyalty points"
                                        }
                                        onOpen={() => {
                                            if (!requireDayStarted()) return;
                                            setShowRewardModal(true);
                                        }}
                                    />
                                </Paper>
                                <div data-shortcut-ignore className="flex items-center gap-2">
                                    <KitButton
                                        type="button"
                                        variant="outlined"
                                        className="w-full"
                                        onClick={() => {
                                            if (!requireDayStarted()) return;
                                            setShowWheelTicket(true);
                                        }}
                                        disabled={isSavingBillLoading}
                                    >
                                        {wheelSelection ? `Wheel: ${wheelSelection.ticketNo} · ${wheelSelection.couponCode}` : "Wheel Ticket"}
                                    </KitButton>
                                    {wheelSelection && (
                                        <KitButton
                                            type="button"
                                            variant="text"
                                            className="w-auto"
                                            onClick={() => setWheelSelection(null)}
                                        >
                                            Remove
                                        </KitButton>
                                    )}
                                </div>
                                <KitButton
                                    type="button"
                                    variant="contained"
                                    className="w-full md:w-auto"
                                    onClick={openPaymentCollection}
                                    disabled={isSavingBillLoading || cartRows.length === 0}
                                >
                                    Collect Payment (F2)
                                </KitButton>
                            </div>
                        </div>
                        <div className="grid min-h-0 grid-cols-12 gap-3 overflow-hidden" style={{ flex: "0 0 clamp(128px, 22%, 190px)" }}>
                            <div className="col-span-9 2xl:col-span-10 h-full">
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 h-full">
                                    <div className="col-span-3 h-full">
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 1.5,
                                                borderRadius: 2,
                                                border: "1px solid #e0e0e0",
                                                height: "100%",
                                                display: "flex",
                                                flexDirection: "column",
                                            }}
                                        >
                                            <div className="flex flex-col gap-2">
                                                {isNewCustomer && (
                                                    <div className="text-start">
                                                        <span className="bg-[#bbf89c] rounded-md px-2 py-1 text-xs capitalize">
                                                            New Customer
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="text-sm">
                                                    Last Order:
                                                    <span className="font-semibold ml-1">
                                                        {isOnline
                                                            ? (() => {
                                                                const days = Number(lastOrderStats?.data?.lastOrder?.daysSinceLastOrder);

                                                                if (Number.isNaN(days)) return "N/A";
                                                                if (days === 0) return "Today";
                                                                if (days === 1) return "1 day ago";

                                                                return `${days} days ago`;
                                                            })()
                                                            : selectedCustomerProfile?.customer?.lastPurchaseDate
                                                                ? `${formatDistanceToNow(new Date(selectedCustomerProfile.customer.lastPurchaseDate), { addSuffix: true })}`
                                                                : "N/A"}
                                                    </span>
                                                </div>
                                                <div className="text-sm">
                                                    AOV: <span className="font-semibold">
                                                        {isOnline
                                                            ? priceFormat(lastOrderStats?.data?.lastOrder?.amount || 0)
                                                            : priceFormat(selectedCustomerProfile?.avgInvoiceValue || 0)}
                                                    </span>
                                                </div>
                                                <div className="text-sm">
                                                    Remark: <span className="font-semibold">
                                                        {isOnline
                                                            ? (lastOrderStats?.data?.lastFeedback?.customerRemark ?? "N/A")
                                                            : selectedCustomerProfile?.customer?.remark}
                                                    </span>
                                                </div>
                                                <div className="text-sm">
                                                    Rating: <span className="font-semibold">
                                                        {isOnline
                                                            ? (lastOrderStats?.data?.lastFeedback?.storeRating ?? "N/A")
                                                            : selectedCustomerProfile?.customer?.storeRating}
                                                    </span>
                                                </div>
                                            </div>
                                        </Paper>
                                    </div>
                                    <div className="col-span-9">
                                        <Paper
                                            elevation={0}
                                            sx={{ borderRadius: 2, border: "1px solid #e0e0e0", height: "100%" }}
                                        >
                                            <div className="text-xs capitalize px-4 pt-3 pb-2">RECOMMENDATIONS</div>
                                            <hr className="border-gray-300" />
                                            <div className="px-4 py-3">
                                                <div className="text-sm font-semibold mb-2 truncate" title={"deoooo"}>
                                                    deoooo
                                                </div>
                                                <div className="flex gap-3">
                                                    <img
                                                        src={PlaceholderImage}
                                                        alt="image"
                                                        width={60}
                                                        height="auto"
                                                        className="object-contain"
                                                    />
                                                    <div className="flex flex-col justify-center items-center text-center gap-3">
                                                        <div className="flex">
                                                            <span>{priceFormat("200")}</span>
                                                            <span className="text-gray-400 line-through ml-2">/{priceFormat("0")} </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Paper>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-3 2xl:col-span-2">
                                <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid #e0e0e0", p: 1.5, height: "100%" }}>
                                    <div className="relative flex flex-col items-center gap-4">
                                        <ShortcutBadge className="-top-2! -right-2!" shortcut="Alt + 0 ~ 5" />
                                        <div className="text-base font-semibold text-third">Store Feedback</div>
                                        <div className="flex flex-col items-center text-center">
                                            <div className="text-2xl font-semibold text-third">{rating || 0}</div>
                                            <Rating
                                                value={rating}
                                                precision={0.5}
                                                onChange={(event, newValue) => {
                                                    setRating(newValue ?? 0);
                                                }}
                                                size="large"
                                                sx={{ fontSize: 28 }}
                                            />
                                        </div>
                                        <div className="w-full relative">
                                            <ShortcutBadge shortcut="W" />
                                            <KitButton
                                                type="button"
                                                variant="contained"
                                                size="small"
                                                className="w-full"
                                                onClick={() => setShowRemarkDialog(true)}
                                            >
                                                Write Remark
                                            </KitButton>
                                        </div>
                                    </div>
                                </Paper>
                            </div>
                        </div>
                        </div>
                    </div>

                    <KitShow show={isKOTModalOpen}>
                        <KOTPrintModal
                            isOpen={isKOTModalOpen}
                            autoPrint={isAutoPrintingInvoice}
                            onClose={() => {
                                setIsKOTModalOpen(false);
                                setIsAutoPrintingInvoice(false);
                                if (focusCustomerNumberAfterBillRef.current) {
                                    focusCustomerNumberAfterBillRef.current = false;
                                    window.setTimeout(() => {
                                        window.requestAnimationFrame(() => customerNumberRef.current?.focus?.());
                                    }, 0);
                                }
                            }}
                            selectedItems={selectedItems}
                        />
                    </KitShow>

                    <KitShow show={showDeleteDialog}>
                        <KitDeleteDialog
                            isOpen={showDeleteDialog}
                            onClose={toggleDeleteDialog}
                            title={`Delete the product`}
                            subTitle={`Are you sure to delete this Product?`}
                            onDelete={onDelete}
                            isBtnLoading={false}
                        />
                    </KitShow>

                    <KitShow show={offerChoiceOpen}>
                        <OfferChoiceModal
                            open={offerChoiceOpen}
                            offer={selectedOffer}
                            onClose={toggleOfferChoiceModal}
                            onApply={handleOfferSelection}
                            onBuyWithoutOffer={handleBuyWithoutOffer}
                            showBuyWithoutOffer={showBuyWithoutOffer}
                        />
                    </KitShow>

                    <KitShow show={comboOfferOpen}>
                        <ComboOfferModal
                            open={comboOfferOpen}
                            onClose={toggleComboModal}
                            selectedProduct={pendingProduct}
                            onApply={handleComboOfferSelection}
                            onBuyWithoutOffer={handleBuyWithoutCombo}
                        />
                    </KitShow>

                    <KitShow show={focOfferOpen}>
                        <FOCOfferModal
                            open={focOfferOpen}
                            onClose={toggleFOCModal}
                            selectedProduct={pendingProduct}
                            onApply={handleFOCOfferSelection}
                            onBuyWithoutOffer={handleBuyWithoutFOC}
                        />
                    </KitShow>

                    <KitShow show={showShortcutModal}>
                        <CashierFunctionsInfoModal
                            open={showShortcutModal}
                            onClose={toggleShortcutModal}
                        />
                    </KitShow>

                    <KitShow show={showPaymentModal}>
                        <PaymentCollectionModal
                            open={showPaymentModal}
                            onClose={togglePaymentModal}
                            customerName={customerName}
                            customerPhone={phone}
                            invoiceTotal={totalPay}
                            discount={discountTotal}
                            loyaltyRedeemPoints={redeemPoints}
                            loyaltyRedeemDiscount={redeemDiscount}
                            netPayable={netPayable}
                            cartRows={cartRows}
                            storeId={POS_STORE_ID}
                            onSyncSchemeItems={handleSyncSchemeItems}
                            appliedSchemes={appliedSchemes}
                            onAppliedSchemesChange={setAppliedSchemes}
                            onEnsureWheelItem={handleEnsureWheelItem}
                            wheelSelection={wheelSelection}
                            onGenerateInvoice={handleGenerateBill}
                            isSaving={isSavingBillLoading}
                            rating={rating}
                            onRatingChange={setRating}
                            remark={remark}
                            onRemarkChange={setRemark}
                        />
                    </KitShow>

                    {showRewardModal && (
                        <LoyaltyRewardModal
                            open
                            onClose={() => setShowRewardModal(false)}
                            customerPhone={String(phone || "").trim()}
                            storeId={POS_STORE_ID}
                            current={cartRows.filter((row) => row.isLoyaltyReward)}
                            onApply={handleApplyRewards}
                        />
                    )}

                    {showWheelTicket && (
                        <WheelTicketModal
                            open
                            onClose={() => setShowWheelTicket(false)}
                            customerPhone={phone}
                            storeId={POS_STORE_ID}
                            items={cartRows.map((item) => ({
                                itemCode: item.itemCode || item.productCode,
                                itemName: item.productName || item.itemName,
                                qty: Number(item.quantity || 0),
                                mrp: roundToDecimals(item.latestMRP ?? item.mrp ?? 0),
                                salePrice: roundToDecimals(
                                    item.isOfferItem ? 0 : (item.latestSalePrice ?? item.salePrice ?? item.price ?? 0)
                                ),
                                isOfferFreeItem: Boolean(item.isOfferItem),
                            }))}
                            cartItemCodes={cartRows.map((row) =>
                                String(row.itemCode ?? row.productCode ?? "").trim().toLowerCase()
                            )}
                            onSelect={handleWheelPick}
                        />
                    )}

                    <KitShow show={showBillConfirmation}>
                        <KitDeleteDialog
                            isOpen={showBillConfirmation}
                            onClose={handleCancelBillConfirmation}
                            title="Confirm Bill"
                            subTitle="Do You Want to Save This Bill?"
                            onDelete={handleConfirmGenerateBill}
                            isBtnLoading={isSavingBillLoading}
                            cancelButtonText="No"
                        />
                    </KitShow>

                    <SaleReturnModal
                        open={showSaleReturnModal}
                        onClose={() => setShowSaleReturnModal(false)}
                    />

                    <MenuDrawer
                        isOpen={showMenuDrawer}
                        onClose={() => setShowMenuDrawer(false)}
                        userData={userData}
                        handleLogout={handleLogout}
                        setIsSyncProductLoading={setIsSyncProductLoading}
                        setIsSyncCustomerLoading={setIsSyncCustomerLoading}
                        setIsSyncStoreLoading={setIsSyncStoreLoading}
                        toggleShortcutModal={toggleShortcutModal}
                        setShowSaleReturnModal={setShowSaleReturnModal}
                        loadProducts={loadProducts}
                        loadCustomers={loadCustomers}
                        loadStores={loadStores}
                        buttonText={buttonText}
                        handleBillForm={handleBillForm}
                    />

                    <KitShow show={isBillFormModalOpen}>
                        <BillFormModal
                            isOpen={isBillFormModalOpen}
                            onClose={toggleBillFormModal}
                            onDayStatusChange={loadDayStatus}
                            onRefresh={refreshCashierLogs}
                            onStartDayComplete={handleStartDayComplete}
                            onEndDayComplete={handleEndDayComplete}
                            onShowSettlementSlip={setSettlementSlip}
                            dayStatus={buttonText}
                        />
                    </KitShow>

                    <KitShow show={showRemarkDialog}>
                        <RemarkModal
                            isOpen={showRemarkDialog}
                            onClose={toggleRemarkModal}
                            remark={remark}
                            setRemark={setRemark}
                        />
                    </KitShow>

                    <KitShow show={showProductFilterModal}>
                        <ProductFilterModal
                            isOpen={showProductFilterModal}
                            onClose={toggleProductFilterModal}
                            products={productsList}
                            cartRows={cartRows}
                            onAddProduct={handleProductSelect}
                        />
                    </KitShow>

                    <KitShow show={isWarningModalOpen}>
                        <WarningModal
                            isOpen={isWarningModalOpen}
                            onClose={() => {
                                toggleWarningModal();
                                setWarningProduct(null);
                            }}
                            product={warningProduct}
                        />
                    </KitShow>

                    <KitShow show={isPriceLayerModalOpen}>
                        <PriceLayerModal
                            isOpen={isPriceLayerModalOpen}
                            productName={pendingPriceLayerProduct?.product?.productName}
                            priceLayers={pendingPriceLayerProduct?.priceLayers || []}
                            selectedPriceLayerId={selectedPriceLayerId}
                            onSelectedPriceLayerChange={setSelectedPriceLayerId}
                            onClose={closePriceLayerModal}
                            onSave={savePriceLayerSelection}
                        />
                    </KitShow>

                    <KitShow show={Boolean(unavailableBarcode)}>
                        <WarningBarcodeModal
                            isOpen={Boolean(unavailableBarcode)}
                            onClose={() => setUnavailableBarcode("")}
                            barcode={unavailableBarcode}
                        />
                    </KitShow>

                    <KitShow show={showAddHoldDialog}>
                        <HoldModal
                            isOpen={showAddHoldDialog}
                            onClose={toggleAddHoldModal}
                            onSave={handleSaveHoldBill}
                        />
                    </KitShow>

                </>
            )}

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

            <KitShow show={isDayBillPrintModalOpen}>
                <DayBillPrintModal
                    isOpen={isDayBillPrintModalOpen}
                    onClose={closeDayBillPrintModal}
                    payload={dayBillToPrint}
                />
            </KitShow>

            <KitShow show={Boolean(settlementSlip)}>
                <SettlementSlipModal
                    isOpen={Boolean(settlementSlip)}
                    onClose={closeSettlementSlip}
                    slip={settlementSlip}
                    store={posStore}
                />
            </KitShow>
        </>
    );
}