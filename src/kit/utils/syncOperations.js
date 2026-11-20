import { getAllProductsForSync } from "../hooks/data/products";
import { getAllStoresForSync } from "../hooks/data/store";
import { findOrCreateCustomer, getAllCustomersForSync } from "../hooks/data/customer";
import { createOne, API_VERSION } from "../hooks/data/fetchers";
import { formatBillsForUpload } from "./billPayments";
import { filterBillsForCashier } from "./cashierBills";

export const SYNC_INTERVAL_MS = 30 * 60 * 1000;
export const DEFAULT_STORE_ID = 1;
export const DEFAULT_LIMIT = 20;
export const INITIAL_SYNC_STEPS = 2;
export const PRODUCT_SAVE_CHUNK_SIZE = 2500;

const INVOICE_UPLOAD_PATH = "admin/invoice/generate-bill";
const DAY_BILLS_UPLOAD_PATH = "admin/cashier-log/save";

const formatCount = (value) => Number(value || 0).toLocaleString();

const persistProductsInChunks = async (products, onChunkProgress) => {
    const api = window.api;
    const total = products.length;

    if (!api?.saveProductsChunk) {
        const result = await api.saveProducts(products);
        onChunkProgress?.(total, total);
        return { total: result?.total ?? total };
    }

    if (!total) {
        await api.saveProductsChunk({ productsJson: "[]", clearFirst: true });
        onChunkProgress?.(0, 0);
        return { total: 0 };
    }

    for (let index = 0; index < total; index += PRODUCT_SAVE_CHUNK_SIZE) {
        const chunk = products.slice(index, index + PRODUCT_SAVE_CHUNK_SIZE);
        await api.saveProductsChunk({
            productsJson: JSON.stringify(chunk),
            clearFirst: index === 0,
        });
        onChunkProgress?.(Math.min(index + chunk.length, total), total);
    }

    return { total };
};

export const buildSyncProgress = ({
    step,
    totalSteps = INITIAL_SYNC_STEPS,
    current = 0,
    total = 0,
    label,
    phase = "working",
}) => {
    const stepSize = 100 / totalSteps;
    const base = (step - 1) * stepSize;
    let percent;

    if (phase === "done") {
        percent = Math.round(step * stepSize);
    } else if (total > 0) {
        percent = Math.round(base + (current / total) * stepSize);
    } else {
        percent = Math.round(base + stepSize * 0.2);
    }

    return {
        step,
        totalSteps,
        current,
        total,
        label,
        percent: Math.min(99, percent),
        detail:
            total > 0
                ? `${formatCount(current)} / ${formatCount(total)}`
                : "",
    };
};

export const syncProducts = async ({
    storeId = DEFAULT_STORE_ID,
    step = 2,
    totalSteps = INITIAL_SYNC_STEPS,
    onProgress,
    useChunks = false,
} = {}) => {
    onProgress?.(
        buildSyncProgress({
            step,
            totalSteps,
            label: "Fetching products from server...",
            phase: "fetch",
        })
    );

    const productResponse = await getAllProductsForSync({
        storeId,
        page: 1,
        limit: 100000,
    });
    const products = productResponse.data?.products || [];
    const total = products.length;

    onProgress?.(
        buildSyncProgress({
            step,
            totalSteps,
            current: 0,
            total,
            label: "Saving products to local database...",
        })
    );

    const productResult = useChunks
        ? await persistProductsInChunks(products, (current, chunkTotal) => {
            onProgress?.(
                buildSyncProgress({
                    step,
                    totalSteps,
                    current,
                    total: chunkTotal,
                    label: "Saving products to local database...",
                })
            );
        })
        : {
            total: (await window.api.saveProducts(products))?.total ?? total,
        };

    if (!useChunks) {
        onProgress?.(
            buildSyncProgress({
                step,
                totalSteps,
                current: total,
                total,
                label: "Saving products to local database...",
            })
        );
    }

    onProgress?.(
        buildSyncProgress({
            step,
            totalSteps,
            current: total,
            total,
            label: "Products saved",
            phase: "done",
        })
    );

    return {
        total: productResult.total ?? total,
        message: `Products: ${productResult.total ?? total}`,
    };
};

