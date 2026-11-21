import useSWR from "swr";
import useSWRCreateOne from "./swr/useSWRCreateOne";
import { API_VERSION, fetchAll, fetchOne } from "./fetchers"
import { useSWRUpdateOne } from "./swr/useSWRUpdateOne";
import useSWRDeleteOneAndRefreshAll from "./swr/useSWRDeleteOneAndRefreshAll";

const GLOBAL_COUPON_LIST_PATH = "admin/coupons/invoice-discounts";
const GLOBAL_COUPON_PATH_NAME = "admin/coupons/auto-apply";

const useGetAllGlobalCouponList = (params, shouldFetch = true) => {
  const { data, error, isValidating, isLoading, mutate } = useSWR(
    shouldFetch ? [`${API_VERSION}/${GLOBAL_COUPON_LIST_PATH}`, params] : null,
    () => fetchAll(GLOBAL_COUPON_LIST_PATH, params),
    {
      revalidateOnMount: true,
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
    },
  );

  return {
    globalCouponList: data,
    globalCouponListError: error,
    isGlobalCouponListLoading: isLoading,
    isValidatingGlobalCouponList: isValidating,
    refreshpGlobalCouponList: mutate,
  };
};

const useGlobalCouponDetail = (shouldFetch = true, id = "", params) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    shouldFetch ? [`${API_VERSION}/${GLOBAL_COUPON_LIST_PATH}/${id}`, params] : null,
    () => fetchOne(GLOBAL_COUPON_LIST_PATH, id, params),
    {
      revalidateOnMount: true,
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    globalCouponDetails: data,
    globalCouponDetailsError: error,
    isGlobalCouponDetailsLoading: isLoading,
    isValidatingGlobalCouponDetails: isValidating,
    refreshGlobalCouponDetails: mutate,
  };
};

const useCreateGlobalCoupon = (params) => {
  const { data, error, isMutating, reset, create } = useSWRCreateOne({
    path: GLOBAL_COUPON_LIST_PATH,
    key: params,
  });

  return {
    onCreateGlobalCoupon: data,
    createGlobalCouponError: error,
    isCreatingGlobalCoupon: isMutating,
    createGlobalCouponReset: reset,
    createGlobalCoupon: create,
  };
};

const useUpdateGlobalCoupon = (id = "") => {
  const { data, error, isMutating, reset, update } = useSWRUpdateOne({
    path: GLOBAL_COUPON_LIST_PATH,
    id,
  });

  return {
    data,
    error,
    isUpdatingGlobalCoupon: isMutating,
    reset,
    update,
  };
};

const useDeleteGlobalCoupon = (id = "", params) => {
  const { data, error, isDeleting, reset, deleteRecord } = useSWRDeleteOneAndRefreshAll({
    path: GLOBAL_COUPON_LIST_PATH,
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

const useUpdateGlobalCouponStatus = (id = "") => {
  const { data, error, isMutating, reset, update } = useSWRUpdateOne({
    path: GLOBAL_COUPON_LIST_PATH,
    id,
    status: true,
  });

  return {
    data,
    error,
    isUpdatingGlobalCouponStatus: isMutating,
    reset,
    update,
  };
};

const useGlobalCouponAutoApply = (params) => {
  const { data, error, isMutating, reset, create } = useSWRCreateOne({
    path: GLOBAL_COUPON_PATH_NAME,
    key: params,
  });

  return {
    onGlobalCouponAutoApply: data,
    globalCouponAutoApplyError: error,
    isGlobalCouponAutoApply: isMutating,
    globalCouponAutoApplyReset: reset,
    globalCouponAutoApply: create,
  };
};

export { useGetAllGlobalCouponList, useGlobalCouponDetail, useCreateGlobalCoupon, useUpdateGlobalCoupon, useDeleteGlobalCoupon, useUpdateGlobalCouponStatus, useGlobalCouponAutoApply };
