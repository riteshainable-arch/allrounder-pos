import API from '../services/axiosService'

export const EMPTY_API_VERSION = ''
export const API_VERSION = 'v1'
export const API_VERSION_V2 = 'v2'

const fetchAll = async (
  name,
  params,
  headers,
  apiVersion = API_VERSION,
  timeout,
) => {
  const path = `${apiVersion}/${name}`

  return API.get(path, params, headers, timeout)
}

const fetchOne = async (
  name,
  id,
  params,
  headers,
  apiVersion = API_VERSION,
) => {
  const path = `${apiVersion}/${name}/${id}`

  return API.get(path, params, headers)
}

const createOne = async (
  name,
  body,
  params,
  headers,
  apiVersion = API_VERSION,
  timeout,
) => {
  const path = `${apiVersion}/${name}`


  return API.post(path, body, params, headers, timeout)
}

const updateOne = async (
  name,
  id,
  body,
  params,
  headers,
  apiVersion = API_VERSION,
  status,
  password,
  method = "PATCH",
) => {
  let path
  if (status) {
    path = `/${apiVersion}/${name}/${id}/status`;
  } else if (password) {
    path = `/${apiVersion}/${name}/${id}/password`;
  } else {
    path = `/${apiVersion}/${name}/${id}`;
  }
  return API[method.toLowerCase()](path, body, params, headers);
};

const deleteOne = async (
  name,
  id,
  params,
  headers,
  apiVersion,
) => {
  const apiVer = apiVersion || API_VERSION
  const path = id ? `/${apiVer}/${name}/${id}` : `/${apiVer}/${name}`;

  return API.remove(path, params, headers)
}

const customRequest = async ({
  name,
  method,
  id,
  payload,
  params,
  headers,
  apiVersion = API_VERSION,
}) => {
  const path = id ? `/${name}/${id}` : `/${name}`


  return API.request({
    path,
    method,
    payload,
    params,
    headers
  })
}

const fetcher = async (url, params) => {
  const response = await fetch(`${url}?${params}`)

  return await response.json()
}

export { fetchOne, fetchAll, createOne, updateOne, deleteOne, customRequest, fetcher }
