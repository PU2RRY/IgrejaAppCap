import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { escalasApi, engajamentoApi } from "../api"

interface Ministerio { idMinisterio: number; nome: string; nomeDepartamento?: string }
interface MembroOpt { idMembro: number; nome: string; fotoUrl?: string; status: string }
interface EscalaMembro { idMembro: number; nome: string; fotoUrl?: string; status: string; funcao?: string | null }
interface Escala {
  idEscala: number
  idMinisterio: number
  nomeMinisterio: string
  titulo: string
  dataEvento: string
  observacoes?: string
  membros: EscalaMembro[]
}

interface PendentePresenca {
  idEscalaMembro: number
  idEscala: number
  tituloEscala: string
  dataEvento: string
  nomeMinisterio: string
  idMembro: number
  nomeMembro: string
  fotoUrl?: string | null
  statusConfirmacao: string
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
  const [presencaAlvo, setPresencaAlvo] = useState<PendentePresenca | null>(null)

  const { data: pendentesPresenca } = useQuery({
    queryKey: ["pendentes-presenca"],
    queryFn: () => engajamentoApi.pendentesPresenca().then(r => r.data as PendentePresenca[]),
  })

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

  const salvar = useMutation({
    mutationFn: (dados: { titulo: string; dataEvento: string; observacoes?: string; membros: { idMembro: number; funcao?: string | null }[] }) =>
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
    onError: (err: any) => alert(err?.response?.data?.message || "Não foi possível excluir esta escala."),
  })

