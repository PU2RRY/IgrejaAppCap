import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { escalasApi } from "../api"

interface MinhaEscala {
  idEscala: number
  nomeMinisterio: string
  titulo: string
  dataEvento: string
  observacoes?: string
  meuStatus: "Pendente" | "Confirmado" | "Recusado"
}

const STATUS_COLOR: Record<string, string> = {
  Pendente: "#D97706",
  Confirmado: "#16A34A",
  Recusado: "#DC2626",
}

function fmt(s: string) {
  const d = new Date(s.endsWith("Z") || s.includes("+") ? s : s + "Z")
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) + " às " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export default function MinhasEscalas() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["minhas-escalas"],
    queryFn: () => escalasApi.minhas().then(r => r.data as MinhaEscala[]),
  })

  const { data: lideraAlgum } = useQuery({
    queryKey: ["ministerios-que-lidero"],
    queryFn: () => escalasApi.ministeriosQueLidero().then(r => (r.data as any[]).length > 0),
  })

  const responder = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "Confirmado" | "Recusado" }) =>
      escalasApi.responder(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["minhas-escalas"] }),
  })

  return (
    <div className="pb-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gray-900 dark:bg-black px-5 pt-10 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
          <h1 className="text-white text-xl font-bold">Minhas Escalas</h1>
        </div>
        {lideraAlgum && (
          <button onClick={() => navigate("/escalas/gerenciar")}
            className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            Gerenciar
          </button>
        )}
      </div>

      {isLoading && <p className="text-center text-gray-400 dark:text-gray-500 mt-10">Carregando...</p>}

      <div className="p-4 space-y-3">
        {data?.map(e => (
          <div key={e.idEscala} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-xs text-indigo-600 font-bold uppercase">{e.nomeMinisterio}</p>
            <p className="font-bold text-gray-900 dark:text-gray-100 mt-1">{e.titulo}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{fmt(e.dataEvento)}</p>
            {e.observacoes && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{e.observacoes}</p>}

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs font-bold px-2 py-1 rounded-full"
                style={{ color: STATUS_COLOR[e.meuStatus], backgroundColor: STATUS_COLOR[e.meuStatus] + "22" }}>
                {e.meuStatus}
              </span>

              {e.meuStatus === "Pendente" && (
                <div className="flex gap-2">
                  <button onClick={() => responder.mutate({ id: e.idEscala, status: "Recusado" })}
                    className="text-xs font-bold text-red-600 border border-red-200 px-3 py-1.5 rounded-lg">
                    Recusar
                  </button>
                  <button onClick={() => responder.mutate({ id: e.idEscala, status: "Confirmado" })}
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
            <p className="text-5xl mb-3">📅</p>
            <p>Você não está escalado no momento.</p>
          </div>
        )}
      </div>
    </div>
  )
}
