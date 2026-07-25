import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { appAuthApi } from "../api"

export default function CadastroVisitante() {
  const [params] = useSearchParams()
  const tenantId = params.get("tenantId") ?? ""
  const nomeIgreja = params.get("nome") ?? ""
  const { login } = useAuth()
  const navigate = useNavigate()

  const [passo, setPasso] = useState<"dados" | "codigo">("dados")
  const [form, setForm] = useState({ nome: "", celular: "", email: "" })
  const [aceitouTermos, setAceitouTermos] = useState(false)
  const [codigo, setCodigo] = useState("")
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)
  const [enviandoCodigo, setEnviandoCodigo] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const finalizarCadastro = async () => {
    setErro(""); setLoading(true)
    try {
      const { data } = await appAuthApi.registrarVisitante(tenantId, {
        nome: form.nome,
        celular: form.celular || undefined,
        email: form.email || undefined,
        aceitouTermos,
      })
      const result = (data as any).data ?? data
      login(result.accessToken, result.refreshToken, {
        idAppUsuario: result.idAppUsuario,
        nome:         result.nome,
        email:        result.email,
        status:       result.status,
        tenantId:     result.tenantId,
        idMembro:     result.idMembro,
      })
      navigate("/home")
    } catch (err: any) {
      setErro(err.response?.data?.message ?? "Erro ao cadastrar")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome.trim()) return setErro("Informe seu nome")
    if (!aceitouTermos) return setErro("É necessário aceitar a Política de Privacidade para continuar")

    if (!form.email.trim()) {
      await finalizarCadastro()
      return
    }

    setErro(""); setEnviandoCodigo(true)
    try {
      await appAuthApi.solicitarCodigoEmail(tenantId, form.email)
      setPasso("codigo")
    } catch (err: any) {
      setErro(err.response?.data?.message ?? "Erro ao enviar código de confirmação")
    } finally {
      setEnviandoCodigo(false)
    }
  }

  const handleConfirmarCodigo = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(""); setLoading(true)
    try {
      await appAuthApi.confirmarCodigoEmail(tenantId, form.email, codigo)
      await finalizarCadastro()
    } catch (err: any) {
      setErro(err.response?.data?.message ?? "Código inválido ou expirado")
      setLoading(false)
    }
  }

  const handleReenviarCodigo = async () => {
    setErro(""); setEnviandoCodigo(true)
    try {
      await appAuthApi.solicitarCodigoEmail(tenantId, form.email)
    } catch (err: any) {
      setErro(err.response?.data?.message ?? "Erro ao reenviar código")
    } finally {
      setEnviandoCodigo(false)
    }
  }

  if (passo === "codigo") return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6">
      <button onClick={() => setPasso("dados")} className="text-indigo-600 text-sm mb-4">← Voltar</button>
      <p className="text-center text-gray-500 text-sm">{nomeIgreja}</p>
      <h2 className="text-2xl font-bold text-center mb-1">Confirme seu E-mail</h2>
      <p className="text-center text-gray-400 text-xs mb-6">Enviamos um código para {form.email}</p>

      <form onSubmit={handleConfirmarCodigo} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Código de confirmação</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 h-11 text-base text-center tracking-[0.3em] font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            value={codigo} onChange={e => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000" inputMode="numeric" maxLength={6} />
        </div>
        {erro && <p className="text-red-500 text-sm">{erro}</p>}
        <button type="submit" disabled={loading || codigo.length !== 6}
          className="w-full bg-indigo-600 text-white font-bold rounded-lg h-11 disabled:opacity-60">
          {loading ? "Confirmando..." : "Confirmar Código"}
        </button>
        <button type="button" onClick={handleReenviarCodigo} disabled={enviandoCodigo}
          className="w-full text-indigo-600 text-sm font-semibold disabled:opacity-60">
          {enviandoCodigo ? "Reenviando..." : "Reenviar código"}
        </button>
      </form>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6">
      <button onClick={() => navigate(-1)} className="text-indigo-600 text-sm mb-4">← Voltar</button>
      <p className="text-center text-gray-500 text-sm">{nomeIgreja}</p>
      <h2 className="text-2xl font-bold text-center mb-2">Bem-vindo(a)!</h2>
      <p className="text-center text-gray-500 text-sm mb-6">Cadastre-se como visitante para acompanhar nossas notícias e conteúdos.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        {[
          ["nome",    "Nome completo *",   "text", "Seu nome completo"],
          ["celular", "Celular (WhatsApp)", "tel",  "(11) 99999-9999"],
          ["email",   "Email (opcional)",  "email", "seu@email.com"],
        ].map(([key, label, type, ph]) => (
          <div key={key}>
            <label className="text-sm font-semibold text-gray-700 block mb-1">{label}</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 h-11 text-base outline-none focus:ring-2 focus:ring-indigo-500"
              type={type} value={form[key as keyof typeof form]} onChange={set(key as keyof typeof form)} placeholder={ph} />
          </div>
        ))}
        <label className="flex items-start gap-2 text-xs text-gray-600">
          <input type="checkbox" className="mt-0.5" checked={aceitouTermos} onChange={(e) => setAceitouTermos(e.target.checked)} />
          <span>Li e aceito a <a href="/politica-de-privacidade" target="_blank" className="text-indigo-600 underline">Política de Privacidade</a>, e autorizo o uso dos meus dados para contato desta igreja.</span>
        </label>
        {erro && <p className="text-red-500 text-sm">{erro}</p>}
        <button type="submit" disabled={loading || enviandoCodigo}
          className="w-full bg-indigo-600 text-white font-bold rounded-lg h-11 disabled:opacity-60">
          {enviandoCodigo ? "Enviando código..." : loading ? "Cadastrando..." : "Entrar como Visitante"}
        </button>
      </form>
    </div>
  )
}
