import { API_VERSION, fetchAll } from "./fetchers";
import useSWR from "swr";

const BRAND_WITH_ID_PATH = "admin/brand/v2/list";

const useGetAllBrandsWithId = (params, shouldFetch = true) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${BRAND_WITH_ID_PATH}`, params] : null,
        () => fetchAll(BRAND_WITH_ID_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            keepPreviousData: true,
        }
    );

    return {
        bandsWithId: data,
        bandsWithIdError: error,
        isBandsWithIdLoading: isLoading,
        isValidatingBandsWithId: isValidating,
        refreshBandsWithId: mutate,
    };
};

export { useGetAllBrandsWithId };
