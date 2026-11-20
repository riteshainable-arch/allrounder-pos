import useSWR from "swr";
import { API_VERSION, fetchAll, fetchOne } from "./fetchers"
import useSWRCreateOne from "./swr/useSWRCreateOne";
import { useSWRUpdateOne } from "./swr/useSWRUpdateOne";

const HEALTH_PATH = "admin/busy/health";
const COMPANIES_PATH = "admin/busy/companies";
const SALES_SUMMARY_PATH = "admin/busy/sales-summary";
const BUSY_CRM_BILLS_PATH = "admin/busy/bills";
const BUSY_INVOICES_BULK_PATH = "admin/busy/bills/push-bulk";
const BUSY_SALE_INVOICES_PATH = "admin/busy/sale-invoices";
const SYNC_LOGS_PATH = "admin/busy/sync-logs";
const SALES_ORDER_PATH = "admin/sales-order/list";
const ORDER_STATUS_PATH = "admin/busy/sales-orders/status";
const SALES_ORDER_PREVIEW_PATH = "admin/busy/sales-orders";
const BUSY_CUSTOMERS_PATH = "admin/busy/customers";
const PENDING_SALES_ORDERS_PATH = "admin/busy/pending-sales-orders";
const SALE_INVOICES_IMPORT_PATH = "admin/busy/sale-invoices/import";
const BUSY_ITEMS_PATH = "admin/busy/items";
const BUSY_ITEMS_EXPORT_ALL_PATH = "admin/busy/items/export";
const BUSY_ITEMS_EXPORT_TIMEOUT = 120000;
const BUSY_ITEMS_IMPORT_PATH = "admin/busy/items/import";
const BUSY_ITEMS_SYNC_PATH = "admin/busy/items/sync-all";
const BUSY_CRM_ITEMS_PATH = "admin/busy/crm-items";
const BUSY_CRM_ITEMS_PUSH_PATH = "admin/busy/items/push";
const BUSY_CRM_ITEMS_UNLINK_PATH = "admin/busy/masters/unlink";
const BUSY_CRM_ITEMS_LINK_PATH = "admin/busy/masters/link";
const BUSY_STOCK_SYNC_PATH = "admin/busy/stock-sync/runs";
const BUSY_STOCK_SYNC_LINK_PATH = "admin/busy/stock-sync";
const BUSY_SETTINGS_PATH = "admin/busy/settings";
const BUSY_MASTERS_PATH = "admin/busy/masters";

const useGetAllHealth = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${HEALTH_PATH}`, params] : null,
        () => fetchAll(HEALTH_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        HealthList: data,
        HealthListError: error,
        isHealthListLoading: isLoading,
        isValidatingHealthList: isValidating,
        refreshHealthList: mutate,
    }
}

const useGetAllCompanies = (shouldFetch = true, params) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${COMPANIES_PATH}`, params] : null,
        () => fetchAll(COMPANIES_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        CompaniesList: data,
        CompaniesListError: error,
        isCompaniesListLoading: isLoading,
        isValidatingCompaniesList: isValidating,
        refreshCompaniesList: mutate,
    }
}

const useGetAllSalesSummary = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${SALES_SUMMARY_PATH}`, params] : null,
        () => fetchAll(SALES_SUMMARY_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        SalesSummaryList: data,
        SalesSummaryListError: error,
        isSalesSummaryListLoading: isLoading,
        isValidatingSalesSummaryList: isValidating,
        refreshSalesSummaryList: mutate,
    }
}

const useGetAllBusyCrmBills = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${BUSY_CRM_BILLS_PATH}`, params] : null,
        () => fetchAll(BUSY_CRM_BILLS_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        BusyCrmBillsList: data,
        BusyCrmBillsListError: error,
        isBusyCrmBillsListLoading: isLoading,
        isValidatingBusyCrmBillsList: isValidating,
        refreshBusyCrmBillsList: mutate,
    }
}

