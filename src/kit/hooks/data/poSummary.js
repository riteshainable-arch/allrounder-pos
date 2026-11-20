
import useSWR from "swr";
import { API_VERSION, fetchAll, fetchOne } from "./fetchers";

const PURCHASE_ORDER_PATH_NAME = "admin/purchase-order/summary";
const PURCHASE_ORDER_DETAILS_PATH_NAME = "admin/purchase-order/po";

const useGetAllPOSummaryList = (params, shouldFetch = true) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${PURCHASE_ORDER_PATH_NAME}`, params] : null,
        () => fetchAll(PURCHASE_ORDER_PATH_NAME, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            keepPreviousData: true,
        }
    );

    return {
        POSummaryList: data,
        POSummaryListError: error,
        isPOSummaryListLoading: isLoading,
        isValidatingPOSummaryList: isValidating,
        refreshPOSummaryList: mutate,
    };
}

const useGetOnePOSummary = (id = "", params) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        id ? [`${PURCHASE_ORDER_DETAILS_PATH_NAME}/${id}`, params] : null,
        () => fetchOne(PURCHASE_ORDER_DETAILS_PATH_NAME, id, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        },
    );

    return {
        POSummaryDetail: data,
        POSummaryDetailError: error,
        isPOSummaryDetailLoading: isLoading,
        isValidatingPOSummaryDetail: isValidating,
        refreshPOSummaryDetail: mutate,
    };
};

export { useGetAllPOSummaryList, useGetOnePOSummary };
