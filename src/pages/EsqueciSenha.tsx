import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { appAuthApi } from "../api"

export default function EsqueciSenha() {
  const [params] = useSearchParams()
  const tenantId = params.get("tenantId") ?? ""
  const nomeIgreja = params.get("nome") ?? ""
  const navigate = useNavigate()

  const [etapa, setEtapa] = useState<"email" | "codigo">("email")
  const [email, setEmail] = useState("")
  const [codigo, setCodigo] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)

  const handleSolicitar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(""); setLoading(true)
    try {
      await appAuthApi.solicitarResetSenha(tenantId, email)
      setEtapa("codigo")
    } catch (err: any) {
      setErro(err.response?.data?.message ?? "Não foi possível enviar o código")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (novaSenha !== confirmar) return setErro("As senhas não conferem")
    if (novaSenha.length < 6) return setErro("A senha deve ter pelo menos 6 caracteres")
    setErro(""); setLoading(true)
    try {
      await appAuthApi.confirmarResetSenha(tenantId, { email, codigo, novaSenha })
      setOk(true)
    } catch (err: any) {
      setErro(err.response?.data?.message ?? "Código inválido ou expirado")
    } finally {
      setLoading(false)
    }
  }

  if (ok) return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center p-6 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-xl font-bold mb-2">Senha redefinida!</h2>
      <p className="text-gray-500 text-sm mb-6">Você já pode entrar com sua nova senha.</p>
      <button onClick={() => navigate(-1)} className="text-indigo-600 font-semibold">Voltar ao Login</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6">
      <button onClick={() => navigate(-1)} className="text-indigo-600 text-sm mb-4">← Voltar</button>
      <p className="text-center text-gray-500 text-sm">{nomeIgreja}</p>
      <h2 className="text-2xl font-bold text-center mb-2">Esqueci minha senha</h2>

      {etapa === "email" ? (
        <>
          <p className="text-center text-gray-500 text-sm mb-6">Informe seu email cadastrado. Vamos enviar um código de verificação.</p>
          <form onSubmit={handleSolicitar} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Email cadastrado *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 h-11 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
            </div>
            {erro && <p className="text-red-500 text-sm">{erro}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold rounded-lg h-11 disabled:opacity-60">
              {loading ? "Enviando..." : "Enviar Código"}
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="text-center text-gray-500 text-sm mb-6">Enviamos um código para <strong>{email}</strong>. Digite abaixo junto com sua nova senha.</p>
          <form onSubmit={handleConfirmar} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Código de verificação *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 h-11 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-center tracking-widest font-bold"
                value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="000000" maxLength={6} required />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Nova senha *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 h-11 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres" required />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Confirmar nova senha *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 h-11 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)} placeholder="Repita a senha" required />
            </div>
            {erro && <p className="text-red-500 text-sm">{erro}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold rounded-lg h-11 disabled:opacity-60">
              {loading ? "Redefinindo..." : "Redefinir Senha"}
            </button>
            <button type="button" onClick={() => setEtapa("email")} className="w-full text-center text-gray-500 text-sm">
              Não recebi o código, tentar outro email
            </button>
          </form>
        </>
      )}
    </div>
  )
}
