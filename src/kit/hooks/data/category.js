import { API_VERSION, fetchAll } from "./fetchers";
import useSWR from "swr";

const CATEGORY_LIST_PATH = "/user/brand/category/list";
const CATEGORY_POPULAR_PATH = "/user/category/popular";
const CATEGORY_REVENUE_PATH = "/user/category/revenue";
const CATEGORY_STATS_PATH = "/user/category/stats";
const SECONDARY_CATEGORY_REVENUE_PATH = "/user/category/secondary-category/revenue";

const useGetAllCategoryList = (shouldFetch = false, params,) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${CATEGORY_LIST_PATH}`, params] : null,
        () => fetchAll(CATEGORY_LIST_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        categoryList: data,
        categoryListError: error,
        isCategoryListLoading: isLoading,
        isValidatingCategoryList: isValidating,
        refreshCategoryList: mutate,
    };
};

const useGetAllCategoryPopular = (params, shouldFetch = false) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${CATEGORY_POPULAR_PATH}`, params] : null,
        () =>
            fetchAll(CATEGORY_POPULAR_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        categoryPopularList: data,
        categoryPopularError: error,
        isCategoryPopularLoading: isLoading,
        isValidatingCategoryPopular: isValidating,
        refreshCategoryPopular: mutate,
    };
};

const useGetAllCategoryRevenue = (params, shouldFetch = false) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${CATEGORY_REVENUE_PATH}`, params] : null,
        () =>
            fetchAll(CATEGORY_REVENUE_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        categoryRevenueList: data,
        categoryRevenueError: error,
        isCategoryRevenueLoading: isLoading,
        isValidatingCategoryRevenue: isValidating,
        refreshCategoryRevenue: mutate,
    };
};

const useGetAllCategoryStats = (params, shouldFetch = false) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${CATEGORY_STATS_PATH}`, params] : null,
        () => fetchAll(CATEGORY_STATS_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        categoryStatsList: data,
        categoryStatsError: error,
        isCategoryStatsLoading: isLoading,
        isValidatingCategoryStats: isValidating,
        refreshCategoryStats: mutate,
    };
};

const useGetAllSecondaryCategoryRevenue = (params, shouldFetch = false) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${SECONDARY_CATEGORY_REVENUE_PATH}`, params] : null,
        () => fetchAll(SECONDARY_CATEGORY_REVENUE_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        secondaryCategoryRevenue: data,
        secondaryCategoryRevenueError: error,
        isSecondaryCategoryRevenueLoading: isLoading,
        isValidatingSecondaryCategoryRevenue: isValidating,
        refreshSecondaryCategoryRevenue: mutate,
    };
};

export {
    useGetAllCategoryList,
    useGetAllCategoryPopular,
    useGetAllCategoryRevenue,
    useGetAllCategoryStats,
    useGetAllSecondaryCategoryRevenue,
};
