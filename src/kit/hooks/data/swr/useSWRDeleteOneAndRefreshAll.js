import useSWRMutation from "swr/mutation";
import { swrMutationConfig } from "../../../configs/swrConfigs";
import { deleteOne } from "../fetchers";

const useSWRDeleteOneAndRefreshAll = ({
    path,
    id,
    key,
    apiVersion,
}) => {
    const { data, error, trigger, reset, isMutating } = useSWRMutation(
        key ? [path, key] : [path],
        ([name], { arg }) =>
            deleteOne(name, id, arg.params, arg.headers, apiVersion),
    );

    return {
        data,
        error,
        isDeleting: isMutating,
        reset,
        deleteRecord: (
            deletedRecord,
            options,
        ) => {
            return trigger(
                {
                    body: {},
                },
                {
                    optimisticData: (
                        currentRecords,
                    ) => {
                        if (currentRecords?.data) {
                            const records = currentRecords?.data?.filter(
                                (record) => record.id !== deletedRecord.id,
                            );

                            return {
                                data: [...records],
                                meta: {
                                    ...currentRecords?.meta,
                                },
                            };
                        }

                        return {
                            data: [],
                            meta: {
                                currentPage: 0,
                                recordsPerPage: 10,
                                totalPages: 0,
                                totalRecords: 0,
                            },
                        };
                    },
                    ...swrMutationConfig,
                    ...options,
                },
            );
        },
    };
};

export default useSWRDeleteOneAndRefreshAll;
