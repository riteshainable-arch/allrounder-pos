import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import KitLineLoader from "../components/KitLineLoader";
import KitButton from "../components/KitButton/KitButton";
import useUser from "./useUser";
import storage from "./data/services/storage";
import { Role } from "../configs/general";
import { getElectronApi } from "../utils/electronApi";
import { DEFAULT_STORE_ID, runInitialSync } from "../utils/syncOperations";

export const INITIAL_SETUP_STORAGE_KEY = "allrounder_initial_setup_complete";

const AppBootstrapContext = createContext({
    isBootstrapReady: true,
});

export const useAppBootstrapContext = () => useContext(AppBootstrapContext);

const DB_POLL_INTERVAL_MS = 500;
const DB_POLL_MAX_ATTEMPTS = 60;

const waitForDatabase = async () => {
    const api = getElectronApi();
    if (!api.isDatabaseReady) {
        throw new Error("Database status check is not available. Restart the app.");
    }

    for (let attempt = 0; attempt < DB_POLL_MAX_ATTEMPTS; attempt += 1) {
        const status = await api.isDatabaseReady();
        if (status?.ready) {
            return status;
        }
        if (status?.error) {
            throw new Error(status.error);
        }
        await new Promise((resolve) => setTimeout(resolve, DB_POLL_INTERVAL_MS));
    }

    throw new Error("Local database failed to initialize. Restart the app and try again.");
};

const markInitialSetupComplete = () => {
    storage.setItem(INITIAL_SETUP_STORAGE_KEY, true);
};

const needsInitialSync = async () => {
    if (storage.getItem(INITIAL_SETUP_STORAGE_KEY)) {
        return false;
    }

    try {
        const api = getElectronApi();
        const [products, stores] = await Promise.all([
            api.getProducts(""),
            api.getStores(),
        ]);

        if ((products?.length ?? 0) > 0 && (stores?.length ?? 0) > 0) {
            markInitialSetupComplete();
            return false;
        }
    } catch {
        return true;
    }

    return true;
};

export default function AppBootstrapProvider({ children }) {
    const location = useLocation();
    const userData = useUser();
    const isLoggedIn = location.pathname !== "/";
    const isCashier =
        String(userData?.role || "").toLowerCase() === Role.CASHIER.toLowerCase();

    const bootstrapKeyRef = useRef(null);
    const hasBootstrappedRef = useRef(false);
    const [isBootstrapReady, setIsBootstrapReady] = useState(!isLoggedIn);
    const [isInitialSetupRunning, setIsInitialSetupRunning] = useState(false);
    const [progress, setProgress] = useState({
        label: "Preparing application...",
        detail: "",
        step: 0,
        totalSteps: 2,
        percent: 0,
    });
    const [errorMessage, setErrorMessage] = useState("");

    const runBootstrap = async () => {
        setErrorMessage("");

        await waitForDatabase();

        let shouldSync = false;
        if (isCashier) {
            shouldSync = await needsInitialSync();
        }

        if (shouldSync) {
            setIsInitialSetupRunning(true);
            setIsBootstrapReady(false);
            setProgress({
                label: "Preparing local database...",
                detail: "",
                step: 0,
                totalSteps: 2,
                percent: 0,
            });

            if (!navigator.onLine) {
                throw new Error(
                    "Internet connection is required for first-time setup. Connect and try again."
                );
            }

            await runInitialSync({
                storeId: DEFAULT_STORE_ID,
                onProgress: (update) => {
                    setProgress((prev) => ({
                        ...prev,
                        ...update,
                        detail:
                            update.detail ??
                            (update.total > 0
                                ? `${Number(update.current || 0).toLocaleString()} / ${Number(update.total).toLocaleString()}`
                                : prev.detail),
                    }));
                },
            });
            markInitialSetupComplete();
            setIsInitialSetupRunning(false);
        }

        hasBootstrappedRef.current = true;
        setIsBootstrapReady(true);
    };

    useEffect(() => {
        if (!isLoggedIn) {
            bootstrapKeyRef.current = null;
            hasBootstrappedRef.current = false;
            setIsInitialSetupRunning(false);
            setIsBootstrapReady(true);
            setErrorMessage("");
            return;
        }

        const bootstrapKey = String(userData?.userId ?? userData?.id ?? "guest");
        if (bootstrapKeyRef.current === bootstrapKey && hasBootstrappedRef.current) {
            return;
        }
        bootstrapKeyRef.current = bootstrapKey;

        runBootstrap().catch((error) => {
            setErrorMessage(error?.message || "Application setup failed.");
            setIsInitialSetupRunning(true);
            setIsBootstrapReady(false);
        });
    }, [isLoggedIn, isCashier, userData?.id, userData?.userId]);

    if (!isLoggedIn) {
        return (
            <AppBootstrapContext.Provider value={{ isBootstrapReady: true }}>
                {children}
            </AppBootstrapContext.Provider>
        );
    }

    if (!isBootstrapReady && isInitialSetupRunning) {
        return (
            <AppBootstrapContext.Provider value={{ isBootstrapReady: false }}>
                <div className="fixed inset-0 z-9999 flex items-center justify-center bg-white">
                    {errorMessage ? (
                        <Box
                            sx={{
                                width: 560,
                                bgcolor: "background.paper",
                                p: 3,
                                borderRadius: 2,
                                boxShadow: 6,
                                textAlign: "center",
                            }}
                        >
                            <Box sx={{ fontSize: 18, fontWeight: 600, mb: 1 }}>
                                Setup Failed
                            </Box>
                            <Box sx={{ color: "text.secondary", mb: 3 }}>{errorMessage}</Box>
                            <KitButton
                                variant="contained"
                                className="w-auto mx-auto"
                                onClick={() => {
                                    bootstrapKeyRef.current = null;
                                    hasBootstrappedRef.current = false;
                                    runBootstrap().catch((error) => {
                                        setErrorMessage(error?.message || "Application setup failed.");
                                    });
                                }}
                            >
                                Retry Setup
                            </KitButton>
                        </Box>
                    ) : (
                        <KitLineLoader isLoading {...progress} />
                    )}
                </div>
            </AppBootstrapContext.Provider>
        );
    }

    return (
        <AppBootstrapContext.Provider value={{ isBootstrapReady: true }}>
            {children}
        </AppBootstrapContext.Provider>
    );
}
