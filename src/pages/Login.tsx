import { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { appAuthApi } from "../api"

export default function Login() {
  const [params] = useSearchParams()
  const tenantId = params.get("tenantId") ?? ""
  const nome     = params.get("nome") ?? ""
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [email,   setEmail]   = useState("")
  const [senha,   setSenha]   = useState("")
  const [erro,    setErro]    = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro("")
    setLoading(true)
    try {
      const { data } = await appAuthApi.login(tenantId, { email, senha })
      login(data.accessToken, data.refreshToken, {
        idAppUsuario: data.idAppUsuario,
        nome:         data.nome,
        email:        data.email,
        status:       data.status,
        tenantId:     data.tenantId,
        idMembro:     data.idMembro,
      })
      navigate("/home")
    } catch (err: any) {
      setErro(err.response?.data?.message ?? "Email ou senha incorretos")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center p-6">
      <button onClick={() => navigate("/")} className="text-indigo-600 text-sm mb-6">← Trocar de Igreja</button>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <p className="text-center text-gray-500 text-sm mb-1">{nome}</p>
        <h2 className="text-2xl font-bold text-center mb-6">Entrar</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Email</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 h-11 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Senha</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 h-11 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" required />
          </div>
          {erro && <p className="text-red-500 text-sm">{erro}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold rounded-lg h-11 mt-2 disabled:opacity-60">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <Link to={`/esqueci-senha?tenantId=${tenantId}&nome=${encodeURIComponent(nome)}`}
          className="block text-center text-indigo-600 text-sm mt-4">
          Esqueci minha senha
        </Link>

        <Link to={`/register?tenantId=${tenantId}&nome=${encodeURIComponent(nome)}`}
          className="block text-center text-indigo-600 text-sm mt-4">
          Não tem conta? Cadastre-se
        </Link>

        <Link to={`/visitante?tenantId=${tenantId}&nome=${encodeURIComponent(nome)}`}
          className="block text-center text-gray-500 text-sm mt-3">
          Estou apenas visitando
        </Link>
      </div>
    </div>
  )
}
