import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { escalasApi } from "../api"

interface Ministerio { idMinisterio: number; nome: string; nomeDepartamento?: string }
interface MembroOpt { idMembro: number; nome: string; fotoUrl?: string; status: string }
interface EscalaMembro { idMembro: number; nome: string; fotoUrl?: string; status: string }
interface Escala {
  idEscala: number
  idMinisterio: number
  nomeMinisterio: string
  titulo: string
  dataEvento: string
  observacoes?: string
  membros: EscalaMembro[]
}

function fmt(s: string) {
  const d = new Date(s.endsWith("Z") || s.includes("+") ? s : s + "Z")
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) + " às " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function toLocalInputValue(s: string) {
  const d = new Date(s.endsWith("Z") || s.includes("+") ? s : s + "Z")
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function GerenciarEscalas() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [idMinisterio, setIdMinisterio] = useState<number | null>(null)
  const [form, setForm] = useState<Escala | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data: ministerios } = useQuery({
    queryKey: ["ministerios-que-lidero"],
    queryFn: () => escalasApi.ministeriosQueLidero().then(r => {
      const lista = r.data as Ministerio[]
      if (lista.length > 0 && idMinisterio === null) setIdMinisterio(lista[0].idMinisterio)
      return lista
    }),
  })

  const { data: escalas, isLoading } = useQuery({
    queryKey: ["escalas", idMinisterio],
    queryFn: () => escalasApi.porMinisterio(idMinisterio!).then(r => r.data as Escala[]),
    enabled: !!idMinisterio,
  })

  const { data: membrosDisponiveis } = useQuery({
    queryKey: ["membros-ministerio", idMinisterio],
    queryFn: () => escalasApi.membrosDoMinisterio(idMinisterio!).then(r => r.data as MembroOpt[]),
    enabled: !!idMinisterio,
  })

  const salvar = useMutation({
    mutationFn: (dados: { titulo: string; dataEvento: string; observacoes?: string; idsMembros: number[] }) =>
      form?.idEscala
        ? escalasApi.atualizar(form.idEscala, dados)
        : escalasApi.criar({ idMinisterio: idMinisterio!, ...dados }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["escalas", idMinisterio] })
      setShowForm(false)
      setForm(null)
    },
  })

  const excluir = useMutation({
    mutationFn: (id: number) => escalasApi.excluir(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["escalas", idMinisterio] }),
  })

  function abrirNovo() {
    setForm({ idEscala: 0, idMinisterio: idMinisterio!, nomeMinisterio: "", titulo: "", dataEvento: new Date().toISOString(), membros: [] })
    setShowForm(true)
  }

  function abrirEditar(e: Escala) {
    setForm(e)
    setShowForm(true)
  }

  if (!ministerios) return <p className="text-center text-gray-400 dark:text-gray-500 mt-20">Carregando...</p>

  if (ministerios.length === 0) {
    return (
      <div className="p-6 text-center mt-20 text-gray-400 dark:text-gray-500">
        <p className="text-5xl mb-3">🔒</p>
        <p>Você não é líder de nenhum ministério.</p>
      </div>
    )
  }

  return (
    <div className="pb-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gray-900 dark:bg-black px-5 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
        <h1 className="text-white text-xl font-bold">Gerenciar Escalas</h1>
      </div>

      <div className="p-4 space-y-4">
        {ministerios.length > 1 && (
          <select value={idMinisterio ?? ""} onChange={e => setIdMinisterio(Number(e.target.value))}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-800 dark:text-gray-100 font-medium">
            {ministerios.map(m => <option key={m.idMinisterio} value={m.idMinisterio}>{m.nome}</option>)}
          </select>
        )}

        <button onClick={abrirNovo}
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">
          + Nova Escala
        </button>

        {isLoading && <p className="text-center text-gray-400 dark:text-gray-500 mt-6">Carregando escalas...</p>}

        {escalas?.map(e => (
          <div key={e.idEscala} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">{e.titulo}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{fmt(e.dataEvento)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => abrirEditar(e)} className="text-indigo-600 text-sm font-bold">Editar</button>
                <button onClick={() => { if (confirm("Excluir esta escala?")) excluir.mutate(e.idEscala) }}
                  className="text-red-500 text-sm font-bold">Excluir</button>
              </div>
            </div>
            {e.observacoes && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{e.observacoes}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {e.membros.map(m => (
                <span key={m.idMembro} className={`text-xs font-medium px-2 py-1 rounded-full ${
                  m.status === "Confirmado" ? "bg-green-100 text-green-700" :
                  m.status === "Recusado" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {m.nome} {m.status === "Confirmado" ? "✓" : m.status === "Recusado" ? "✗" : ""}
                </span>
              ))}
            </div>
          </div>
        ))}

        {!isLoading && escalas?.length === 0 && (
          <p className="text-center text-gray-400 dark:text-gray-500 mt-10">Nenhuma escala criada ainda.</p>
        )}
      </div>

      {showForm && form && (
        <EscalaFormModal
          form={form}
          membrosDisponiveis={membrosDisponiveis ?? []}
          onClose={() => { setShowForm(false); setForm(null) }}
          onSave={(dados) => salvar.mutate(dados)}
          saving={salvar.isPending}
        />
      )}
    </div>
  )
}

function EscalaFormModal({ form, membrosDisponiveis, onClose, onSave, saving }: {
  form: Escala
  membrosDisponiveis: MembroOpt[]
  onClose: () => void
  onSave: (dados: { titulo: string; dataEvento: string; observacoes?: string; idsMembros: number[] }) => void
  saving: boolean
}) {
  const [titulo, setTitulo] = useState(form.titulo)
  const [dataEvento, setDataEvento] = useState(toLocalInputValue(form.dataEvento))
  const [observacoes, setObservacoes] = useState(form.observacoes ?? "")
  const [selecionados, setSelecionados] = useState<Set<number>>(
    new Set(form.membros.map(m => m.idMembro))
  )

  function toggle(id: number) {
    setSelecionados(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function submit() {
    if (!titulo.trim() || selecionados.size === 0) return
    onSave({
      titulo,
      dataEvento: new Date(dataEvento).toISOString(),
      observacoes: observacoes || undefined,
      idsMembros: [...selecionados],
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-h-[90vh] overflow-y-auto p-5">
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">{form.idEscala ? "Editar Escala" : "Nova Escala"}</h2>

        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Título</label>
        <input value={titulo} onChange={e => setTitulo(e.target.value)}
          placeholder="Ex: Culto de Domingo - Manhã"
          className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1 mb-3" />

        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Data e hora</label>
        <input type="datetime-local" value={dataEvento} onChange={e => setDataEvento(e.target.value)}
          className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1 mb-3" />

        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Observações</label>
        <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3}
          className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1 mb-3 resize-none" />

        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Selecione os membros</label>
        <div className="mt-2 space-y-2 max-h-52 overflow-y-auto">
          {membrosDisponiveis.map(m => (
            <button key={m.idMembro} onClick={() => toggle(m.idMembro)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border ${
                selecionados.has(m.idMembro) ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950" : "border-gray-200 dark:border-gray-700"
              }`}>
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                {m.nome.charAt(0)}
              </div>
              <span className="flex-1 text-left font-medium text-gray-800 dark:text-gray-200">{m.nome}</span>
              {selecionados.has(m.idMembro) && <span className="text-indigo-600 font-bold">✓</span>}
            </button>
          ))}
          {membrosDisponiveis.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Nenhum membro ativo neste ministério.</p>
          )}
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-3 font-bold text-gray-600 dark:text-gray-300">
            Cancelar
          </button>
          <button onClick={submit} disabled={saving || !titulo.trim() || selecionados.size === 0}
            className="flex-1 bg-indigo-600 text-white rounded-xl py-3 font-bold disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  )
}