export const syncStores = async ({
    step = 1,
    totalSteps = INITIAL_SYNC_STEPS,
    onProgress,
} = {}) => {
    onProgress?.(
        buildSyncProgress({
            step,
            totalSteps,
            label: "Fetching stores from server...",
            phase: "fetch",
        })
    );

    const storeResponse = await getAllStoresForSync({ page: 1, size: 100000 });
    const stores = storeResponse.data?.stores || [];
    const total = stores.length;

    onProgress?.(
        buildSyncProgress({
            step,
            totalSteps,
            current: 0,
            total,
            label: "Saving stores locally...",
        })
    );

    const storeResult = await window.api.saveStores(stores);

    onProgress?.(
        buildSyncProgress({
            step,
            totalSteps,
            current: total,
            total,
            label: "Stores saved",
            phase: "done",
        })
    );

    return {
        total: storeResult.total ?? total,
        message: `Stores: ${storeResult.total ?? total}`,
    };
};

export const syncCustomersLocal = async ({
    step = 3,
    totalSteps = INITIAL_SYNC_STEPS,
    onProgress,
} = {}) => {
    onProgress?.(
        buildSyncProgress({
            step,
            totalSteps,
            label: "Fetching customers from server...",
            phase: "fetch",
        })
    );

    const customerResponse = await getAllCustomersForSync({ page: 1, size: 100000 });
    const customers = customerResponse.data || [];
    const total = customers.length;

    onProgress?.(
        buildSyncProgress({
            step,
            totalSteps,
            current: 0,
            total,
            label: "Saving customers locally...",
        })
    );

    const customerResult = await window.api.saveCustomers(customers);

    onProgress?.(
        buildSyncProgress({
            step,
            totalSteps,
            current: total,
            total,
            label: "Customers saved",
            phase: "done",
        })
    );

    return {
        customers: customerResult.total ?? total,
        message: `Customers: ${customerResult.total ?? total}`,
    };
};

export const syncCustomers = async ({ onProgress } = {}) => {
    const customerResponse = await getAllCustomersForSync({ page: 1, size: 100000 });
    const customers = customerResponse.data || [];
    const total = customers.length;

    onProgress?.({
        label: "Saving customers locally...",
        current: 0,
        total,
        detail: `0 / ${formatCount(total)} customers`,
    });

    const customerResult = await window.api.saveCustomers(customers);

    onProgress?.({
        label: "Syncing customer profiles...",
        current: 0,
        total,
        detail: `0 / ${formatCount(total)} profiles`,
    });

    // const customerInputs = customers.map((customer) => ({
    //     name: customer.firstName,
    //     phone: customer.phone,
    // }));

    // const customerProfilesArray = [];
    // for (let index = 0; index < customerInputs.length; index += 1) {
    //     const customer = customerInputs[index];
    //     const response = await findOrCreateCustomer(customer);
    //     customerProfilesArray.push(response?.data);

    //     if (index % 25 === 0 || index === customerInputs.length - 1) {
    //         onProgress?.({
    //             label: "Syncing customer profiles...",
    //             current: index + 1,
    //             total,
    //             detail: `${formatCount(index + 1)} / ${formatCount(total)} profiles`,
    //         });
    //     }
    // }

    // const customerProfileResult = await window.api.saveCustomerProfiles(customerProfilesArray);

    return {
        customers: customerResult.total,
        // profiles: customerProfileResult.total,
        message: `Customers: ${customerResult.total}`,
        // message: `Customers: ${customerResult.total}, Profiles: ${customerProfileResult.total}`,
    };
};

export const uploadInvoiceToServer = async (bill) => {
    const response = await createOne(
        INVOICE_UPLOAD_PATH,
        formatBillsForUpload([bill]),
        undefined,
        undefined,
        API_VERSION
    );

    return response?.data ?? response ?? {
        uploaded: 1,
        message: "Bill uploaded successfully.",
    };
};

export const uploadInvoicesToServer = async ({ userData } = {}) => {
    if (!window.api?.getBills) {
        throw new Error("Electron API is not available.");
    }

    const data = await window.api.getBills();
    const rows = filterBillsForCashier(data, userData).filter(
        bill => bill.syncStatus !== "SYNCED"
    );

    if (!rows.length) {
        return { uploaded: 0, message: "No bills available to upload." };
    }

    const chunkSize = 100;
    let uploaded = 0;

    for (let i = 0; i < rows.length; i += chunkSize) {
        const batch = rows.slice(i, i + chunkSize);
        await createOne(INVOICE_UPLOAD_PATH, formatBillsForUpload(batch), undefined, undefined, API_VERSION);
        uploaded += batch.length;
        for (const bill of batch) {
            try {
                if (bill.indexNo) {
                    await window.api.updateBillSyncStatus(bill.indexNo, "SYNCED");
                }
            } catch (error) {
                console.error(`Failed to update sync status for bill ${bill.indexNo}:`, error);
            }
        }
    }

    return {
        uploaded,
        message: `${uploaded} bills uploaded successfully.`,
    };
};

