import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"

interface AppUser {
  idAppUsuario: number
  nome: string
  email: string
  status: string
  tenantId: string
  idMembro?: number
}

interface AuthCtx {
  user: AppUser | null
  tenantId: string | null
  token: string | null
  loading: boolean
  login: (token: string, refresh: string, user: AppUser) => void
  logout: () => void
  setTenant: (id: string, nome: string) => void
  tenantNome: string | null
}

const Ctx = createContext<AuthCtx>({} as AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user,       setUser]       = useState<AppUser | null>(null)
  const [token,      setToken]      = useState<string | null>(null)
  const [tenantId,   setTenantId]   = useState<string | null>(null)
  const [tenantNome, setTenantNome] = useState<string | null>(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    const t  = localStorage.getItem("@app_token")
    const u  = localStorage.getItem("@app_user")
    const ti = localStorage.getItem("@tenant_id")
    const tn = localStorage.getItem("@tenant_nome")
    setToken(t)
    setUser(u && u !== "undefined" ? JSON.parse(u) : null)
    setTenantId(ti)
    setTenantNome(tn)
    setLoading(false)
  }, [])

  const login = (token: string, refresh: string, user: AppUser) => {
    localStorage.setItem("@app_token",   token)
    localStorage.setItem("@app_refresh", refresh)
    localStorage.setItem("@app_user",    JSON.stringify(user))
    localStorage.setItem("@tenant_id",   user.tenantId)
    setToken(token)
    setUser(user)
    setTenantId(user.tenantId)
  }

  const logout = () => {
    localStorage.clear()
    queryClient.clear()
    setToken(null)
    setUser(null)
    setTenantId(null)
    setTenantNome(null)
  }

  const setTenant = (id: string, nome: string) => {
    localStorage.setItem("@tenant_id",   id)
    localStorage.setItem("@tenant_nome", nome)
    setTenantId(id)
    setTenantNome(nome)
  }

  return (
    <Ctx.Provider value={{ user, token, tenantId, tenantNome, loading, login, logout, setTenant }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
