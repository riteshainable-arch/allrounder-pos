import useSWR from "swr";
import useSWRCreateOne from "./swr/useSWRCreateOne";
import { API_VERSION, fetchAll, fetchOne } from "./fetchers"
import { useSWRUpdateOne } from "./swr/useSWRUpdateOne";
import useSWRDeleteOneAndRefreshAll from "./swr/useSWRDeleteOneAndRefreshAll";

const COUPONS_LIST_PATH = "admin/coupons";
const VALIDATE_COUPON_PATH_NAME = 'admin/coupons/validate'

const useGetAllCouponList = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${COUPONS_LIST_PATH}`, params] : null,
        () => fetchAll(COUPONS_LIST_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        CouponList: data,
        CouponListError: error,
        isCouponListLoading: isLoading,
        isValidatingCouponList: isValidating,
        refreshpCouponList: mutate,
    };
};

const useCouponDetail = (shouldFetch = true, id = "", params) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${COUPONS_LIST_PATH}/${id}`, params] : null,
        () => fetchOne(COUPONS_LIST_PATH, id, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        },
    );

    return {
        couponDetails: data,
        couponDetailsError: error,
        isCouponDetailsLoading: isLoading,
        isValidatingCouponDetails: isValidating,
        refreshCouponDetails: mutate,
    };
};

const useCreateCoupon = (params) => {
    const { data, error, isMutating, reset, create } = useSWRCreateOne({
        path: COUPONS_LIST_PATH,
        key: params,
    });

    return {
        onCreateCoupon: data,
        createCouponError: error,
        isCreatingCoupon: isMutating,
        createCouponReset: reset,
        createCoupon: create,
    };
};

const useUpdateCoupon = (id = "") => {
    const { data, error, isMutating, reset, update } = useSWRUpdateOne({
        path: COUPONS_LIST_PATH,
        id,
    });

    return {
        data,
        error,
        isUpdatingCoupon: isMutating,
        reset,
        update,
    };
};

const useDeleteCoupon = (id = "", params) => {
    const { data, error, isDeleting, reset, deleteRecord } = useSWRDeleteOneAndRefreshAll({
        path: COUPONS_LIST_PATH,
        id,
        key: params,
    });

    return {
        data,
        error,
        isDeleting,
        reset,
        deleteRecord,
    };
};

const useUpdateCouponStatus = (id = "") => {
    const { data, error, isMutating, reset, update } = useSWRUpdateOne({
        path: COUPONS_LIST_PATH,
        id,
        status: true,
    });

    return {
        data,
        error,
        isUpdatingCouponStatus: isMutating,
        reset,
        update,
    };
};

const useValidateCoupon = (params) => {
    const { data, error, isMutating, reset, create } = useSWRCreateOne({
        path: VALIDATE_COUPON_PATH_NAME,
        key: params,
    });

    return {
        onValidateCoupon: data,
        validateCouponError: error,
        isValidateCoupon: isMutating,
        validateCouponReset: reset,
        validateCoupon: create,
    };
};

export {
    useGetAllCouponList,
    useCouponDetail,
    useCreateCoupon,
    useUpdateCoupon,
    useDeleteCoupon,
    useUpdateCouponStatus,
    useValidateCoupon
};
