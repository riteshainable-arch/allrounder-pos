import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import useUser from "../hooks/useUser";
import { Role } from "../configs/general";
import { useAppBootstrapContext } from "./AppBootstrapProvider";
import {
    DEFAULT_STORE_ID,
    runEndDaySync,
    runPeriodicSync,
    syncCustomersLocal,
    syncProducts,
    syncStores,
    syncCustomers,
    SYNC_INTERVAL_MS,
} from "../utils/syncOperations";

const AutoSyncContext = createContext({
    triggerEndDaySync: async () => { },
});

export const useAutoSyncContext = () => useContext(AutoSyncContext);

export default function AutoSyncProvider({ children }) {
    const userData = useUser();
    const location = useLocation();
    const { isBootstrapReady } = useAppBootstrapContext();
    const isRunningRef = useRef(false);
    const hasSyncedCustomersRef = useRef(false);
    const hasLoggedInSyncRef = useRef(false);
    const cashierId = userData?.userId ?? userData?.id ?? null;
    const isCashier =
        String(userData?.role || "").toLowerCase() === Role.CASHIER.toLowerCase();
    const isLoggedIn = location.pathname !== "/";

    const runLoginSync = useCallback(async () => {
        if (!isCashier || !isLoggedIn || !navigator.onLine || isRunningRef.current) {
            return;
        }

        isRunningRef.current = true;
        try {
            await Promise.all([
                syncStores({ storeId: DEFAULT_STORE_ID }),
                syncProducts({ storeId: DEFAULT_STORE_ID, useChunks: true }),
                syncCustomers(),
            ]);
        } catch (error) {
            console.error("Login master-data sync failed:", error);
        } finally {
            isRunningRef.current = false;
        }
    }, [isCashier, isLoggedIn, userData]);

    const runBackgroundSync = useCallback(async () => {
        if (!isCashier || !isLoggedIn || !navigator.onLine || isRunningRef.current) {
            return;
        }

        isRunningRef.current = true;
        try {
            await runPeriodicSync({
                storeId: DEFAULT_STORE_ID,
                userData,
                includeProducts: false,
            });

            if (!hasSyncedCustomersRef.current) {
                hasSyncedCustomersRef.current = true;
                await syncCustomersLocal();
            }
        } catch (error) {
            console.error("Background sync failed:", error);
            hasSyncedCustomersRef.current = false;
        } finally {
            isRunningRef.current = false;
        }
    }, [isCashier, isLoggedIn, userData]);

    const triggerEndDaySync = useCallback(async () => {
        if (!isCashier || !cashierId) return;

        if (!navigator.onLine) {
            toast.message("No internet connection. End-day sync will retry when online.");
            return;
        }

        if (isRunningRef.current) return;

        isRunningRef.current = true;
        try {
            const results = await runEndDaySync({
                storeId: DEFAULT_STORE_ID,
                userData,
                cashierId,
            });

            const dayCount = results.dayBills?.totalItems ?? 0;
            const invoiceCount = results.invoices?.uploaded ?? 0;
            toast.success(
                `End-day sync completed.\nDay bills: ${dayCount}\nInvoices: ${invoiceCount}`
            );
        } catch (error) {
            toast.error(error?.message || "End-day sync failed.");
        } finally {
            isRunningRef.current = false;
        }
    }, [cashierId, isCashier, userData]);

    useEffect(() => {
        if (!isBootstrapReady || !isCashier || !isLoggedIn) {
            if (!isLoggedIn) {
                hasLoggedInSyncRef.current = false;
            }
            return undefined;
        }

        if (!hasLoggedInSyncRef.current) {
            hasLoggedInSyncRef.current = true;
            void runLoginSync();
        }

        void runBackgroundSync();
        const intervalId = setInterval(runBackgroundSync, SYNC_INTERVAL_MS);

        return () => {
            clearInterval(intervalId);
        };
    }, [isBootstrapReady, isCashier, isLoggedIn, runBackgroundSync, runLoginSync]);

    return (
        <AutoSyncContext.Provider value={{ triggerEndDaySync }}>
            {children}
        </AutoSyncContext.Provider>
    );
}
