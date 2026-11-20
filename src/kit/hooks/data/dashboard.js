import { API_VERSION, fetchAll } from './fetchers'
import useSWR from "swr";

const DASHBOARD_GENERAL_PATH = "admin/dashboard/general-analysis";
const DASHBOARD_SALES_OVERVIEW_PATH = "admin/dashboard/sales-overview";
const DASHBOARD_ALERTS_OVERVIEW_PATH = "admin/dashboard/alerts-overview";
const CUSTOMER_SEGMENT_DASHBOARD_CHART = "admin/customer-segments/dashboard-chart";

const useGetAllDashboardGeneral = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${DASHBOARD_GENERAL_PATH}`, params] : null,
        () => fetchAll(DASHBOARD_GENERAL_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        dashboardGeneral: data,
        dashboardGeneralError: error,
        isDashboardGeneralLoading: isLoading,
        isValidatingDashboardGeneral: isValidating,
        refreshDashboardGeneral: mutate,
    };
};

const useGetAllDashboardSalesOverview = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${DASHBOARD_SALES_OVERVIEW_PATH}`, params] : null,
        () => fetchAll(DASHBOARD_SALES_OVERVIEW_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        dashboardSalesOverview: data,
        dashboardSalesOverviewError: error,
        isDashboardSalesOverviewLoading: isLoading,
        isValidatingDashboardSalesOverview: isValidating,
        refreshDashboardSalesOverview: mutate,
    };
};

const useGetAllDashboardAlertsOverview = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${DASHBOARD_ALERTS_OVERVIEW_PATH}`, params] : null,
        () => fetchAll(DASHBOARD_ALERTS_OVERVIEW_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        dashboardAlertsOverview: data,
        dashboardAlertsOverviewError: error,
        isDashboardAlertsOverviewLoading: isLoading,
        isValidatingDashboardAlertsOverview: isValidating,
        refreshDashboardAlertsOverview: mutate,
    };
};

const useGetCustomerSegmentsDashboardChart = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${CUSTOMER_SEGMENT_DASHBOARD_CHART}`, params] : null,
        () => fetchAll(CUSTOMER_SEGMENT_DASHBOARD_CHART, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        customerSegmentDashboardChart: data,
        customerSegmentDashboardChartError: error,
        isCustomerSegmentDashboardChartLoading: isLoading,
        isValidatingCustomerSegmentDashboardChart: isValidating,
        refreshCustomerSegmentDashboardChart: mutate,
    };
};

export { useGetAllDashboardGeneral, useGetAllDashboardSalesOverview, useGetAllDashboardAlertsOverview, useGetCustomerSegmentsDashboardChart };
