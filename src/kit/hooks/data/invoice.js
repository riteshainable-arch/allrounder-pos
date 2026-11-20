import useSWR from "swr";
import { API_VERSION, fetchAll } from "./fetchers";
import API from "./services/axiosService";

const BILLS_PATH = "admin/invoice/bills";
const BRAND_REVENUE_MONTH_PATH = "user/invoice/revenue-month";
const INVOICE_REVENUE_PATH = "user/invoice/revenue";
const INVOICE_CATEGORY_STATS_PATH = "user/invoice/category-stats";
const INVOICE_INVOICE_STATS_PATH = "user/invoice/invoice-stats";

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

const useGetAllInvoiceRevenueMonth = (params, shouldFetch = false) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${BRAND_REVENUE_MONTH_PATH}`, params] : null,
        () => fetchAll(BRAND_REVENUE_MONTH_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        invoiceRevenueMonthList: data,
        invoiceRevenueMonthError: error,
        isInvoiceRevenueMonthLoading: isLoading,
        isValidatingInvoiceRevenueMonth: isValidating,
        refreshInvoiceRevenueMonth: mutate,
    };
};

const useGetAllInvoiceRevenue = (params, shouldFetch = false) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${INVOICE_REVENUE_PATH}`, params] : null,
        () => fetchAll(INVOICE_REVENUE_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        invoiceRevenueList: data,
        invoiceRevenueError: error,
        isInvoiceRevenueLoading: isLoading,
        isValidatingInvoiceRevenue: isValidating,
        refreshInvoiceRevenue: mutate,
    };
};

const useGetAllInvoiceCategoryStats = (params, shouldFetch = false) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${INVOICE_CATEGORY_STATS_PATH}`, params] : null,
        () => fetchAll(INVOICE_CATEGORY_STATS_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        invoiceCategoryStatsList: data,
        invoiceCategoryStatsError: error,
        isInvoiceCategoryStatsLoading: isLoading,
        isValidatingInvoiceCategoryStats: isValidating,
        refreshInvoiceCategoryStats: mutate,
    };
};

const useGetAllInvoiceInvoiceStats = (params, shouldFetch = false) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${INVOICE_INVOICE_STATS_PATH}`, params] : null,
        () => fetchAll(INVOICE_INVOICE_STATS_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        invoiceInvoiceStatsList: data,
        invoiceInvoiceStatsError: error,
        isInvoiceInvoiceStatsLoading: isLoading,
        isValidatingInvoiceInvoiceStats: isValidating,
        refreshInvoiceInvoiceStats: mutate,
    };
};

export { useInvoiceBills, useInvoiceBillDetail, fetchInvoiceBillDetail, fetchInvoiceBills, useGetAllInvoiceRevenueMonth, useGetAllInvoiceRevenue, useGetAllInvoiceCategoryStats, useGetAllInvoiceInvoiceStats };
