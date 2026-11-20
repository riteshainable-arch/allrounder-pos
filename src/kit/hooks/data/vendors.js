import { API_VERSION, fetchAll } from "./fetchers";
import useSWR from "swr";

const VENDORS_PATH = "admin/vendor/list";

const useGetAllVendors = (params, shouldFetch = true) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${VENDORS_PATH}`, params] : null,
        () => fetchAll(VENDORS_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            keepPreviousData: true,
        }
    );

    return {
        vendors: data?.data?.vendors ?? [],
        totalItems: data?.data?.totalItems ?? 0,
        totalPages: data?.data?.totalPages ?? 0,
        currentPage: data?.data?.currentPage ?? 1,
        pageSize: data?.data?.pageSize ?? 10,
        vendorsError: error,
        isVendorsLoading: isLoading,
        isValidatingVendors: isValidating,
        refreshVendores: mutate,
    };
};

export { useGetAllVendors };
