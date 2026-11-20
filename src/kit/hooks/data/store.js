
import useSWR from 'swr'
import { API_VERSION, fetchAll } from './fetchers'

const STORE_LIST_PATH_NAME = 'admin/store/list'

const useGetAllStoreList = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${STORE_LIST_PATH_NAME}`, params] : null,
        () => fetchAll(`${STORE_LIST_PATH_NAME}`, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true
        }
    )

    return {
        storeList: data,
        storeListError: error,
        isStoreListLoading: isLoading,
        isValidatingStoreList: isValidating,
        refreshStoreList: mutate
    }
}

const getAllStoresForSync = (params) => fetchAll(STORE_LIST_PATH_NAME, params);

export { useGetAllStoreList, getAllStoresForSync }