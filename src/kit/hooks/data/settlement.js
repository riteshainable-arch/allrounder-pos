import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { API_VERSION, fetchAll } from "./fetchers";
import API from "./services/axiosService";

const RECONCILIATION_PATH = "admin/settlement/reconciliation";
const OUTSTANDING_SUMMARY_PATH = "admin/settlement/outstanding-summary";
const SETTLE_PATH = "admin/settlement/settle";

const useOutstandingSummary = (params, shouldFetch = true) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${OUTSTANDING_SUMMARY_PATH}`, params] : null,
        () => fetchAll(OUTSTANDING_SUMMARY_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            keepPreviousData: true,
        }
    );

    return {
        outstandingSummary: data,
        outstandingSummaryError: error,
        isOutstandingSummaryLoading: isLoading,
        isValidatingOutstandingSummary: isValidating,
        refreshOutstandingSummary: mutate,
    };
};

const useReconciliation = (params, shouldFetch = true) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${RECONCILIATION_PATH}`, params] : null,
        () => fetchAll(RECONCILIATION_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            keepPreviousData: true,
        }
    );

    return {
        reconciliation: data,
        reconciliationError: error,
        isReconciliationLoading: isLoading,
        isValidatingReconciliation: isValidating,
        refreshReconciliation: mutate,
    };
};

const settleCashier = (body) => API.post(`${API_VERSION}/${SETTLE_PATH}`, body);

const useSettleCashier = () => {
    const { trigger, isMutating } = useSWRMutation(
        `${API_VERSION}/${SETTLE_PATH}`,
        (_, { arg }) => settleCashier(arg)
    );

    return {
        settleCashier: trigger,
        isSettling: isMutating,
    };
};

export { useReconciliation, useOutstandingSummary, useSettleCashier, settleCashier };
