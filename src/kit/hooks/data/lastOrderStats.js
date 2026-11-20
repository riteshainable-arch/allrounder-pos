


import useSWR from 'swr'
import { fetchOne } from './fetchers'

const LAST_ORDER_STATS_PATH_NAME = 'admin/customer/last-order-stats'

const useGetLastOrderStats = (phone = '', shouldFetch = true, id = '', params) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${LAST_ORDER_STATS_PATH_NAME}/${phone}`, params] : null,
        () => fetchOne(`${LAST_ORDER_STATS_PATH_NAME}/${phone}`, id, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    )

    return {
        lastOrderStats: data,
        lastOrderStatsError: error,
        isLastOrderStatsLoading: isLoading,
        isValidatingLastOrderStats: isValidating,
        refreshLastOrderStats: mutate
    }
}

export { useGetLastOrderStats }