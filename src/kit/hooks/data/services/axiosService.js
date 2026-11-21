import axios from 'axios'
import storage from '../services/storage'
import { toast } from 'react-toastify'
import authConfig from '../../../configs/auth'
import { logPosError } from '../../../utils/errorLogger'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  timeout: 15000,
})

const apiBaseUrl = import.meta.env.VITE_BASE_URL || ''
const isNgrokApi = apiBaseUrl.includes('ngrok')


/** Add request/response interceptor */
let isRefreshing = false // Flag to prevent multiple refresh calls
let refreshSubscribers = []

axiosInstance.interceptors.request.use(
  (config) => {
    if (isNgrokApi) {
      config.headers['ngrok-skip-browser-warning'] = 'true'
    }

    const accessToken = storage.getItem(authConfig.storageTokenKeyName)

    if (accessToken) {
      config.headers['Authorization'] = `${accessToken}`
      config.params = {
        ...config.params
      }
    }

    return config
  },
  error => Promise.reject(error)
)

function onRefreshed(token) {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback)
}
    
/** Add request/response interceptor */
axiosInstance.interceptors.response.use(
  (response) => {
    const responseData = response.data
    const errorCode = responseData?.code ?? responseData?.statusCode

    if (errorCode === 283 || response.status === 283) {
      toast.error('Invalid token')
      setTimeout(() => {
        handleLogout() // Logout on invalid token
      }, 1000);
    }

    return response
  },
  async error => {
    const originalRequest = error.config
    const response = error.response
    const responseData = response?.data
    const errorCode = responseData?.code ?? responseData?.statusCode

    if (errorCode === 283 || response?.status === 283) {
      handleLogout() // Logout on invalid token
    }
    // if (response && response.status === 401 && !originalRequest._retry) {
    //   const storedRefreshToken = storage.getItem(authConfig.storageRefreshKeyName)

    //   if (!storedRefreshToken) {
    //     return Promise.reject(error)
    //   }

    //   if (isRefreshing) {
    //     return new Promise(resolve => {
    //       addRefreshSubscriber((token) => {
    //         originalRequest.headers.Authorization = `${token}`
    //         resolve(axiosInstance(originalRequest))
    //       })
    //     })
    //   }

    //   originalRequest._retry = true
    //   isRefreshing = true

    //   try {
    //     const refreshResponse = await axiosInstance.post(authConfig.refreshEndpoint, {
    //       refreshToken: storedRefreshToken
    //     })

    //     if (refreshResponse.status === 201) {
    //       const { accessToken, refreshToken } = refreshResponse.data.data
    //       storage.setItem(authConfig.storageTokenKeyName, accessToken)
    //       storage.setItem(authConfig.storageRefreshKeyName, refreshToken)

    //       onRefreshed(accessToken)
    //       isRefreshing = false

    //       // Retry the original request with the new token
    //       originalRequest.headers.Authorization = `${accessToken}`

    //       return axiosInstance(originalRequest)
    //     } else {
    //       handleLogout()
    //     }
    //   } catch (e) {
    //     handleLogout() // Logout on refresh failure
    //   } finally {
    //     isRefreshing = false
    //   }
    // }

    return Promise.reject(error)
  }
)

const get = async (path, params, headers) => {
  try {
    const response = await axiosInstance.get(path, {
      params: params,
      headers: headers
    })

    return handleResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

const post = async (path, payload, params, headers) => {
  try {
    const response = await axiosInstance.post(path, payload, {
      params: params,
      headers: headers
    })

    return handleResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

const patch = async (path, payload, params, headers) => {
  try {
    const response = await axiosInstance.patch(path, payload, {
      params: params,
      headers: headers
    })

    return handleResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

const put = async (path, payload, params, headers) => {
  try {
    const response = await axiosInstance.put(path, payload, {
      params: params,
      headers: headers
    })

    return handleResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

const remove = async (path, params, headers) => {
  try {
    const response = await axiosInstance.delete(path, {
      params: params,
      headers: headers
    })

    return handleResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

export const request = async ({
  path,
  method,
  payload,
  params,
  headers
}) => {
  try {
    const response = await axiosInstance.request({
      method,
      url: path,
      data: payload,
      params: params,
      headers: headers
    })

    return handleResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const handleResponse = (response) => {
  const data = response.data
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch (error) {
      return data
    }
  } else if (typeof data === 'object' && data !== null) {
    return data
  }
}

const handleError = async (error) => {
  const responseData = error.response?.data
  const statusCode = error.response?.status
  const apiMessage =
    typeof responseData?.message === 'string'
      ? responseData.message
      : typeof responseData?.detail === 'string'
        ? responseData.detail
        : undefined

  await logPosError(error, {
    type: 'api-error',
    source: 'axiosService',
    details: {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url?.split(/[?#]/, 1)[0],
      status: statusCode,
      apiCode: responseData?.code ?? responseData?.statusCode,
      apiMessage
    }
  })

  if (statusCode === 500) {
    throw [
      {
        title: 'general_error',
        detail: 'An error occurred, Please retry again later',
        code: statusCode || 500
      }
    ]
  } else {
    if (responseData?.errors) {
      const errors = responseData
      throw errors
    } else {
      throw responseData
    }
  }
}

/** Handle logout logic */
function handleLogout() {
  storage.removeItem(authConfig.storageUserIDName)
  storage.removeItem(authConfig.storageUserDetailName)
  storage.removeItem(authConfig.storageCompanyDetailName)
  storage.removeItem(authConfig.storageTokenKeyName)
  storage.removeItem(authConfig.storageRefreshKeyName)

  window.location.href = '/login' // Example: Redirect to login page
}

export default { get, post, patch, put, remove, request }