  const registrarPresenca = useMutation({
    mutationFn: (dados: { idEscalaMembro: number; compareceu: boolean; notaLider?: number | null; comentarioLider?: string | null }) =>
      engajamentoApi.registrarPresenca(dados.idEscalaMembro, dados),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pendentes-presenca"] })
      setPresencaAlvo(null)
    },
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

        {pendentesPresenca && pendentesPresenca.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">Presença pendente</h2>
            {Object.entries(
              pendentesPresenca.reduce<Record<string, PendentePresenca[]>>((acc, p) => {
                (acc[p.idEscala] ??= []).push(p)
                return acc
              }, {})
            ).map(([idEscala, membros]) => (
              <div key={idEscala} className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-amber-200 dark:border-amber-800">
                <p className="font-bold text-gray-900 dark:text-gray-100">{membros[0].tituloEscala}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{fmt(membros[0].dataEvento)}</p>
                <div className="space-y-1.5">
                  {membros.map(p => (
                    <button key={p.idEscalaMembro} onClick={() => setPresencaAlvo(p)}
                      className="w-full flex items-center justify-between p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-left">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{p.nomeMembro}</span>
                      <span className="text-xs font-bold text-indigo-600">Registrar</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
                  {m.nome}{m.funcao ? ` (${m.funcao})` : ""} {m.status === "Confirmado" ? "✓" : m.status === "Recusado" ? "✗" : ""}
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
          onClose={() => { setShowForm(false); setForm(null) }}
          onSave={(dados) => salvar.mutate(dados)}
          saving={salvar.isPending}
        />
      )}

      {presencaAlvo && (
        <PresencaModal
          pendente={presencaAlvo}
          onClose={() => setPresencaAlvo(null)}
          onSave={(dados) => registrarPresenca.mutate({ idEscalaMembro: presencaAlvo.idEscalaMembro, ...dados })}
          saving={registrarPresenca.isPending}
        />
      )}
    </div>
  )
}

function PresencaModal({ pendente, onClose, onSave, saving }: {
  pendente: PendentePresenca
  onClose: () => void
  onSave: (dados: { compareceu: boolean; notaLider?: number | null; comentarioLider?: string | null }) => void
  saving: boolean
}) {
  const [compareceu, setCompareceu] = useState<boolean | null>(null)
  const [nota, setNota] = useState(0)
  const [comentario, setComentario] = useState("")

  function submit() {
    if (compareceu === null) return
    onSave({
      compareceu,
      notaLider: compareceu && nota > 0 ? nota : null,
      comentarioLider: compareceu && comentario ? comentario : null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-5">
        <h2 className="text-lg font-bold mb-1 text-gray-900 dark:text-gray-100">Registrar presença</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{pendente.nomeMembro} — {pendente.tituloEscala}</p>

        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Compareceu?</label>
        <div className="flex gap-2 mt-1 mb-4">
          <button onClick={() => setCompareceu(true)}
            className={`flex-1 py-2 rounded-xl font-bold text-sm ${compareceu === true ? "bg-green-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
            Sim
          </button>
          <button onClick={() => setCompareceu(false)}
            className={`flex-1 py-2 rounded-xl font-bold text-sm ${compareceu === false ? "bg-red-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
            Não
          </button>
        </div>

        {compareceu === true && (
          <>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nota (opcional)</label>
            <div className="flex gap-1 mt-1 mb-3">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setNota(n === nota ? 0 : n)} className="text-2xl leading-none">
                  {n <= nota ? <span className="text-yellow-400">★</span> : <span className="text-gray-300 dark:text-gray-600">☆</span>}
                </button>
              ))}
            </div>

            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Comentário (opcional)</label>
            <input value={comentario} onChange={e => setComentario(e.target.value)}
              placeholder="Como foi o desempenho..."
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1 mb-4" />
          </>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-3 font-bold text-gray-600 dark:text-gray-300">
            Cancelar
          </button>
          <button onClick={submit} disabled={compareceu === null || saving}
            className="flex-1 bg-indigo-600 text-white rounded-xl py-3 font-bold disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  )
}

function EscalaFormModal({ form, onClose, onSave, saving }: {
  form: Escala
  onClose: () => void
  onSave: (dados: { titulo: string; dataEvento: string; observacoes?: string; membros: { idMembro: number; funcao?: string | null }[] }) => void
  saving: boolean
}) {
  const [titulo, setTitulo] = useState(form.titulo)
  const [dataEvento, setDataEvento] = useState(toLocalInputValue(form.dataEvento))
  const [observacoes, setObservacoes] = useState(form.observacoes ?? "")
  const [selecionados, setSelecionados] = useState<Map<number, string>>(
    new Map(form.membros.map(m => [m.idMembro, m.funcao ?? ""]))
  )

  const dataEventoIso = dataEvento ? new Date(dataEvento).toISOString() : undefined
  const { data: membrosDisponiveis } = useQuery({
    queryKey: ["membros-ministerio", form.idMinisterio, dataEventoIso],
    queryFn: () => escalasApi.membrosDoMinisterio(form.idMinisterio, dataEventoIso).then(r => r.data as MembroOpt[]),
    enabled: !!form.idMinisterio,
  })
  const membros = membrosDisponiveis ?? []

  function toggle(id: number) {
    setSelecionados(prev => {
      const next = new Map(prev)
      if (next.has(id)) next.delete(id); else next.set(id, "")
      return next
    })
  }

  function setFuncao(id: number, funcao: string) {
    setSelecionados(prev => new Map(prev).set(id, funcao))
  }

  function submit() {
    if (!titulo.trim() || selecionados.size === 0) return
    onSave({
      titulo,
      dataEvento: new Date(dataEvento).toISOString(),
      observacoes: observacoes || undefined,
      membros: [...selecionados].map(([idMembro, funcao]) => ({ idMembro, funcao: funcao || null })),
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
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Apenas membros disponíveis nessa data aparecem aqui.</p>
        <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
          {membros.map(m => {
            const selecionado = selecionados.has(m.idMembro)
            return (
              <div key={m.idMembro} className={`rounded-xl border ${selecionado ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950" : "border-gray-200 dark:border-gray-700"}`}>
                <button onClick={() => toggle(m.idMembro)} className="w-full flex items-center gap-3 p-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                    {m.nome.charAt(0)}
                  </div>
                  <span className="flex-1 text-left font-medium text-gray-800 dark:text-gray-200">{m.nome}</span>
                  {selecionado && <span className="text-indigo-600 font-bold">✓</span>}
                </button>
                {selecionado && (
                  <input
                    value={selecionados.get(m.idMembro) ?? ""}
                    onChange={e => setFuncao(m.idMembro, e.target.value)}
                    onClick={e => e.stopPropagation()}
                    placeholder="Função (ex: Vocal, Baterista) — opcional"
                    className="w-full text-sm border-t border-indigo-200 dark:border-indigo-800 bg-transparent px-3 py-2 focus:outline-none dark:text-gray-100"
                  />
                )}
              </div>
            )
          })}
          {membros.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Nenhum membro disponível neste ministério para essa data.</p>
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
