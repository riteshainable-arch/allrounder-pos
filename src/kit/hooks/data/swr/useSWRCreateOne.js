import { useCallback } from 'react'
import useSWRMutation from 'swr/mutation'
import { createOne } from '../fetchers'
import { swrMutationConfig } from '../../../configs/swrConfigs'

const useSWRCreateOne = ({ path, key, apiVersion }) => {
  const { data, error, trigger, reset, isMutating } = useSWRMutation(
    key ? [path, key] : [path],
    ([name], { arg }) =>
      createOne(name, arg.body, arg.params, arg.headers, apiVersion)
  )

  const create = useCallback((record, options) => {
    return trigger(
      {
        body: record
      },
      {
        optimisticData: (currentRecords) => {
          const existingItems = currentRecords?.data?.data ?? []
          const updatedItems = [record, ...existingItems]
          const currentTotalItems = currentRecords?.data?.totalItems

          return {
            code: currentRecords?.code ?? 200,
            message: 'Optimistic update',
            data: {
              data: updatedItems,
              totalPage: currentRecords?.data?.totalPage ?? 1,
              totalItems:
                typeof currentTotalItems === 'number'
                  ? currentTotalItems + 1
                  : updatedItems.length
            }
          }
        },
        ...swrMutationConfig,
        ...options
      }
    )
  }, [trigger])

  return {
    data,
    error,
    isMutating,
    reset,
    create
  }
}

export default useSWRCreateOne
