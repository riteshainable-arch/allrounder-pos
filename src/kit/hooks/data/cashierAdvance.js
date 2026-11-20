import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { API_VERSION, fetchAll } from "./fetchers";
import API from "./services/axiosService";

const ADVANCE_PATH = "admin/cashier-advance";

const useAdvanceSlips = (params, shouldFetch = true) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${ADVANCE_PATH}`, params] : null,
        () => fetchAll(ADVANCE_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: true,
            keepPreviousData: true,
        }
    );

    return {
        advanceSlips: data,
        advanceSlipsError: error,
        isAdvanceSlipsLoading: isLoading,
        isValidatingAdvanceSlips: isValidating,
        refreshAdvanceSlips: mutate,
    };
};

const fetchAdvanceSlips = (params) => API.get(`${API_VERSION}/${ADVANCE_PATH}`, params);

const useAdvanceSlipDetail = (id, shouldFetch = true) => {
    const { data, error, isLoading, mutate } = useSWR(
        shouldFetch && id ? [`${API_VERSION}/${ADVANCE_PATH}/${id}`] : null,
        () => fetchAll(`${ADVANCE_PATH}/${id}`),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
        }
    );

    return {
        advanceSlipDetail: data,
        advanceSlipDetailError: error,
        isAdvanceSlipDetailLoading: isLoading,
        refreshAdvanceSlipDetail: mutate,
    };
};

const useAdvancePendingCount = (params = {}, shouldFetch = true) => {
    const { data, error, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${ADVANCE_PATH}/pending-count`, params] : null,
        () => fetchAll(`${ADVANCE_PATH}/pending-count`, params),
        {
            revalidateOnMount: true,
            refreshInterval: 45000,
            revalidateOnFocus: true,
        }
    );

    return {
        pendingCount: data?.data?.count ?? data?.count ?? 0,
        pendingCountError: error,
        isPendingCountLoading: isLoading,
        refreshPendingCount: mutate,
    };
};

const createAdvanceSlip = (body) => API.post(`${API_VERSION}/${ADVANCE_PATH}`, body);

const useCreateAdvanceSlip = () => {
    const { trigger, isMutating } = useSWRMutation(
        `${API_VERSION}/${ADVANCE_PATH}`,
        (_, { arg }) => createAdvanceSlip(arg)
    );

    return { createAdvanceSlip: trigger, isCreatingAdvanceSlip: isMutating };
};

const updateAdvanceSlip = (id, body) =>
    API.patch(`${API_VERSION}/${ADVANCE_PATH}/${id}`, body);

const useUpdateAdvanceSlip = () => {
    const { trigger, isMutating } = useSWRMutation(
        `${API_VERSION}/${ADVANCE_PATH}`,
        (_, { arg }) => updateAdvanceSlip(arg.id, arg.body)
    );

    return { updateAdvanceSlip: trigger, isUpdatingAdvanceSlip: isMutating };
};

const approveAdvanceSlip = (id, body) =>
    API.patch(`${API_VERSION}/${ADVANCE_PATH}/${id}/approve`, body);

const useApproveAdvanceSlip = () => {
    const { trigger, isMutating } = useSWRMutation(
        `${API_VERSION}/${ADVANCE_PATH}/approve`,
        (_, { arg }) => approveAdvanceSlip(arg.id, arg.body)
    );

    return { approveAdvanceSlip: trigger, isApprovingAdvanceSlip: isMutating };
};

const rejectAdvanceSlip = (id, body) =>
    API.patch(`${API_VERSION}/${ADVANCE_PATH}/${id}/reject`, body);

const useRejectAdvanceSlip = () => {
    const { trigger, isMutating } = useSWRMutation(
        `${API_VERSION}/${ADVANCE_PATH}/reject`,
        (_, { arg }) => rejectAdvanceSlip(arg.id, arg.body)
    );

    return { rejectAdvanceSlip: trigger, isRejectingAdvanceSlip: isMutating };
};

const cancelAdvanceSlip = (id, body) =>
    API.post(`${API_VERSION}/${ADVANCE_PATH}/${id}/cancel`, body);

const useCancelAdvanceSlip = () => {
    const { trigger, isMutating } = useSWRMutation(
        `${API_VERSION}/${ADVANCE_PATH}/cancel`,
        (_, { arg }) => cancelAdvanceSlip(arg.id, arg.body)
    );

    return { cancelAdvanceSlip: trigger, isCancellingAdvanceSlip: isMutating };
};

export {
    useAdvanceSlips,
    useAdvanceSlipDetail,
    useAdvancePendingCount,
    useCreateAdvanceSlip,
    useUpdateAdvanceSlip,
    useApproveAdvanceSlip,
    useRejectAdvanceSlip,
    useCancelAdvanceSlip,
    fetchAdvanceSlips,
};
