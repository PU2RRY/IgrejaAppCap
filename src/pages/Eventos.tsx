import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
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
}

function toUtcDate(s: string) {
  return new Date(s + "T00:00:00")
}

function fmt(s: string) {
  return toUtcDate(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
}

export default function Eventos() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ["eventos-app"],
    queryFn: () => eventosApi.listar().then(r => r.data as EventoPublico[]),
  })

  const { data: organizoAlgum } = useQuery({
    queryKey: ["eventos-que-organizo-flag"],
    queryFn: () => eventosApi.organizo().then(r => (r.data as unknown[]).length > 0),
  })

  return (
    <div className="pb-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gray-900 dark:bg-black px-5 pt-4 pb-4 flex items-center justify-between">
        <h1 className="text-white text-xl font-bold">📅 Eventos</h1>
        {organizoAlgum && (
          <button onClick={() => navigate("/eventos/gerenciar-presenca")}
            className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            Gerenciar Presença
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {isLoading && <p className="text-center text-gray-400 mt-10">Carregando...</p>}

        {data?.map(ev => (
          <button key={ev.idEvento} onClick={() => navigate(`/eventos/${ev.idEvento}`)}
            className="w-full text-left bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-gray-900 dark:text-gray-100">{ev.nome}</p>
              {ev.permiteInscricao && ev.jaInscrito && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-green-700 bg-green-100 shrink-0">
                  Inscrito
                </span>
              )}
              {ev.permiteInscricao && !ev.jaInscrito && !ev.inscricoesAbertas && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-gray-500 bg-gray-100 dark:bg-gray-700 shrink-0">
                  Inscrições fechadas
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{fmt(ev.dataEvento)}{ev.horario ? ` às ${ev.horario.slice(0, 5)}` : ""}</p>
            {ev.local && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">📍 {ev.local}</p>}
          </button>
        ))}

        {!isLoading && !data?.length && (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
            <p className="text-5xl mb-3">📅</p>
            <p>Nenhum evento no momento.</p>
          </div>
        )}
      </div>
    </div>
  )
}
