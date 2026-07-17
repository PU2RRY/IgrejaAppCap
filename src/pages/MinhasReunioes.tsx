import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { reunioesApi } from "../api"

interface MinhaReuniao {
  idReuniao: number
  titulo: string
  dataReuniao: string
  horario?: string
  localReuniao?: string
  observacao?: string
  meuStatus: "Pendente" | "Confirmado" | "Recusado"
}

const STATUS_COLOR: Record<string, string> = {
  Pendente: "#D97706",
  Confirmado: "#16A34A",
  Recusado: "#DC2626",
}

function fmt(dataStr: string, horario?: string) {
  const d = new Date(dataStr + "T00:00:00")
  const dia = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
  return horario ? `${dia} às ${horario}` : dia
}

export default function MinhasReunioes() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["minhas-reunioes"],
    queryFn: () => reunioesApi.minhas().then(r => r.data as MinhaReuniao[]),
  })

  const { data: lideraAlgum } = useQuery({
    queryKey: ["grupos-que-lidero"],
    queryFn: () => reunioesApi.gruposQueLidero().then(r => (r.data as any[]).length > 0),
  })

  const responder = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "Confirmado" | "Recusado" }) =>
      reunioesApi.responder(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["minhas-reunioes"] }),
  })

  return (
    <div className="pb-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-indigo-600 px-5 pt-10 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
          <h1 className="text-white text-xl font-bold">Minhas Reuniões</h1>
        </div>
        {lideraAlgum && (
          <button onClick={() => navigate("/reunioes/gerenciar")}
            className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            Gerenciar
          </button>
        )}
      </div>

      {isLoading && <p className="text-center text-gray-400 dark:text-gray-500 mt-10">Carregando...</p>}

      <div className="p-4 space-y-3">
        {data?.map(r => (
          <div key={r.idReuniao} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="font-bold text-gray-900 dark:text-gray-100">{r.titulo}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{fmt(r.dataReuniao, r.horario)}</p>
            {r.localReuniao && <p className="text-sm text-gray-500 dark:text-gray-400">📍 {r.localReuniao}</p>}
            {r.observacao && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{r.observacao}</p>}

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs font-bold px-2 py-1 rounded-full"
                style={{ color: STATUS_COLOR[r.meuStatus], backgroundColor: STATUS_COLOR[r.meuStatus] + "22" }}>
                {r.meuStatus}
              </span>

              {r.meuStatus === "Pendente" && (
                <div className="flex gap-2">
                  <button onClick={() => responder.mutate({ id: r.idReuniao, status: "Recusado" })}
                    className="text-xs font-bold text-red-600 border border-red-200 px-3 py-1.5 rounded-lg">
                    Recusar
                  </button>
                  <button onClick={() => responder.mutate({ id: r.idReuniao, status: "Confirmado" })}
                    className="text-xs font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-lg">
                    Confirmar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {!isLoading && !data?.length && (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400 dark:text-gray-500">
            <p className="text-5xl mb-3">🗓️</p>
            <p>Nenhuma reunião marcada para você.</p>
          </div>
        )}
      </div>
    </div>
  )
}
