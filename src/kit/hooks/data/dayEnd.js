import useSWR from 'swr'
import { API_VERSION, fetchAll } from './fetchers'

const DAY_END_LIST_PATH_NAME = 'admin/collections/day-end'

const useGetAllDayEnd = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${DAY_END_LIST_PATH_NAME}`, params] : null,
        () => fetchAll(`${DAY_END_LIST_PATH_NAME}`, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true
        }
    )

    return {
        dayEndList: data,
        dayEndListError: error,
        isDayEndListLoading: isLoading,
        isValidatingDayEndList: isValidating,
        refreshDayEndList: mutate
    }
}

export { useGetAllDayEnd }