const useCreateBusyInvoicesBulk = (params) => {
    const { data, error, isMutating, reset, create } = useSWRCreateOne({
        path: BUSY_INVOICES_BULK_PATH,
        key: params,
    });

    return {
        onCreateBusyInvoiceBulk: data,
        createBusyInvoiceBulkError: error,
        isCreatingBusyInvoiceBulk: isMutating,
        createBusyInvoiceBulkReset: reset,
        createBusyInvoiceBulk: create,
    };
};

const useGetAllBusySaleInvoices = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${BUSY_SALE_INVOICES_PATH}`, params] : null,
        () => fetchAll(BUSY_SALE_INVOICES_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        BusySaleInvoicesList: data,
        BusySaleInvoicesListError: error,
        isBusySaleInvoicesListLoading: isLoading,
        isValidatingBusySaleInvoicesList: isValidating,
        refreshBusySaleInvoicesList: mutate,
    }
}

const useGetAllBusySaleInvoiceItems = (shouldFetch = true, id, params) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${BUSY_SALE_INVOICES_PATH}/${id}/items`, params] : null,
        () => fetchAll(`${BUSY_SALE_INVOICES_PATH}/${id}/items`, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        BusySaleInvoiceItemsList: data,
        BusySaleInvoiceItemsListError: error,
        isBusySaleInvoiceItemsListLoading: isLoading,
        isValidatingBusySaleInvoiceItemsList: isValidating,
        refreshBusySaleInvoiceItemsList: mutate,
    }
}

const useGetAllSyncLogs = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${SYNC_LOGS_PATH}`, params] : null,
        () => fetchAll(SYNC_LOGS_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        SyncLogsList: data,
        SyncLogsListError: error,
        isSyncLogsListLoading: isLoading,
        isValidatingSyncLogsList: isValidating,
        refreshSyncLogsList: mutate,
    }
}

const useSyncLogDetail = (shouldFetch = true, id = "", params) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${SYNC_LOGS_PATH}/${id}`, params] : null,
        () => fetchOne(SYNC_LOGS_PATH, id, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        },
    );

    return {
        syncLogDetails: data,
        syncLogDetailsError: error,
        isSyncLogDetailsLoading: isLoading,
        isValidatingSyncLogDetails: isValidating,
        refreshSyncLogDetails: mutate,
    };
};

const useGetAllSalesOrder = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${SALES_ORDER_PATH}`, params] : null,
        () => fetchAll(SALES_ORDER_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        SalesOrderList: data,
        SalesOrderListError: error,
        isSalesOrderListLoading: isLoading,
        isValidatingSalesOrderList: isValidating,
        refreshSalesOrderList: mutate,
    }
}

const useGetAllOrderStatus = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${ORDER_STATUS_PATH}`, params] : null,
        () => fetchAll(ORDER_STATUS_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        OrderStatusList: data,
        OrderStatusListError: error,
        isOrderStatusListLoading: isLoading,
        isValidatingOrderStatusList: isValidating,
        refreshOrderStatusList: mutate,
    }
}

const useGetAllSalesOrderPreview = (shouldFetch = true, id, params) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${SALES_ORDER_PREVIEW_PATH}/${id}/preview`, params] : null,
        () => fetchAll(`${SALES_ORDER_PREVIEW_PATH}/${id}/preview`, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        SalesOrderPreviewList: data,
        SalesOrderPreviewListError: error,
        isSalesOrderPreviewListLoading: isLoading,
        isValidatingSalesOrderPreviewList: isValidating,
        refreshSalesOrderPreviewList: mutate,
    }
}

const useGetAllBusyCustomers = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${BUSY_CUSTOMERS_PATH}`, params] : null,
        () => fetchAll(BUSY_CUSTOMERS_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        BusyCustomersList: data,
        BusyCustomersListError: error,
        isBusyCustomersListLoading: isLoading,
        isValidatingBusyCustomersList: isValidating,
        refreshBusyCustomersList: mutate,
    }
}

