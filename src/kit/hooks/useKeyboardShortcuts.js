import { useEffect } from "react";
import { toast } from "react-toastify";

export default function useKeyboardShortcuts({
    canUsePos = true,
    handleSubmit,
    handleGenerateBill,
    openPaymentCollection,
    handleCustomerSync,
    handleProductSync,
    handleStoreSync,
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
    toggleShortcutModal,
    handleQuantityChange,
    toggleMenuDrawer,
    handleBillForm,
    setShowSaleReturnModal,
    setRating,
    closeMenuDrawer,
    toggleRemarkModal,
    handleExportCsv,
    handleExportXlsx,
    handleProductFilter,
    handleUnlockInvoice,
}) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();

            if (!canUsePos) {
                return;
            }

            if (showPaymentModal) {
                return;
            }

            /* -------------------------
                    + / - Quantity
            ------------------------- */

            if ((e.key === "+" || e.key === "=" || e.code === "NumpadAdd") && selectedRow) {
                e.preventDefault();
                handleQuantityChange(selectedRow.id, selectedRow.quantity + 1, "increment");
                return;
            }

            if ((e.key === "-" || e.code === "NumpadSubtract") && selectedRow) {
                e.preventDefault();
                const row = cartRows.find(r => r.id === selectedRow.id);
                if (!row) return;
                if (row.quantity <= 1) {
                    toggleDeleteDialog();
                    return;
                }
                handleQuantityChange(selectedRow.id, selectedRow.quantity - 1, "decrement");
                return;
            }

            /* -------------------------
                  ALT Shortcuts
            ------------------------- */
            if (e.altKey) {
                e.preventDefault();
                if (e.key === "Backspace") {
                    navigate?.("/dashboard");
                    return;
                }

                switch (key) {
                    case "g":
                        if (gstCustomersOnly) {
                            gstNumberRef.current?.focus();
                            return;
                        }
                        handleGstFilterChange?.(true);
                        return;

                    case "x":
                        if (selectedRow) {
                            handleRemoveOfferSet?.(selectedRow.id);
                        }
                        return;

                    case "0":
                        setRating?.(0);
                        return;

                    case "1":
                        setRating?.(1);
                        return;

                    case "2":
                        setRating?.(2);
                        return;

                    case "3":
                        setRating?.(3);
                        return;

                    case "4":
                        setRating?.(4);
                        return;

                    case "5":
                        setRating?.(5);
                        return;

                    default:
                        return;
                }
            }

            if (e.key === "Delete" && selectedRow) {
                e.preventDefault();
                handleRemoveOfferSet?.(selectedRow.id);
                return;
            }

            // Ignore typing inside inputs except ESC
            const tag = document.activeElement?.tagName;

            const typing =
                tag === "INPUT" ||
                tag === "TEXTAREA" ||
                document.activeElement?.isContentEditable;

            const isFunctionKey = /^F\d{1,2}$/i.test(e.key);
            const isCtrlShortcut = e.ctrlKey || e.metaKey;

            if (typing && !isFunctionKey && !isCtrlShortcut && e.key !== "Escape") {
                return;
            }

            /* -------------------------
                    Function Keys
            ------------------------- */

            const closeDrawerAndRun = (action) => {
                if (closeMenuDrawer) {
                    closeMenuDrawer();
                }
                action?.();
            };

            switch (e.key) {
                case "F1":
                    e.preventDefault();
                    closeDrawerAndRun(toggleShortcutModal);
                    return;

                case "F2":
                    e.preventDefault();
                    if (!isSavingBillLoading && cartRows.length > 0) {
                        closeDrawerAndRun(openPaymentCollection);
                    }
                    return;

                case "F4":
                    e.preventDefault();
                    barcodeSearchRef.current?.focus();
                    return;

                case "F5":
                    e.preventDefault();
                    closeDrawerAndRun(() => setShowSaleReturnModal(true));
                    return;

                case "F6":
                    e.preventDefault();
                    closeDrawerAndRun(handleBillForm);
                    return;

                case "F7":
                    e.preventDefault();
                    closeDrawerAndRun(handleProductSync);
                    return;

                case "F8":
                    e.preventDefault();
                    closeDrawerAndRun(handleCustomerSync);
                    return;

                case "F9":
                    e.preventDefault();
                    closeDrawerAndRun(handleStoreSync);
                    return;

                case "p":
                    e.preventDefault();
                    productSearchRef.current?.focus();
                    return;

                case "a":
                    closeDrawerAndRun(() => navigate("/advance-slips"));
                    return;

                case "i":
                    e.preventDefault();
                    closeDrawerAndRun(() =>
                        handleUnlockInvoice?.("/collect-payments")
                    );
                    return;

                case "r":
                    closeDrawerAndRun(() => navigate("/collection-report"));
                    return;

                // case "h":
                //     closeDrawerAndRun(() => navigate("/sale-returns"));
                //     return;

                case "l":
                    handleLogout();
                    return;

                case "m":
                    toggleMenuDrawer?.();
                    return;

                case "w":
                    toggleRemarkModal?.();
                    return;

                case "f":
                    handleProductFilter?.();
                    return;

                case "n":
                    e.preventDefault();
                    customerNameRef.current?.focus();
                    return;
                    
                case "c":
                    e.preventDefault();
                    customerNumberRef.current?.focus();
                    return;

                case "b":
                    e.preventDefault();
                    holdBillSelectRef.current?.focus?.();
                    holdBillSelectRef.current?.inputRef?.focus?.();
                    return;

                default:
                    break;
            }

            /* -------------------------
                    CTRL Shortcuts
            ------------------------- */

            if (e.ctrlKey) {
                switch (key) {
                    case "d":
                        e.preventDefault();

                        if (selectedRow) {
                            toggleDeleteDialog();
                        }

                        return;

                    default:
                        break;
                }
            }

            if (e.shiftKey) {
                switch (key) {
                    case "c":
                        e.preventDefault();
                        handleExportCsv?.();
                        return;

                    case "x":
                        e.preventDefault();
                        handleExportXlsx?.();
                        return;

                    default:
                        break;
                }
            }

            /* -------------------------
                    Delete Dialog
            ------------------------- */

            if (showDeleteDialog) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    onDelete();
                    return;
                }

                if (e.key === "Escape") {
                    e.preventDefault();
                    toggleDeleteDialog();
                    return;
                }
            }

            /* -------------------------
                Other Keys
            ------------------------- */

            if (e.key === "Escape") {
                e.preventDefault();
                if (offerChoiceOpen) return toggleOfferChoiceModal();
                if (comboOfferOpen) return toggleComboModal();
                if (focOfferOpen) return toggleFOCModal();
                if (closeMenuDrawer) {
                    closeMenuDrawer();
                    return;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [
        canUsePos,
        cartRows,
        selectedRow,
        selectedItems,
        offerChoiceOpen,
        comboOfferOpen,
        focOfferOpen,
        showDeleteDialog,
        isSavingBillLoading,
        showPaymentModal,
        handleExportCsv,
        handleExportXlsx,
        toggleShortcutModal,
    ]);
}
