import axios from "axios"

export const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5083/api/v1"

const unwrap = (r: any) => { r.data = r.data?.data ?? r.data; return r }

export const api = axios.create({ baseURL: BASE_URL, timeout: 10000 })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("@app_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  unwrap,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("@app_token")
      localStorage.removeItem("@app_user")
      localStorage.removeItem("@tenant_id")
      window.location.href = "/"
    }
    return Promise.reject(err)
  }
)

export const pub = axios.create({ baseURL: BASE_URL, timeout: 10000 })
pub.interceptors.response.use(unwrap)