const useGetAllPendingSalesOrders = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${PENDING_SALES_ORDERS_PATH}`, params] : null,
        () => fetchAll(PENDING_SALES_ORDERS_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        PendingSalesOrdersList: data,
        PendingSalesOrdersListError: error,
        isPendingSalesOrdersListLoading: isLoading,
        isValidatingPendingSalesOrdersList: isValidating,
        refreshPendingSalesOrdersList: mutate,
    }
}

const useCreateSaleInvoiceImport = (params) => {
    const { data, error, isMutating, reset, create } = useSWRCreateOne({
        path: SALE_INVOICES_IMPORT_PATH,
        key: params,
    });

    return {
        onCreateSaleInvoiceImport: data,
        createSaleInvoiceImportError: error,
        isCreatingSaleInvoiceImport: isMutating,
        createSaleInvoiceImportReset: reset,
        createSaleInvoiceImport: create,
    };
};

const useGetAllBusyItems = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${BUSY_ITEMS_PATH}`, params] : null,
        () => fetchAll(BUSY_ITEMS_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        BusyItemsList: data,
        BusyItemsListError: error,
        isBusyItemsListLoading: isLoading,
        isValidatingBusyItemsList: isValidating,
        refreshBusyItemsList: mutate,
    }
}

const useGetAllBusyItemsExport = (shouldFetch = true, params) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${BUSY_ITEMS_EXPORT_ALL_PATH}`, params] : null,
        () => fetchAll(BUSY_ITEMS_EXPORT_ALL_PATH, params, undefined, API_VERSION, BUSY_ITEMS_EXPORT_TIMEOUT),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        BusyItemsExportList: data,
        BusyItemsExportListError: error,
        isBusyItemsExportListLoading: isLoading,
        isValidatingBusyItemsExportList: isValidating,
        refreshBusyItemsExportList: mutate,
    }
}

const useCreateBusyItemsImport = (params) => {
    const { data, error, isMutating, reset, create } = useSWRCreateOne({
        path: BUSY_ITEMS_IMPORT_PATH,
        key: params,
    });

    return {
        onCreateBusyItemsImport: data,
        createBusyItemsImportError: error,
        isCreatingBusyItemsImport: isMutating,
        createBusyItemsImportReset: reset,
        createBusyItemsImport: create,
    };
};

const useCreateBusyItemsSync = (params) => {
    const { data, error, isMutating, reset, create } = useSWRCreateOne({
        path: BUSY_ITEMS_SYNC_PATH,
        key: params,
        timeout: 120000,
    });

    return {
        onCreateBusyItemsSync: data,
        createBusyItemsSyncError: error,
        isCreatingBusyItemsSync: isMutating,
        createBusyItemsSyncReset: reset,
        createBusyItemsSync: create,
    };
};

const useGetAllBusyCrmItems = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${BUSY_CRM_ITEMS_PATH}`, params] : null,
        () => fetchAll(BUSY_CRM_ITEMS_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        BusyCrmItemsList: data,
        BusyCrmItemsListError: error,
        isBusyCrmItemsListLoading: isLoading,
        isValidatingBusyCrmItemsList: isValidating,
        refreshBusyCrmItemsList: mutate,
    }
}

const useCreateBusyCrmItemsPush = (params) => {
    const { data, error, isMutating, reset, create } = useSWRCreateOne({
        path: BUSY_CRM_ITEMS_PUSH_PATH,
        key: params,
    });

    return {
        onCreateBusyCrmItemsPush: data,
        createBusyCrmItemsPushError: error,
        isCreatingBusyCrmItemsPush: isMutating,
        createBusyCrmItemsPushReset: reset,
        createBusyCrmItemsPush: create,
    };
};

const useCreateBusyCrmItemsUnlink = (params) => {
    const { data, error, isMutating, reset, create } = useSWRCreateOne({
        path: BUSY_CRM_ITEMS_UNLINK_PATH,
        key: params,
    });

    return {
        onCreateBusyCrmItemsUnlink: data,
        createBusyCrmItemsUnlinkError: error,
        isCreatingBusyCrmItemsUnlink: isMutating,
        createBusyCrmItemsUnlinkReset: reset,
        createBusyCrmItemsUnlink: create,
    };
};

