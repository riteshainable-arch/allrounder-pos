import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import useUser from "../hooks/useUser";
import { Role } from "../configs/general";
import {
    checkCashierDayAccess,
    DAY_STATUS,
    getLocalDayStatus,
    loadCashierDayBills,
} from "../utils/daySession";

const DaySessionContext = createContext({
    dayAccess: {
        loading: false,
        canUsePos: false,
        status: DAY_STATUS.NOT_STARTED,
    },
    dayBills: [],
    refreshDayAccess: async () => {},
});

export const useDaySessionContext = () => useContext(DaySessionContext);

export default function DaySessionProvider({ children }) {
    const userData = useUser();
    const location = useLocation();
    const cashierId = userData?.userId ?? userData?.id ?? null;
    const isCashier =
        String(userData?.role || "").toLowerCase() === Role.CASHIER.toLowerCase();
    const isLoggedIn = location.pathname !== "/";

    const hasCheckedRef = useRef(false);
    const cashierIdRef = useRef(cashierId);

    const [dayAccess, setDayAccess] = useState({
        loading: false,
        canUsePos: false,
        status: DAY_STATUS.NOT_STARTED,
    });
    const [dayBills, setDayBills] = useState([]);

    const refreshDayAccess = useCallback(
        async ({ silent = false } = {}) => {
            if (!isCashier || !cashierId) {
                setDayAccess({
                    loading: false,
                    canUsePos: false,
                    status: DAY_STATUS.NOT_STARTED,
                });
                setDayBills([]);
                return;
            }

            const showLoader = !silent && !hasCheckedRef.current;
            if (showLoader) {
                setDayAccess((prev) => ({ ...prev, loading: true }));
            }

            try {
                const bills = await loadCashierDayBills(cashierId);
                setDayBills(bills);

                const local = getLocalDayStatus(bills);
                setDayAccess({
                    loading: false,
                    canUsePos: local.status === DAY_STATUS.STARTED,
                    status: local.status,
                });

                const access = await checkCashierDayAccess(cashierId, bills);
                hasCheckedRef.current = true;
                setDayAccess({
                    loading: false,
                    canUsePos: access.canUsePos,
                    status: access.status,
                });
            } catch {
                hasCheckedRef.current = true;
                setDayAccess({
                    loading: false,
                    canUsePos: false,
                    status: DAY_STATUS.NOT_STARTED,
                });
            }
        },
        [cashierId, isCashier]
    );

    useEffect(() => {
        if (cashierId !== cashierIdRef.current) {
            hasCheckedRef.current = false;
            cashierIdRef.current = cashierId;
        }
    }, [cashierId]);

    useEffect(() => {
        if (!isLoggedIn) {
            hasCheckedRef.current = false;
            setDayAccess({
                loading: false,
                canUsePos: false,
                status: DAY_STATUS.NOT_STARTED,
            });
            setDayBills([]);
            return;
        }

        if (!isCashier || !cashierId || hasCheckedRef.current) {
            return;
        }

        refreshDayAccess({ silent: false });
    }, [isCashier, isLoggedIn, cashierId, refreshDayAccess]);

    return (
        <DaySessionContext.Provider value={{ dayAccess, dayBills, refreshDayAccess }}>
            {children}
        </DaySessionContext.Provider>
    );
}
