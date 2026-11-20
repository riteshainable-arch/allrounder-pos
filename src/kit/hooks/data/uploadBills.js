import useSWR from 'swr'
import { API_VERSION, fetchAll } from './fetchers'
import useSWRCreateOne from './swr/useSWRCreateOne'

const GENERATE_BILLS_UPLOAD_PATH_NAME = 'admin/invoice/generate-bill'
const DAY_BILLS_UPLOAD_PATH_NAME = 'admin/cashier-log/save'

const useUploadGenerateBills = (params) => {
    const { data, error, isMutating, reset, create } = useSWRCreateOne({
        path: GENERATE_BILLS_UPLOAD_PATH_NAME,
        key: params,
        apiVersion: API_VERSION
    })

    return {
        onUploadGenerateBills: data,
        uploadGenerateBillsError: error,
        isUploadingGenerateBills: isMutating,
        uploadGenerateBillsReset: reset,
        uploadGenerateBills: create
    }
}


const useUploadDayBills = (params) => {
    const { data, error, isMutating, reset, create } = useSWRCreateOne({
        path: DAY_BILLS_UPLOAD_PATH_NAME,
        key: params,
        apiVersion: API_VERSION
    })

    return {
        onUploadDayBills: data,
        uploadDayBillsError: error,
        isUploadingDayBills: isMutating,
        uploadDayBillsReset: reset,
        uploadDayBills: create
    }
}

export { useUploadGenerateBills, useUploadDayBills }