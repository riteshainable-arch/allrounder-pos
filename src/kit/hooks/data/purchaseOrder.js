
import useSWR from "swr";
import { API_VERSION, fetchAll } from "./fetchers";

const PURCHASEORDER_PATH_NAME = "admin/purchase-order/list";

const useGetAllPurchaseOrders = (params, shouldFetch = true) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${PURCHASEORDER_PATH_NAME}`, params] : null,
        () => fetchAll(PURCHASEORDER_PATH_NAME, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            keepPreviousData: true,
        }
    );

    return {
    purchaseOrderList: data,
    purchaseOrderListError: error,
    isPurchaseOrderListLoading: isLoading,
    isValidatingPurchaseOrderList: isValidating,
    refreshPurchaseOrderList: mutate,
    };
};

export { useGetAllPurchaseOrders };