export const syncDayBillsToServer = async ({ cashierId } = {}) => {
    if (!cashierId) {
        throw new Error("Cashier id is required for day bill sync.");
    }

    if (!window.api?.getDayBills) {
        throw new Error("Electron API is not available.");
    }

    const dayBills = await window.api.getDayBills(cashierId);

    if (!dayBills.length) {
        return { totalItems: 0, message: "No day bills available to sync." };
    }

    const dayBillsResponse = await createOne(
        DAY_BILLS_UPLOAD_PATH,
        dayBills,
        undefined,
        undefined,
        API_VERSION
    );

    return {
        totalItems: dayBillsResponse?.data?.totalItems ?? dayBills.length,
        message: `Day bills: ${dayBillsResponse?.data?.totalItems ?? dayBills.length}`,
    };
};

export const runPeriodicSync = async ({
    storeId = DEFAULT_STORE_ID,
    userData,
    includeProducts = false,
} = {}) => {
    if (!navigator.onLine) {
        return { skipped: true, reason: "offline" };
    }

    const results = {};

    results.invoices = await uploadInvoicesToServer({ userData });

    if (includeProducts) {
        results.products = await syncProducts({ storeId, useChunks: false });
    }

    return results;
};

export const runEndDaySync = async ({
    storeId = DEFAULT_STORE_ID,
    userData,
    cashierId,
} = {}) => {
    if (!navigator.onLine) {
        return { skipped: true, reason: "offline" };
    }

    const results = {};

    results.dayBills = await syncDayBillsToServer({ cashierId });
    results.invoices = await uploadInvoicesToServer({ userData });
    results.products = await syncProducts({ storeId, useChunks: false });

    return results;
};

export const runInitialSync = async ({
    storeId = DEFAULT_STORE_ID,
    onProgress,
} = {}) => {
    const totalSteps = INITIAL_SYNC_STEPS;
    const results = {};

    onProgress?.(
        buildSyncProgress({
            step: 1,
            totalSteps,
            label: "Downloading stores and products...",
            phase: "fetch",
        })
    );

    const [storeResponse, productResponse] = await Promise.all([
        getAllStoresForSync({ page: 1, size: 100000 }),
        getAllProductsForSync({
            storeId,
            page: 1,
            limit: 100000,
        }),
    ]);

    const stores = storeResponse.data?.stores || [];
    const products = productResponse.data?.products || [];

    onProgress?.(
        buildSyncProgress({
            step: 1,
            totalSteps,
            current: 0,
            total: stores.length,
            label: "Saving stores locally...",
        })
    );

    const storeResult = await window.api.saveStores(stores);
    results.stores = {
        total: storeResult?.total ?? stores.length,
        message: `Stores: ${storeResult?.total ?? stores.length}`,
    };

    onProgress?.(
        buildSyncProgress({
            step: 1,
            totalSteps,
            current: stores.length,
            total: stores.length,
            label: "Stores saved",
            phase: "done",
        })
    );

    onProgress?.(
        buildSyncProgress({
            step: 2,
            totalSteps,
            current: 0,
            total: products.length,
            label: "Saving products to local database...",
        })
    );

    const productResult = await persistProductsInChunks(products, (current, total) => {
        onProgress?.(
            buildSyncProgress({
                step: 2,
                totalSteps,
                current,
                total,
                label: "Saving products to local database...",
            })
        );
    });

    results.products = {
        total: productResult.total,
        message: `Products: ${productResult.total}`,
    };

    onProgress?.(
        buildSyncProgress({
            step: 2,
            totalSteps,
            current: products.length,
            total: products.length,
            label: "Products saved",
            phase: "done",
        })
    );

    onProgress?.({
        step: totalSteps,
        totalSteps,
        label: "Setup complete",
        detail: "Opening application...",
        percent: 100,
        current: 1,
        total: 1,
    });

    return results;
};
