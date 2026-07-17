import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { reunioesApi } from "../api"

interface Grupo { id: number; nome: string; tipo: "Departamento" | "Ministerio" }
interface MembroOpt { idMembro: number; nome: string; fotoUrl?: string; status: string }
interface ConvidadoInfo { idMembro: number; nome: string; fotoUrl?: string; status: string }
interface Reuniao {
  idReuniao: number
  titulo: string
  dataReuniao: string
  horario?: string
  localReuniao?: string
  observacao?: string
  convidados: ConvidadoInfo[]
}
interface TipoReuniao { idTipoReuniao: number; nome: string }

function fmt(dataStr: string, horario?: string) {
  const d = new Date(dataStr + "T00:00:00")
  const dia = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
  return horario ? `${dia} às ${horario}` : dia
}

export default function GerenciarReunioes() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [grupoSelecionado, setGrupoSelecionado] = useState<Grupo | null>(null)
  const [form, setForm] = useState<Reuniao | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data: grupos } = useQuery({
    queryKey: ["grupos-que-lidero"],
    queryFn: () => reunioesApi.gruposQueLidero().then(r => {
      const lista = (r.data as any[]).map(g => ({ id: g.id, nome: g.nome, tipo: g.tipo })) as Grupo[]
      if (lista.length > 0 && grupoSelecionado === null) setGrupoSelecionado(lista[0])
      return lista
    }),
  })

  const { data: tipos } = useQuery({
    queryKey: ["tipos-reuniao"],
    queryFn: () => reunioesApi.tipos().then(r => r.data as TipoReuniao[]),
  })

  const { data: reunioes, isLoading } = useQuery({
    queryKey: ["reunioes-grupo", grupoSelecionado?.tipo, grupoSelecionado?.id],
    queryFn: () => reunioesApi.porGrupo(grupoSelecionado!.tipo, grupoSelecionado!.id).then(r => r.data as Reuniao[]),
    enabled: !!grupoSelecionado,
  })

  const { data: membrosDisponiveis } = useQuery({
    queryKey: ["membros-grupo", grupoSelecionado?.tipo, grupoSelecionado?.id],
    queryFn: () => reunioesApi.membrosDoGrupo(grupoSelecionado!.tipo, grupoSelecionado!.id).then(r => r.data as MembroOpt[]),
    enabled: !!grupoSelecionado,
  })

  const salvar = useMutation({
    mutationFn: (dados: any) =>
      form?.idReuniao
        ? reunioesApi.atualizar(form.idReuniao, dados)
        : reunioesApi.criar({
            idTipoReuniao: dados.idTipoReuniao,
            idDepartamento: grupoSelecionado!.tipo === "Departamento" ? grupoSelecionado!.id : undefined,
            idMinisterio: grupoSelecionado!.tipo === "Ministerio" ? grupoSelecionado!.id : undefined,
            ...dados,
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reunioes-grupo", grupoSelecionado?.tipo, grupoSelecionado?.id] })
      setShowForm(false)
      setForm(null)
    },
  })

  const excluir = useMutation({
    mutationFn: (id: number) => reunioesApi.excluir(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reunioes-grupo", grupoSelecionado?.tipo, grupoSelecionado?.id] }),
  })

  function abrirNovo() {
    setForm({ idReuniao: 0, titulo: "", dataReuniao: new Date().toISOString().slice(0, 10), convidados: [] })
    setShowForm(true)
  }

  function abrirEditar(r: Reuniao) {
    setForm(r)
    setShowForm(true)
  }

  if (!grupos) return <p className="text-center text-gray-400 dark:text-gray-500 mt-20">Carregando...</p>

  if (grupos.length === 0) {
    return (
      <div className="p-6 text-center mt-20 text-gray-400 dark:text-gray-500">
        <p className="text-5xl mb-3">🔒</p>
        <p>Você não lidera nenhum departamento ou ministério.</p>
      </div>
    )
  }

  return (
    <div className="pb-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-indigo-600 px-5 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
        <h1 className="text-white text-xl font-bold">Gerenciar Reuniões</h1>
      </div>

      <div className="p-4 space-y-4">
        {grupos.length > 1 && (
          <select
            value={grupoSelecionado ? `${grupoSelecionado.tipo}:${grupoSelecionado.id}` : ""}
            onChange={e => {
              const [tipo, id] = e.target.value.split(":")
              setGrupoSelecionado({ tipo: tipo as any, id: Number(id), nome: "" })
            }}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-800 dark:text-gray-100 font-medium">
            {grupos.map(g => (
              <option key={`${g.tipo}:${g.id}`} value={`${g.tipo}:${g.id}`}>{g.nome} ({g.tipo})</option>
            ))}
          </select>
        )}

        <button onClick={abrirNovo} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">
          + Nova Reunião
        </button>

        {isLoading && <p className="text-center text-gray-400 dark:text-gray-500 mt-6">Carregando reuniões...</p>}

        {reunioes?.map(r => (
          <div key={r.idReuniao} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">{r.titulo}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{fmt(r.dataReuniao, r.horario)}</p>
                {r.localReuniao && <p className="text-sm text-gray-500 dark:text-gray-400">📍 {r.localReuniao}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => abrirEditar(r)} className="text-indigo-600 text-sm font-bold">Editar</button>
                <button onClick={() => { if (confirm("Excluir esta reunião?")) excluir.mutate(r.idReuniao) }}
                  className="text-red-500 text-sm font-bold">Excluir</button>
              </div>
            </div>
            {r.observacao && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{r.observacao}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {r.convidados.map(c => (
                <span key={c.idMembro} className={`text-xs font-medium px-2 py-1 rounded-full ${
                  c.status === "Confirmado" ? "bg-green-100 text-green-700" :
                  c.status === "Recusado" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {c.nome} {c.status === "Confirmado" ? "✓" : c.status === "Recusado" ? "✗" : ""}
                </span>
              ))}
            </div>
          </div>
        ))}

        {!isLoading && reunioes?.length === 0 && (
          <p className="text-center text-gray-400 dark:text-gray-500 mt-10">Nenhuma reunião criada ainda.</p>
        )}
      </div>

      {showForm && form && (
        <ReuniaoFormModal
          form={form}
          tipos={tipos ?? []}
          membrosDisponiveis={membrosDisponiveis ?? []}
          onClose={() => { setShowForm(false); setForm(null) }}
          onSave={(dados) => salvar.mutate(dados)}
          saving={salvar.isPending}
        />
      )}
    </div>
  )
}

function ReuniaoFormModal({ form, tipos, membrosDisponiveis, onClose, onSave, saving }: {
  form: Reuniao
  tipos: TipoReuniao[]
  membrosDisponiveis: MembroOpt[]
  onClose: () => void
  onSave: (dados: any) => void
  saving: boolean
}) {
  const [titulo, setTitulo] = useState(form.titulo)
  const [idTipoReuniao, setIdTipoReuniao] = useState<number | "">(tipos[0]?.idTipoReuniao ?? "")
  const [dataReuniao, setDataReuniao] = useState(form.dataReuniao)
  const [horario, setHorario] = useState(form.horario ?? "")
  const [localReuniao, setLocalReuniao] = useState(form.localReuniao ?? "")
  const [observacao, setObservacao] = useState(form.observacao ?? "")
  const [selecionados, setSelecionados] = useState<Set<number>>(
    new Set(form.convidados.map(c => c.idMembro))
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
      idTipoReuniao: idTipoReuniao || undefined,
      titulo,
      dataReuniao,
      horario: horario ? horario + ":00" : undefined,
      localReuniao: localReuniao || undefined,
      observacao: observacao || undefined,
      idsMembros: [...selecionados],
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-h-[90vh] overflow-y-auto p-5">
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">{form.idReuniao ? "Editar Reunião" : "Nova Reunião"}</h2>

        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Título</label>
        <input value={titulo} onChange={e => setTitulo(e.target.value)}
          placeholder="Ex: Ensaio de Louvor"
          className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1 mb-3" />

        {!form.idReuniao && tipos.length > 0 && (
          <>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tipo</label>
            <select value={idTipoReuniao} onChange={e => setIdTipoReuniao(Number(e.target.value))}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1 mb-3">
              {tipos.map(t => <option key={t.idTipoReuniao} value={t.idTipoReuniao}>{t.nome}</option>)}
            </select>
          </>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Data</label>
            <input type="date" value={dataReuniao} onChange={e => setDataReuniao(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Horário</label>
            <input type="time" value={horario} onChange={e => setHorario(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1" />
          </div>
        </div>

        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Local</label>
        <input value={localReuniao} onChange={e => setLocalReuniao(e.target.value)}
          placeholder="Ex: Templo principal"
          className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1 mb-3" />

        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Observações</label>
        <textarea value={observacao} onChange={e => setObservacao(e.target.value)} rows={3}
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
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Nenhum membro ativo neste grupo.</p>
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
