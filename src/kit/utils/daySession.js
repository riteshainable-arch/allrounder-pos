import { format } from "date-fns";
import { getCashierLogs } from "../hooks/data/cashierLog";

export const DAY_STATUS = {
    NOT_STARTED: "NOT_STARTED",
    STARTED: "STARTED",
    ENDED: "ENDED",
};

export const getTodayDate = () => format(new Date(), "yyyy-MM-dd");

export const getLocalDayStatus = (dayBills = [], today = getTodayDate()) => {
    const todayBill = dayBills.find((item) => item.date === today);

    if (!todayBill?.start) {
        return { status: DAY_STATUS.NOT_STARTED, todayBill: null };
    }

    if (!todayBill?.end) {
        return { status: DAY_STATUS.STARTED, todayBill };
    }

    return { status: DAY_STATUS.ENDED, todayBill };
};

const getLogDate = (log = {}) => {
    if (log.date) return log.date;
    if (log.sessionDate) return log.sessionDate;

    const timestamp = log.startAt || log.createdAt || log.startDate;
    if (!timestamp) return null;

    try {
        return format(new Date(timestamp), "yyyy-MM-dd");
    } catch {
        return null;
    }
};

const SERVER_DAY_STATUS_TIMEOUT_MS = 5000;

const withTimeout = (promise, ms) =>
    Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Server day status check timed out")), ms);
        }),
    ]);

export const getServerDayStatus = async (cashierId, today = getTodayDate()) => {
    if (!cashierId || !navigator.onLine) {
        return null;
    }

    try {
        const response = await withTimeout(
            getCashierLogs({
                startDate: today,
                endDate: today,
                userId: cashierId,
                page: 1,
                limit: 20,
            }),
            SERVER_DAY_STATUS_TIMEOUT_MS
        );

        const logs = response?.data?.logs || [];
        const todayLog =
            logs.find((log) => getLogDate(log) === today) ||
            logs.find((log) => Boolean(log.startAt || log.startTotalCash != null));

        if (!todayLog) {
            return {
                status: DAY_STATUS.NOT_STARTED,
                todayLog: null,
            };
        }

        if (todayLog.endAt) {
            return {
                status: DAY_STATUS.ENDED,
                todayLog,
            };
        }

        return {
            status: DAY_STATUS.STARTED,
            todayLog,
        };
    } catch {
        return null;
    }
};

export const checkCashierDayAccess = async (cashierId, dayBills = []) => {
    const local = getLocalDayStatus(dayBills);
    const server = await getServerDayStatus(cashierId);

    if (local.status === DAY_STATUS.ENDED || server?.status === DAY_STATUS.ENDED) {
        return {
            canUsePos: false,
            status: DAY_STATUS.ENDED,
            local,
            server,
        };
    }

    if (local.status === DAY_STATUS.STARTED || server?.status === DAY_STATUS.STARTED) {
        return {
            canUsePos: true,
            status: DAY_STATUS.STARTED,
            local,
            server,
        };
    }

    return {
        canUsePos: false,
        status: DAY_STATUS.NOT_STARTED,
        local,
        server,
    };
};

export const loadCashierDayBills = async (cashierId) => {
    if (!cashierId || !window.api?.getDayBills) {
        return [];
    }

    return window.api.getDayBills(String(cashierId));
};
