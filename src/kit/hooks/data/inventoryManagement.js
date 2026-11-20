
import useSWR from "swr";
import { API_VERSION, fetchAll } from "./fetchers";
import useSWRCreateOne from "./swr/useSWRCreateOne";

const INVENTORY_ALERT_PATH = "admin/inventory/alerts";
const INVENTORY_RETURN_PATH = "admin/inventory/can-return-stock";
const INVENTORY_DISPLAY_CHECK_PATH = "admin/inventory/product-code";

const useGetAllInventoryAlerts = (params, shouldFetch = true) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${INVENTORY_ALERT_PATH}`, params] : null,
        () => fetchAll(INVENTORY_ALERT_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            keepPreviousData: true,
        }
    );

    return {
        alerts: data,
        alertsError: error,
        isAlertsLoading: isLoading,
        isValidatingAlerts: isValidating,
        refreshAlerts: mutate,
    };
};

const useGetReturnArray = (params) => {
    const { data, error, isMutating, reset, create } = useSWRCreateOne({
        path: INVENTORY_RETURN_PATH,
        key: params,
        apiVersion: API_VERSION
    })

    return {
        onGetReturnArray: data,
        GetReturnArrayError: error,
        isReturnALoading: isMutating,
        GetReturnArrayReset: reset,
        GetReturnArray: create,
    }
}

const useGetDisplayArray = (params) => {
    const { data, error, isMutating, reset, create } = useSWRCreateOne({
        path: INVENTORY_DISPLAY_CHECK_PATH,
        key: params,
        apiVersion: API_VERSION
    })

    return {
        onGetDisplayArray: data,
        GetDisplayArrayError: error,
        isDisplayLoading: isMutating,
        GetDisplayArrayReset: reset,
        GetDisplayArray: create,
    }
}

export { useGetAllInventoryAlerts, useGetReturnArray, useGetDisplayArray };
