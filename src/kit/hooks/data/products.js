
import useSWR from 'swr'
import { API_VERSION, fetchAll } from './fetchers'

const PRODUCT_LIST_PATH_NAME = 'pos/product/search-with-offers'
const PRODUCTS_LIST_PATH = "admin/product-master";

const useGetAllProductList = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${PRODUCT_LIST_PATH_NAME}`, params] : null,
        () => fetchAll(`${PRODUCT_LIST_PATH_NAME}`, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true
        }
    )

    return {
        productList: data,
        productListError: error,
        isProductListLoading: isLoading,
        isValidatingProductList: isValidating,
        refreshProductList: mutate
    }
}

const useGetAllProducts = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${PRODUCTS_LIST_PATH}`, params] : null,
        () => fetchAll(`${PRODUCTS_LIST_PATH}`, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true
        }
    )

    return {
        productList: data,
        productListError: error,
        isproductListLoading: isLoading,
        isValidatingProductList: isValidating,
        refreshProductList: mutate,
    }
}

const getAllProductsForSync = (params) => fetchAll(PRODUCT_LIST_PATH_NAME, params);

export { useGetAllProductList, getAllProductsForSync, useGetAllProducts }