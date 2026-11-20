import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { API_VERSION, fetchAll } from "./fetchers";
import API from "./services/axiosService";

const SALE_RETURN_PATH = "admin/sale-return";

const verifySaleReturnManager = (body) =>
    API.post(`${API_VERSION}/${SALE_RETURN_PATH}/verify-manager`, body);

const getOriginalInvoice = (invoiceNo, params) =>
    API.get(
        `${API_VERSION}/${SALE_RETURN_PATH}/original-invoice/${encodeURIComponent(invoiceNo)}`,
        params
    );

const previewSaleReturn = (body) =>
    API.post(`${API_VERSION}/${SALE_RETURN_PATH}/preview`, body);

const createSaleReturn = (body) =>
    API.post(`${API_VERSION}/${SALE_RETURN_PATH}/create`, body);

const useVerifySaleReturnManager = () => {
    const { trigger, isMutating } = useSWRMutation(
        `${API_VERSION}/${SALE_RETURN_PATH}/verify-manager`,
        (_, { arg }) => verifySaleReturnManager(arg)
    );

    return { verifyManager: trigger, isVerifyingManager: isMutating };
};

const useOriginalInvoice = (invoiceNo, params, shouldFetch = false) => {
    const { data, error, isLoading, mutate } = useSWR(
        shouldFetch && invoiceNo
            ? [`${API_VERSION}/${SALE_RETURN_PATH}/original-invoice`, invoiceNo, params]
            : null,
        () => getOriginalInvoice(invoiceNo, params),
        { revalidateOnFocus: false }
    );

    return {
        originalInvoice: data,
        originalInvoiceError: error,
        isOriginalInvoiceLoading: isLoading,
        refreshOriginalInvoice: mutate,
    };
};

const usePreviewSaleReturn = () => {
    const { trigger, isMutating, data } = useSWRMutation(
        `${API_VERSION}/${SALE_RETURN_PATH}/preview`,
        (_, { arg }) => previewSaleReturn(arg)
    );

    return {
        previewReturn: trigger,
        isPreviewLoading: isMutating,
        previewData: data,
    };
};

const useCreateSaleReturn = () => {
    const { trigger, isMutating } = useSWRMutation(
        `${API_VERSION}/${SALE_RETURN_PATH}/create`,
        (_, { arg }) => createSaleReturn(arg)
    );

    return { createSaleReturn: trigger, isCreatingSaleReturn: isMutating };
};

const useSaleReturns = (params, shouldFetch = true) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${SALE_RETURN_PATH}`, params] : null,
        () => fetchAll(SALE_RETURN_PATH, params),
        {
            revalidateOnMount: true,
            keepPreviousData: true,
            revalidateOnFocus: false,
        }
    );

    return {
        saleReturns: data,
        saleReturnsError: error,
        isSaleReturnsLoading: isLoading,
        isValidatingSaleReturns: isValidating,
        refreshSaleReturns: mutate,
    };
};

const fetchSaleReturns = (params) => API.get(`${API_VERSION}/${SALE_RETURN_PATH}`, params);

const useSaleReturnDetail = (srnNumber, shouldFetch = true) => {
    const { data, error, isLoading, mutate } = useSWR(
        shouldFetch && srnNumber
            ? [`${API_VERSION}/${SALE_RETURN_PATH}/${srnNumber}`]
            : null,
        () => fetchAll(`${SALE_RETURN_PATH}/${encodeURIComponent(srnNumber)}`),
        { revalidateOnFocus: false }
    );

    return {
        saleReturnDetail: data,
        saleReturnDetailError: error,
        isSaleReturnDetailLoading: isLoading,
        refreshSaleReturnDetail: mutate,
    };
};

export {
    verifySaleReturnManager,
    getOriginalInvoice,
    previewSaleReturn,
    createSaleReturn,
    useVerifySaleReturnManager,
    useOriginalInvoice,
    usePreviewSaleReturn,
    useCreateSaleReturn,
    useSaleReturns,
    useSaleReturnDetail,
    fetchSaleReturns,
};
