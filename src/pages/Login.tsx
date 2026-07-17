import { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { appAuthApi } from "../api"
import { useFundoApp } from "../hooks/useFundoApp"

export default function Login() {
  const [params] = useSearchParams()
  const tenantId = params.get("tenantId") ?? ""
  const nome     = params.get("nome") ?? ""
  const { login } = useAuth()
  const navigate  = useNavigate()
  const fundo = useFundoApp()

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
    <div
      className="min-h-screen bg-gray-50 flex flex-col justify-center p-6 bg-cover bg-center"
      style={fundo ? { backgroundImage: `url(${fundo})` } : undefined}
    >
      <button
        onClick={() => navigate("/")}
        className={`text-sm mb-6 ${fundo ? "text-white font-medium" : "text-indigo-600"}`}
        style={fundo ? { textShadow: "0 1px 4px rgba(0,0,0,0.6)" } : undefined}
      >
        ← Trocar de Igreja
      </button>

      <div className={`rounded-2xl p-6 shadow-sm ${fundo ? "bg-white/30 backdrop-blur-sm" : "bg-white"}`}>
        <p className={`text-center text-sm mb-1 ${fundo ? "text-gray-800 font-medium" : "text-gray-500"}`}>{nome}</p>
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
          className={`block text-center text-sm mt-4 ${fundo ? "text-indigo-700 font-semibold" : "text-indigo-600"}`}>
          Esqueci minha senha
        </Link>

        <Link to={`/register?tenantId=${tenantId}&nome=${encodeURIComponent(nome)}`}
          className={`block text-center text-sm mt-4 ${fundo ? "text-indigo-700 font-semibold" : "text-indigo-600"}`}>
          Não tem conta? Cadastre-se
        </Link>

        <Link to={`/visitante?tenantId=${tenantId}&nome=${encodeURIComponent(nome)}`}
          className={`block text-center text-sm mt-3 ${fundo ? "text-gray-800 font-medium" : "text-gray-500"}`}>
          Estou apenas visitando
        </Link>
      </div>
    </div>
  )
}
