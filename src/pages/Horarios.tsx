import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { conteudoApi } from "../api"

export default function Horarios() {
  const { tenantId } = useAuth()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ["institucional", tenantId],
    queryFn: () => conteudoApi.institucional(tenantId!).then(r => r.data as { horariosCulto?: string }),
    enabled: !!tenantId,
  })

  const horarios = data?.horariosCulto

  return (
    <div className="pb-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-5 pt-4 pb-2 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 dark:text-gray-500 text-xl leading-none">←</button>
        <h1 className="text-gray-900 dark:text-gray-100 text-xl font-bold">Horários de Culto</h1>
      </div>

      {isLoading && <p className="text-center text-gray-400 mt-10">Carregando...</p>}

      {!isLoading && (
        <div className="p-4">
          {horarios ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">{horarios}</p>
            </div>
          ) : (
            <p className="text-center text-gray-400 mt-10">Horários ainda não cadastrados pela igreja.</p>
          )}
        </div>
      )}
    </div>
  )
}
