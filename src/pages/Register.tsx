import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { appAuthApi } from "../api"

export default function Register() {
  const [params] = useSearchParams()
  const tenantId = params.get("tenantId") ?? ""
  const nome     = params.get("nome") ?? ""
  const navigate = useNavigate()

  const [form, setForm] = useState({ nome: "", email: "", senha: "", confirmar: "", celular: "", dataNascimento: "" })
  const [aceitouTermos, setAceitouTermos] = useState(false)
  const [erro, setErro]       = useState("")
  const [loading, setLoading] = useState(false)
  const [ok, setOk]           = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.senha !== form.confirmar) return setErro("As senhas não conferem")
    if (!aceitouTermos) return setErro("É necessário aceitar a Política de Privacidade para continuar")
    setErro(""); setLoading(true)
    try {
      await appAuthApi.registrar(tenantId, { nome: form.nome, email: form.email, senha: form.senha, celular: form.celular || undefined, aceitouTermos })
      setOk(true)
    } catch (err: any) {
      setErro(err.response?.data?.message ?? "Erro ao cadastrar")
    } finally {
      setLoading(false)
    }
  }

  if (ok) return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center p-6 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-xl font-bold mb-2">Cadastro realizado!</h2>
      <p className="text-gray-500 text-sm mb-6">Aguarde a confirmação do administrador da igreja para acessar o app.</p>
      <button onClick={() => navigate(-1)} className="text-indigo-600 font-semibold">Voltar ao Login</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6">
      <button onClick={() => navigate(-1)} className="text-indigo-600 text-sm mb-4">← Voltar</button>
      <p className="text-center text-gray-500 text-sm">{nome}</p>
      <h2 className="text-2xl font-bold text-center mb-6">Criar Conta</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        {[
          ["nome",            "Nome completo *",   "text",     "Seu nome completo"],
          ["email",          "Email *",            "email",    "seu@email.com"],
          ["senha",          "Senha *",            "password", "Mínimo 6 caracteres"],
          ["confirmar",      "Confirmar senha *",  "password", "Repita a senha"],
          ["celular",        "Celular (opcional)", "tel",      "(11) 99999-9999"],
          ["dataNascimento", "Data de nascimento", "date",     ""],
        ].map(([key, label, type, ph]) => (
          <div key={key}>
            <label className="text-sm font-semibold text-gray-700 block mb-1">{label}</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 h-11 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              type={type} value={form[key as keyof typeof form]} onChange={set(key as keyof typeof form)} placeholder={ph} />
          </div>
        ))}
        <label className="flex items-start gap-2 text-xs text-gray-600">
          <input type="checkbox" className="mt-0.5" checked={aceitouTermos} onChange={(e) => setAceitouTermos(e.target.checked)} />
          <span>Li e aceito a <a href="/politica-de-privacidade" target="_blank" className="text-indigo-600 underline">Política de Privacidade</a> desta igreja.</span>
        </label>
        {erro && <p className="text-red-500 text-sm">{erro}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 text-white font-bold rounded-lg h-11 disabled:opacity-60">
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>
    </div>
  )
}
