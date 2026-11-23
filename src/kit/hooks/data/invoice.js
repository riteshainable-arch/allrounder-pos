import useSWR from "swr";
import { API_VERSION, fetchAll } from "./fetchers";
import API from "./services/axiosService";

const BILLS_PATH = "admin/invoice/bills";

const useInvoiceBills = (params, shouldFetch = true) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${BILLS_PATH}`, params] : null,
        () => fetchAll(BILLS_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            keepPreviousData: true,
        }
    );

    return {
        invoiceBills: data,
        invoiceBillsError: error,
        isInvoiceBillsLoading: isLoading,
        isValidatingInvoiceBills: isValidating,
        refreshInvoiceBills: mutate,
    };
};

const fetchInvoiceBills = (params) => API.get(`${API_VERSION}/${BILLS_PATH}`, params);

const fetchInvoiceBillDetail = (invoiceNo) =>
    API.get(`${API_VERSION}/${BILLS_PATH}/${encodeURIComponent(invoiceNo)}`);

const useInvoiceBillDetail = (invoiceNo, shouldFetch = true) => {
    const { data, error, isLoading, mutate } = useSWR(
        shouldFetch && invoiceNo
            ? [`${API_VERSION}/${BILLS_PATH}/${invoiceNo}`]
            : null,
        () => fetchInvoiceBillDetail(invoiceNo),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
        }
    );

    return {
        invoiceBillDetail: data,
        invoiceBillDetailError: error,
        isInvoiceBillDetailLoading: isLoading,
        refreshInvoiceBillDetail: mutate,
    };
};

/** Manager-approved edit of name / mobile / GST / payment split. */
const editBillDetails = (body) => API.patch(`${API_VERSION}/${BILLS_PATH}/edit-details`, body);

export { editBillDetails, useInvoiceBills, useInvoiceBillDetail, fetchInvoiceBillDetail, fetchInvoiceBills };
