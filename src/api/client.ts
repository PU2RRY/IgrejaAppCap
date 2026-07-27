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

// Evita condição de corrida: como o backend revoga o refresh token antigo a cada renovação,
// se duas requisições expirarem ao mesmo tempo (comum no cold start do app, que dispara várias
// queries em paralelo) e cada uma chamar /app/refresh por conta própria, a segunda chegaria com
// o token já revogado pela primeira e falharia, derrubando a sessão à toa. Todas as chamadas 401
// concorrentes agora aguardam a mesma renovação em andamento e reaproveitam o resultado.
let renovacaoEmAndamento: Promise<{ accessToken: string; refreshToken: string }> | null = null

function renovarToken() {
  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = (async () => {
      const refreshToken = localStorage.getItem("@app_refresh")
      if (!refreshToken) throw new Error("Sem refresh token")

      const { data } = await axios.post(`${BASE_URL}/app/refresh`, { refreshToken })
      const novo = data?.data ?? data

      localStorage.setItem("@app_token", novo.accessToken)
      localStorage.setItem("@app_refresh", novo.refreshToken)
      return novo
    })().finally(() => { renovacaoEmAndamento = null })
  }
  return renovacaoEmAndamento
}

api.interceptors.response.use(
  unwrap,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && original && !original._retry) {
      original._retry = true
      try {
        const novo = await renovarToken()
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
