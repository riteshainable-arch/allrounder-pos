
import { API_VERSION } from './fetchers'
import useSWRCreateOne from './swr/useSWRCreateOne'

const LOGIN_PATH_NAME = 'user/auth/login'

const useSWRLogin = () => {
  const { data, error, isMutating, reset, create } = useSWRCreateOne({
    path: LOGIN_PATH_NAME,
    apiVersion: API_VERSION
  })

  return {
    data,
    error,
    isMutating,
    reset,
    create
  }
}

export { useSWRLogin }
