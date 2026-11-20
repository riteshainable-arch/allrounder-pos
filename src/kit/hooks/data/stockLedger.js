
import useSWR from "swr";
import { API_VERSION, fetchAll } from "./fetchers";

const STOCK_LEDGER_PATH = "admin/stock-ledger/ledger";
const MOVEMENT_TYPE_PATH = "admin/stock-ledger/movement-types";

const useGetAllStockLedgerReport = (params, shouldFetch = true) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${STOCK_LEDGER_PATH}`, params] : null,
        () => fetchAll(STOCK_LEDGER_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            keepPreviousData: true,
        }
    );

    return {
        ledgerList: data,
        ledgerError: error,
        isLedgerLoading: isLoading,
        isValidatingLedger: isValidating,
        refreshLedger: mutate,
    };
}

const useMovementTypes = (params, shouldFetch = true) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${MOVEMENT_TYPE_PATH}`, params] : null,
        () => fetchAll(MOVEMENT_TYPE_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            keepPreviousData: true,
        }
    );

    return {
        movementTypes: data?.data,
        movementTypesError: error,
        isMovementTypesLoading: isLoading,
        isValidatingMovementTypes: isValidating,
        refreshMovementTypes: mutate,
    };
}

export { useGetAllStockLedgerReport, useMovementTypes };
