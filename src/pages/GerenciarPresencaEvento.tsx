import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useSearchParams } from "react-router-dom"
import { eventosApi } from "../api"

interface EventoOrganizado {
  idEvento: number
  nome: string
  dataEvento: string
  dataFimEvento: string | null
  horario: string | null
  local: string | null
  permiteInscricao: boolean
  totalInscritos: number
  totalPresentes: number
}

interface Inscricao {
  idInscricao: number
  nome: string
  email: string | null
  celular: string | null
  ehMembro: boolean
  presente: boolean
  criadoEm: string
}

function fmt(s: string) {
  return new Date(s + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
}

export default function GerenciarPresencaEvento() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [searchParams] = useSearchParams()
  const eventoPreSelecionado = Number(searchParams.get("evento")) || null
  const [idEvento, setIdEvento] = useState<number | null>(eventoPreSelecionado)

  const { data: eventos, isError } = useQuery({
    queryKey: ["eventos-que-organizo"],
    queryFn: () => eventosApi.organizo().then(r => {
      const lista = r.data as EventoOrganizado[]
      if (lista.length > 0 && idEvento === null) setIdEvento(lista[0].idEvento)
      return lista
    }),
  })

  const { data: inscricoes, isLoading } = useQuery({
    queryKey: ["evento-presenca", idEvento],
    queryFn: () => eventosApi.listarInscricoes(idEvento!).then(r => r.data as Inscricao[]),
    enabled: !!idEvento,
  })

  const atualizarPresenca = useMutation({
    mutationFn: ({ idInscricao, presente }: { idInscricao: number; presente: boolean }) =>
      eventosApi.atualizarPresenca(idEvento!, idInscricao, presente),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["evento-presenca", idEvento] })
      qc.invalidateQueries({ queryKey: ["eventos-que-organizo"] })
    },
  })

  const eventoAtual = eventos?.find(e => e.idEvento === idEvento)
  const totalPresentes = inscricoes?.filter(i => i.presente).length ?? 0

  if (isError) return <p className="text-center text-red-500 mt-20">Não foi possível carregar seus eventos. Tente novamente.</p>
  if (!eventos) return <p className="text-center text-gray-400 dark:text-gray-500 mt-20">Carregando...</p>

  if (eventos.length === 0) {
    return (
      <div className="p-6 text-center mt-20 text-gray-400 dark:text-gray-500">
        <p className="text-5xl mb-3">🔒</p>
        <p>Você não é organizador de nenhum evento com inscrições.</p>
      </div>
    )
  }

  return (
    <div className="pb-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gray-900 dark:bg-black px-5 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
        <h1 className="text-white text-xl font-bold">Controle de Presença</h1>
      </div>

      <div className="p-4 space-y-4">
        {eventos.length > 1 && (
          <select value={idEvento ?? ""} onChange={e => setIdEvento(Number(e.target.value))}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-800 dark:text-gray-100 font-medium">
            {eventos.map(e => <option key={e.idEvento} value={e.idEvento}>{e.nome} — {fmt(e.dataEvento)}</option>)}
          </select>
        )}

        {eventoAtual && !eventoAtual.permiteInscricao && (
          <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 rounded-xl p-3">
            Este evento não tem inscrições habilitadas — a lista abaixo pode estar vazia.
          </p>
        )}

        {eventoAtual && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900 dark:text-gray-100">{eventoAtual.nome}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{fmt(eventoAtual.dataEvento)}{eventoAtual.local ? ` · ${eventoAtual.local}` : ""}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-indigo-600">{totalPresentes}/{inscricoes?.length ?? 0}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">presentes</p>
            </div>
          </div>
        )}

        {isLoading && <p className="text-center text-gray-400 dark:text-gray-500 mt-6">Carregando lista...</p>}

        <div className="space-y-2">
          {inscricoes?.map(i => (
            <button key={i.idInscricao}
              onClick={() => atualizarPresenca.mutate({ idInscricao: i.idInscricao, presente: !i.presente })}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left ${
                i.presente ? "border-green-400 bg-green-50 dark:bg-green-950" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              }`}>
              <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-sm shrink-0">
                {i.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{i.nome}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{i.ehMembro ? "Membro" : "Visitante"}{i.celular ? ` · ${i.celular}` : ""}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${
                i.presente ? "bg-green-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}>
                {i.presente ? "Presente ✓" : "Ausente"}
              </span>
            </button>
          ))}

          {!isLoading && inscricoes?.length === 0 && (
            <p className="text-center text-gray-400 dark:text-gray-500 mt-10">Nenhuma inscrição neste evento ainda.</p>
          )}
        </div>
      </div>
    </div>
  )
}
