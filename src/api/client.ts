import axios from "axios"

export const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5083/api/v1"

const unwrap = (r: any) => { r.data = r.data?.data ?? r.data; return r }

function limparSessaoEIrParaLogin() {
  localStorage.removeItem("@app_token")
  localStorage.removeItem("@app_refresh")
  localStorage.removeItem("@app_user")
  localStorage.removeItem("@tenant_id")
  window.location.href = "/"
}

export const api = axios.create({ baseURL: BASE_URL, timeout: 10000 })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("@app_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  unwrap,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && original && !original._retry) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem("@app_refresh")
        if (!refreshToken) throw new Error("Sem refresh token")

        const { data } = await axios.post(`${BASE_URL}/app/refresh`, { refreshToken })
        const novo = data?.data ?? data

        localStorage.setItem("@app_token", novo.accessToken)
        localStorage.setItem("@app_refresh", novo.refreshToken)

        original.headers.Authorization = `Bearer ${novo.accessToken}`
        return api(original)
      } catch {
        limparSessaoEIrParaLogin()
      }
    }
    return Promise.reject(err)
  }
)

export const pub = axios.create({ baseURL: BASE_URL, timeout: 10000 })
pub.interceptors.response.use(unwrap)
