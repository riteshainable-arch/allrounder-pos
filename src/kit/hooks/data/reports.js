
import useSWR from "swr";
import { API_VERSION, fetchAll } from "./fetchers";

const ITEMSTOCK_REPORT_PATH = "admin/inventory/stock-report";
const STATUS_REPORT_PATH = "admin/markdown-inventory";
const TRANSFER_REPORT_PATH = "admin/stock-transfer";
const STOCK_LEDGER_PATH = "admin/stock-ledger/ledger";

const useGetAllItemStockReport = (params, shouldFetch = true) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${ITEMSTOCK_REPORT_PATH}`, params] : null,
        () => fetchAll(ITEMSTOCK_REPORT_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            keepPreviousData: true,
        }
    );

    return {
        itemStockReportList: data,
        itemStockReportError: error,
        isItemStockReportLoading: isLoading,
        isValidatingItemStockReport: isValidating,
        refreshItemStockReport: mutate,
    };
}

const useGetAllMarkdownReport = (params, shouldFetch = true) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${STATUS_REPORT_PATH}`, params] : null,
        () => fetchAll(STATUS_REPORT_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            keepPreviousData: true,
        }
    );

    return {
        markdownReportList: data,
        markdownReporError: error,
        isMarkdownReportLoading: isLoading,
        isValidatingMarkdownReport: isValidating,
        refreshMarkdownReport: mutate,
    };
}


const useGetAllTransferReport = (params, shouldFetch = true) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${TRANSFER_REPORT_PATH}`, params] : null,
        () => fetchAll(TRANSFER_REPORT_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            keepPreviousData: true,
        }
    );

    return {
        transferReportList: data,
        transferReportError: error,
        isTransferReportLoading: isLoading,
        isValidatingTransferReport: isValidating,
        refreshTransferReport: mutate,
    };
}

export { useGetAllItemStockReport, useGetAllMarkdownReport, useGetAllTransferReport };
