import useSWR from 'swr'
import { API_VERSION, fetchAll } from './fetchers'

const CASHIER_LOG_PATH_NAME = 'admin/cashier-log'

const useCashierLogs = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${CASHIER_LOG_PATH_NAME}`, params] : null,
        () => fetchAll(CASHIER_LOG_PATH_NAME, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        }
    )

    return {
        cashierLogs: data,
        cashierLogsError: error,
        isCashierLogsLoading: isLoading,
        isValidatingCashierLogs: isValidating,
        refreshCashierLogs: mutate,
    }
}

const getCashierLogs = (params) => fetchAll(CASHIER_LOG_PATH_NAME, params)

export { useCashierLogs, getCashierLogs }
