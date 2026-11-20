
import useSWR from 'swr'
import { API_VERSION, fetchAll } from './fetchers'

const SRN_LIST_PATH_NAME = 'admin/sale-return/wallet'

const useGetAllSRNList = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${SRN_LIST_PATH_NAME}`, params] : null,
        () => fetchAll(`${SRN_LIST_PATH_NAME}`, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true
        }
    )

    return {
        srnList: data,
        srnListError: error,
        isSrnListLoading: isLoading,
        isValidatingSrnList: isValidating,
        refreshSrnList: mutate
    }
}

export { useGetAllSRNList }