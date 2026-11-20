
import useSWR from 'swr'
import { API_VERSION, fetchAll, createOne } from './fetchers'
import useSWRCreateOne from './swr/useSWRCreateOne'

const CUSTOMER_LIST_PATH_NAME = 'admin/customer/list'
const CUSTOMER_FIND_OR_CREATE_PATH_NAME = 'pos/customer/find-or-create'

const useGetAllCustomerList = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${CUSTOMER_LIST_PATH_NAME}`, params] : null,
        () => fetchAll(`${CUSTOMER_LIST_PATH_NAME}`, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true
        }
    )

    return {
        customerList: data,
        customerListError: error,
        isCustomerListLoading: isLoading,
        isValidatingCustomerList: isValidating,
        refreshCustomerList: mutate
    }
}

const getAllCustomersForSync = (params) => fetchAll(CUSTOMER_LIST_PATH_NAME, params);

const findOrCreateCustomer = (body) => createOne(CUSTOMER_FIND_OR_CREATE_PATH_NAME, body);

const useFindOrCreate = (params) => {
    const { data, error, isMutating, reset, create } = useSWRCreateOne({
        path: CUSTOMER_FIND_OR_CREATE_PATH_NAME,
        key: params,
    })

    return {
        onFindOrCreate: data,
        findOrCreateError: error,
        isFindingOrCreate: isMutating,
        findOrCreateReset: reset,
        findOrCreate: create
    }
}

export { useGetAllCustomerList, getAllCustomersForSync, findOrCreateCustomer, useFindOrCreate }