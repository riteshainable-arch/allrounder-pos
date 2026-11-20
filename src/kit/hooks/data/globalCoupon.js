import useSWR from 'swr'
import { API_VERSION, fetchAll } from './fetchers'
import useSWRCreateOne from './swr/useSWRCreateOne'

const GLOBAL_COUPON_PATH_NAME = 'admin/coupons/auto-apply'
const GLOBAL_COUPON_EVALUATE_PATH_NAME = 'admin/billing-schemes/evaluate'
const ACTIVE_BILLING_SCHEMES_PATH_NAME = 'admin/billing-schemes/active'
const AVAILABLE_BILLING_SCHEMES_PATH_NAME = 'admin/billing-schemes/available'

const useGlobalCouponAutoApply = (params) => {
    const { data, error, isMutating, reset, create } = useSWRCreateOne({
        path: GLOBAL_COUPON_PATH_NAME,
        key: params,
        apiVersion: API_VERSION
    })

    return {
        onGlobalCouponAutoApply: data,
        globalCouponAutoApplyError: error,
        isGlobalCouponAutoApply: isMutating,
        globalCouponAutoApplyReset: reset,
        globalCouponAutoApply: create
    }
}

const useGetAllActiveSchemeList = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${ACTIVE_BILLING_SCHEMES_PATH_NAME}`, params] : null,
        () => fetchAll(`${ACTIVE_BILLING_SCHEMES_PATH_NAME}`, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true
        }
    )

    return {
        ActiveSchemeList: data,
        ActiveSchemeListError: error,
        isActiveSchemeListLoading: isLoading,
        isValidatingActiveSchemeList: isValidating,
        refreshActiveSchemeList: mutate
    }
}

const useAvailableScheme = (params) => {
    const { data, error, isMutating, reset, create } = useSWRCreateOne({
        path: AVAILABLE_BILLING_SCHEMES_PATH_NAME,
        key: params,
        apiVersion: API_VERSION
    })

    return {
        onAvailableScheme: data,
        AvailableSchemeError: error,
        isAvailableScheme: isMutating,
        AvailableSchemeReset: reset,
        AvailableScheme: create
    }
}

const useGlobalCouponEvaluate = (params) => {
    const { data, error, isMutating, reset, create } = useSWRCreateOne({
        path: GLOBAL_COUPON_EVALUATE_PATH_NAME,
        key: params,
        apiVersion: API_VERSION
    })

    return {
        onGlobalCouponEvaluate: data,
        globalCouponEvaluateError: error,
        isGlobalCouponEvaluate: isMutating,
        globalCouponEvaluateReset: reset,
        globalCouponEvaluate: create
    }
}

export { useGlobalCouponAutoApply, useGetAllActiveSchemeList, useAvailableScheme, useGlobalCouponEvaluate }