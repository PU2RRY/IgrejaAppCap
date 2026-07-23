import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { appAuthApi } from "../api"
import { uploadFotoCloudinary } from "../lib/cloudinary"

function maskCpf(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}
function maskCelular(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2")
}
function maskCep(v: string) {
  return v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d{1,3})$/, "$1-$2")
}

export default function Register() {
  const [params] = useSearchParams()
  const tenantId = params.get("tenantId") ?? ""
  const nome     = params.get("nome") ?? ""
  const navigate = useNavigate()

  const [passo, setPasso] = useState<1 | 2>(1)
  const [form, setForm] = useState({ nome: "", email: "", senha: "", confirmar: "", celular: "", dataNascimento: "" })
  const [aceitouTermos, setAceitouTermos] = useState(false)

  const [form2, setForm2] = useState({
    sexo: "", cpf: "", dataBatismo: "", fotoUrl: "",
    cep: "", endereco: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "",
  })
  const [cepLoading, setCepLoading] = useState(false)
  const [fotoLoading, setFotoLoading] = useState(false)

  const [erro, setErro]       = useState("")
  const [loading, setLoading] = useState(false)
  const [ok, setOk]           = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))
  const set2 = (k: keyof typeof form2, v: string) => setForm2(f => ({ ...f, [k]: v }))

  const handleContinuar = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.senha !== form.confirmar) return setErro("As senhas não conferem")
    if (!aceitouTermos) return setErro("É necessário aceitar a Política de Privacidade para continuar")
    setErro("")
    setPasso(2)
  }

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoLoading(true)
    try {
      const url = await uploadFotoCloudinary(file)
      set2("fotoUrl", url)
    } catch {
      setErro("Erro ao enviar a foto. Tente novamente.")
    } finally {
      setFotoLoading(false)
      e.target.value = ""
    }
  }

  const buscarCep = async (cep: string) => {
    const digits = cep.replace(/\D/g, "")
    if (digits.length !== 8) return
    setCepLoading(true)
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const d = await r.json()
      if (!d.erro) {
        setForm2(f => ({
          ...f,
          endereco: d.logradouro || f.endereco,
          bairro:   d.bairro     || f.bairro,
          cidade:   d.localidade || f.cidade,
          uf:       d.uf         || f.uf,
          complemento: d.complemento || f.complemento,
        }))
      }
    } catch { /* silently ignore */ }
    finally { setCepLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(""); setLoading(true)
    try {
      await appAuthApi.registrar(tenantId, {
        nome: form.nome, email: form.email, senha: form.senha,
        celular: form.celular || undefined, dataNascimento: form.dataNascimento || undefined,
        aceitouTermos,
        sexo: form2.sexo || undefined,
        cpf: form2.cpf || undefined,
        dataBatismo: form2.dataBatismo || undefined,
        fotoUrl: form2.fotoUrl || undefined,
        cep: form2.cep || undefined,
        endereco: form2.endereco || undefined,
        numero: form2.numero || undefined,
        complemento: form2.complemento || undefined,
        bairro: form2.bairro || undefined,
        cidade: form2.cidade || undefined,
        uf: form2.uf || undefined,
      })
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

  if (passo === 1) return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6">
      <button onClick={() => navigate(-1)} className="text-indigo-600 text-sm mb-4">← Voltar</button>
      <p className="text-center text-gray-500 text-sm">{nome}</p>
      <h2 className="text-2xl font-bold text-center mb-1">Criar Conta</h2>
      <p className="text-center text-gray-400 text-xs mb-6">Passo 1 de 2 — dados de acesso</p>

      <form onSubmit={handleContinuar} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
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
            <input className="w-full border border-gray-300 rounded-lg px-3 h-11 text-base outline-none focus:ring-2 focus:ring-indigo-500"
              type={type} value={form[key as keyof typeof form]}
              onChange={key === "celular" ? (e => setForm(f => ({ ...f, celular: maskCelular(e.target.value) }))) : set(key as keyof typeof form)}
              placeholder={ph} />
          </div>
        ))}
        <label className="flex items-start gap-2 text-xs text-gray-600">
          <input type="checkbox" className="mt-0.5" checked={aceitouTermos} onChange={(e) => setAceitouTermos(e.target.checked)} />
          <span>Li e aceito a <a href="/politica-de-privacidade" target="_blank" className="text-indigo-600 underline">Política de Privacidade</a> desta igreja.</span>
        </label>
        {erro && <p className="text-red-500 text-sm">{erro}</p>}
        <button type="submit" className="w-full bg-indigo-600 text-white font-bold rounded-lg h-11">
          Continuar
        </button>
      </form>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6">
      <button onClick={() => setPasso(1)} className="text-indigo-600 text-sm mb-4">← Voltar</button>
      <p className="text-center text-gray-500 text-sm">{nome}</p>
      <h2 className="text-2xl font-bold text-center mb-1">Complete seu Cadastro</h2>
      <p className="text-center text-gray-400 text-xs mb-6">Passo 2 de 2 — tudo opcional, mas ajuda muito a igreja</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Foto</label>
          <div className="flex items-center gap-4">
            {form2.fotoUrl ? (
              <img src={form2.fotoUrl} className="w-16 h-16 rounded-full object-cover border" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border text-gray-400 text-2xl">👤</div>
            )}
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleFotoChange} disabled={fotoLoading} />
              <span className="inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium">
                {fotoLoading ? "Enviando..." : "Escolher foto"}
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Gênero</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 h-11 text-base outline-none focus:ring-2 focus:ring-indigo-500"
            value={form2.sexo} onChange={e => set2("sexo", e.target.value)}>
            <option value="">Selecione</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">CPF</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 h-11 text-base outline-none focus:ring-2 focus:ring-indigo-500"
            value={form2.cpf} onChange={e => set2("cpf", maskCpf(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Data de Batismo</label>
          <input type="date" className="w-full border border-gray-300 rounded-lg px-3 h-11 text-base outline-none focus:ring-2 focus:ring-indigo-500"
            value={form2.dataBatismo} onChange={e => set2("dataBatismo", e.target.value)} />
        </div>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Endereço</p>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">CEP</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 h-11 text-base outline-none focus:ring-2 focus:ring-indigo-500"
            value={form2.cep} onChange={e => set2("cep", maskCep(e.target.value))}
            onBlur={e => buscarCep(e.target.value)} placeholder="00000-000" maxLength={9} />
          {cepLoading && <p className="text-xs text-gray-400 mt-1">Buscando endereço...</p>}
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Endereço</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 h-11 text-base outline-none focus:ring-2 focus:ring-indigo-500"
            value={form2.endereco} onChange={e => set2("endereco", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Número</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 h-11 text-base outline-none focus:ring-2 focus:ring-indigo-500"
              value={form2.numero} onChange={e => set2("numero", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Complemento</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 h-11 text-base outline-none focus:ring-2 focus:ring-indigo-500"
              value={form2.complemento} onChange={e => set2("complemento", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Bairro</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 h-11 text-base outline-none focus:ring-2 focus:ring-indigo-500"
            value={form2.bairro} onChange={e => set2("bairro", e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-sm font-semibold text-gray-700 block mb-1">Cidade</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 h-11 text-base outline-none focus:ring-2 focus:ring-indigo-500"
              value={form2.cidade} onChange={e => set2("cidade", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">UF</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 h-11 text-base outline-none focus:ring-2 focus:ring-indigo-500"
              value={form2.uf} onChange={e => set2("uf", e.target.value.toUpperCase())} maxLength={2} />
          </div>
        </div>

        {erro && <p className="text-red-500 text-sm">{erro}</p>}
        <button type="submit" disabled={loading || fotoLoading}
          className="w-full bg-indigo-600 text-white font-bold rounded-lg h-11 disabled:opacity-60">
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>
    </div>
  )
}
