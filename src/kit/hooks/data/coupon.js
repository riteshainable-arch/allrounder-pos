import { API_VERSION } from './fetchers'
import useSWRCreateOne from './swr/useSWRCreateOne'

const VALIDATE_COUPON_PATH_NAME = 'admin/coupons/validate'

const useValidateCoupon = (params) => {
    const { data, error, isMutating, reset, create } = useSWRCreateOne({
        path: VALIDATE_COUPON_PATH_NAME,
        key: params,
        apiVersion: API_VERSION
    })

    return {
        onValidateCoupon: data,
        validateCouponError: error,
        isValidateCoupon: isMutating,
        validateCouponReset: reset,
        validateCoupon: create
    }
}

export { useValidateCoupon }