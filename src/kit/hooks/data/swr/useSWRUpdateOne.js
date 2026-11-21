import useSWRMutation from "swr/mutation";
import { updateOne } from "../fetchers";
import { swrMutationConfig } from "../../../configs/swrConfigs";

export const useSWRUpdateOne = ({
    path,
    id,
    apiVersion,
    status,
}) => {
    const { data, error, trigger, reset, isMutating } = useSWRMutation(
        [`${path}/${id}`],
        ([], { arg }) =>
            updateOne(path, id, arg.body, arg.params, arg.headers, apiVersion, status),
    );

    const defaultOptimisticData = (
        currentRecord,
        record,
    ) => {
        return { ...currentRecord, ...record };
    };

    return {
        data,
        error,
        isMutating,
        reset,
        update: (
            record,
            customOptimisticData,
            options,
        ) => {
            const optimisticDataFn =
                customOptimisticData || defaultOptimisticData;

            return trigger(
                {
                    body: record,
                },
                {
                    optimisticData: (currentRecord) =>
                        optimisticDataFn(currentRecord, record),
                    ...swrMutationConfig,
                    ...options,
                },
            );
        },
    };
};
