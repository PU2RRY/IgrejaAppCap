import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import { eventosApi } from "../api"

interface EventoPublico {
  idEvento: number
  nome: string
  dataEvento: string
  dataFimEvento: string | null
  horario: string | null
  local: string | null
  descricao: string | null
  permiteInscricao: boolean
  jaInscrito: boolean
  vagasRestantes: number | null
  inscricoesAbertas: boolean
  souOrganizador: boolean
}

function fmt(s: string) {
  return new Date(s + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
}

export default function EventoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const idEvento = Number(id)

  const { data: evento, isLoading } = useQuery({
    queryKey: ["evento-app", idEvento],
    queryFn: () => eventosApi.obter(idEvento).then(r => r.data as EventoPublico),
    enabled: !!idEvento,
  })

  const inscrever = useMutation({
    mutationFn: () => eventosApi.inscrever(idEvento),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["evento-app", idEvento] })
      qc.invalidateQueries({ queryKey: ["eventos-app"] })
    },
  })

  const cancelar = useMutation({
    mutationFn: () => eventosApi.cancelar(idEvento),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["evento-app", idEvento] })
      qc.invalidateQueries({ queryKey: ["eventos-app"] })
    },
  })

  return (
    <div className="pb-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gray-900 dark:bg-black px-5 pt-4 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl leading-none">←</button>
        <h1 className="text-white text-lg font-bold truncate">Evento</h1>
      </div>

      {isLoading && <p className="text-center text-gray-400 mt-10">Carregando...</p>}

      {evento && (
        <div className="p-4 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-2">
            <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">{evento.nome}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              📅 {fmt(evento.dataEvento)}{evento.horario ? ` às ${evento.horario.slice(0, 5)}` : ""}
            </p>
            {evento.local && <p className="text-sm text-gray-500 dark:text-gray-400">📍 {evento.local}</p>}
            {evento.descricao && (
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap pt-2">{evento.descricao}</p>
            )}
            {evento.vagasRestantes !== null && evento.vagasRestantes > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">{evento.vagasRestantes} vaga{evento.vagasRestantes !== 1 ? "s" : ""} restante{evento.vagasRestantes !== 1 ? "s" : ""}</p>
            )}
          </div>

          {evento.souOrganizador && (
            <button onClick={() => navigate(`/eventos/gerenciar-presenca?evento=${evento.idEvento}`)}
              className="w-full bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold py-2.5 rounded-xl">
              📋 Gerenciar Presença (você é o organizador)
            </button>
          )}

          {evento.permiteInscricao && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              {evento.jaInscrito ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">✓ Você está inscrito neste evento.</p>
                  <button onClick={() => cancelar.mutate()} disabled={cancelar.isPending}
                    className="w-full text-red-600 dark:text-red-400 text-sm font-bold py-2 rounded-xl border border-red-200 dark:border-red-900 disabled:opacity-50">
                    {cancelar.isPending ? "Cancelando..." : "Cancelar inscrição"}
                  </button>
                </div>
              ) : !evento.inscricoesAbertas ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-1">
                  {evento.vagasRestantes !== null && evento.vagasRestantes <= 0
                    ? "As vagas para este evento se esgotaram."
                    : "As inscrições para este evento não estão abertas no momento."}
                </p>
              ) : (
                <button onClick={() => inscrever.mutate()} disabled={inscrever.isPending}
                  className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl disabled:opacity-50">
                  {inscrever.isPending ? "Inscrevendo..." : "Inscrever-se"}
                </button>
              )}
              {inscrever.isError && (
                <p className="text-xs text-red-600 mt-2">{(inscrever.error as any)?.response?.data?.message ?? "Não foi possível concluir a inscrição."}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
