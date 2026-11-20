
import useSWR from 'swr'
import { fetchOne } from './fetchers'

const LAST_ORDER_NUMBER_PATH_NAME = 'admin/invoice/last-order'

const useGetOneLastOrderNumber = (id = '', params) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        [`${LAST_ORDER_NUMBER_PATH_NAME}/${id}`, params],
        () => fetchOne(LAST_ORDER_NUMBER_PATH_NAME, id, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    )

    return {
        lastOrderNumber: data,
        lastOrderNumberError: error,
        isLastOrderNumberLoading: isLoading,
        isValidatingLastOrderNumber: isValidating,
        refreshLastOrderNumber: mutate
    }
}

export { useGetOneLastOrderNumber }