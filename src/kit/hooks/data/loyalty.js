import useSWR from "swr";
import { API_VERSION, fetchOne } from "./fetchers";
import API from "./services/axiosService";

const LOYALTY_PATH = "admin/loyalty";

const unwrapData = (response) => response?.data ?? response ?? {};

const useGetLoyaltyBalance = (phone = '', shouldFetch = true, id = '', params) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${LOYALTY_PATH}/customers/${encodeURIComponent(phone)}/balance`, params] : null,
        () => fetchOne(`${LOYALTY_PATH}/customers/${encodeURIComponent(phone)}/balance`, id, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    )

    return {
        loyaltyBalance: data,
        loyaltyBalanceError: error,
        isLoyaltyBalanceLoading: isLoading,
        isValidatingLoyaltyBalance: isValidating,
        refreshLoyaltyBalance: mutate
    }
}

const useGetLoyaltyLedger = (phone = '', shouldFetch = true, params, id = '') => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${LOYALTY_PATH}/customers/${encodeURIComponent(phone)}/ledger`, params] : null,
        () => fetchOne(`${LOYALTY_PATH}/customers/${encodeURIComponent(phone)}/ledger`, id, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    )

    return {
        loyaltyLedger: data,
        loyaltyLedgerError: error,
        isLoyaltyLedgerLoading: isLoading,
        isValidatingLoyaltyLedger: isValidating,
        refreshLoyaltyLedger: mutate
    }
}

const fetchLoyaltyLedger = (phone, params = {}) => API.get(`${API_VERSION}/${LOYALTY_PATH}/customers/${encodeURIComponent(phone)}/ledger`, params);

const useGetLoyaltyDailyReport = (params, shouldFetch = true, id = '') => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${LOYALTY_PATH}/report/daily`, params] : null,
        () => fetchOne(`${LOYALTY_PATH}/report/daily`, id, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    )

    return {
        loyaltyDailyReport: data,
        loyaltyDailyReportError: error,
        isLoyaltyDailyReportLoading: isLoading,
        isValidatingLoyaltyDailyReport: isValidating,
        refreshLoyaltyDailyReport: mutate
    }
}

export const getLoyaltyBalance = async (phone) => {
    const response = await API.get(
        `${API_VERSION}/${LOYALTY_PATH}/customers/${encodeURIComponent(phone)}/balance`
    );
    return unwrapData(response);
};

export const previewLoyalty = async (payload) => {
    const response = await API.post(`${API_VERSION}/${LOYALTY_PATH}/preview`, payload);
    return unwrapData(response);
};

export const getLoyaltyLedger = async (phone, params = {}) => {
    const response = await API.get(
        `${API_VERSION}/${LOYALTY_PATH}/customers/${encodeURIComponent(phone)}/ledger`,
        params
    );
    return unwrapData(response);
};

export const getLoyaltyDailyReport = async (params = {}) => {
    const response = await API.get(`${API_VERSION}/${LOYALTY_PATH}/report/daily`, params);
    return unwrapData(response);
};

export const getApiErrorMessage = (error) => {
    if (!error) return "";
    if (typeof error === "string") return error;
    if (Array.isArray(error)) return error[0]?.detail || error[0]?.message || "Request failed";
    return error.message || error.err || error.error || "Request failed";
};

export const isLoyaltyRedeemRejected = (error) =>
    getApiErrorMessage(error).startsWith("Loyalty redeem rejected:");

export { useGetLoyaltyBalance, useGetLoyaltyLedger, useGetLoyaltyDailyReport, fetchLoyaltyLedger }

/** Products this customer's loyalty points can take free (admin "Reward Items"). */
export const getLoyaltyRewards = async (phone, storeId) => {
    const response = await API.get(
        `${API_VERSION}/${LOYALTY_PATH}/customers/${encodeURIComponent(phone)}/rewards`,
        storeId ? { storeId } : {}
    );
    return unwrapData(response);
};