const useCreateBusyCrmItemslink = (params) => {
    const { data, error, isMutating, reset, create } = useSWRCreateOne({
        path: BUSY_CRM_ITEMS_LINK_PATH,
        key: params,
    });

    return {
        onCreateBusyCrmItemslink: data,
        createBusyCrmItemslinkError: error,
        isCreatingBusyCrmItemslink: isMutating,
        createBusyCrmItemslinkReset: reset,
        createBusyCrmItemslink: create,
    };
};

const useGetAllBusyStockSync = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${BUSY_STOCK_SYNC_PATH}`, params] : null,
        () => fetchAll(BUSY_STOCK_SYNC_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        BusyStockSyncList: data,
        BusyStockSyncListError: error,
        isBusyStockSyncListLoading: isLoading,
        isValidatingBusyStockSyncList: isValidating,
        refreshBusyStockSyncList: mutate,
    }
}

const useCreateBusyStockSync = (params) => {
    const { data, error, isMutating, reset, create } = useSWRCreateOne({
        path: BUSY_STOCK_SYNC_LINK_PATH,
        key: params,
    });

    return {
        onCreateBusyStockSync: data,
        createBusyStockSyncError: error,
        isCreatingBusyStockSync: isMutating,
        createBusyStockSyncReset: reset,
        createBusyStockSync: create,
    };
};

const useGetAllBusyStockSyncItems = (shouldFetch = true, id, params) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${BUSY_STOCK_SYNC_PATH}/${id}/items`, params] : null,
        () => fetchAll(`${BUSY_STOCK_SYNC_PATH}/${id}/items`, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        BusyStockSyncItemsList: data,
        BusyStockSyncItemsListError: error,
        isBusyStockSyncItemsListLoading: isLoading,
        isValidatingBusyStockSyncItemsList: isValidating,
        refreshBusyStockSyncItemsList: mutate,
    }
}

const useGetAllBusySettings = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${BUSY_STOCK_SYNC_PATH}`, params] : null,
        () => fetchAll(BUSY_SETTINGS_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        BusySettingsList: data,
        BusySettingsListError: error,
        isBusySettingsListLoading: isLoading,
        isValidatingBusySettingsList: isValidating,
        refreshBusySettingsList: mutate,
    }
}

const useGetAllBusyMasters = (params, shouldFetch = true) => {
    const { data, error, isValidating, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${BUSY_MASTERS_PATH}`, params] : null,
        () => fetchAll(BUSY_MASTERS_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        },
    );

    return {
        BusyMastersList: data,
        BusyMastersListError: error,
        isBusyMastersListLoading: isLoading,
        isValidatingBusyMastersList: isValidating,
        refreshBusyMastersList: mutate,
    }
}

const useUpdateBusySettings = (id = "") => {
    const { data, error, isMutating, reset, update } = useSWRUpdateOne({
        path: BUSY_SETTINGS_PATH,
        id,
        status: false,
        method: 'put'
    });

    return {
        data,
        error,
        isUpdatingBusySettings: isMutating,
        reset,
        update,
    };
};

export {
    useGetAllHealth,
    useGetAllCompanies,
    useGetAllSalesSummary,
    useGetAllBusyCrmBills,
    useGetAllBusySaleInvoices,
    useGetAllBusySaleInvoiceItems,
    useGetAllSyncLogs,
    useSyncLogDetail,
    useCreateBusyInvoicesBulk,
    useGetAllSalesOrder,
    useGetAllOrderStatus,
    useGetAllSalesOrderPreview,
    useGetAllBusyCustomers,
    useGetAllPendingSalesOrders,
    useCreateSaleInvoiceImport,
    useGetAllBusyItems,
    useGetAllBusyItemsExport,
    useCreateBusyItemsImport,
    useCreateBusyItemsSync,
    useGetAllBusyCrmItems,
    useCreateBusyCrmItemsPush,
    useCreateBusyCrmItemsUnlink,
    useCreateBusyCrmItemslink,
    useGetAllBusyStockSync,
    useCreateBusyStockSync,
    useGetAllBusyStockSyncItems,
    useGetAllBusySettings,
    useGetAllBusyMasters,
    useUpdateBusySettings,
};
