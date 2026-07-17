import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../contexts/AuthContext"
import { conteudoApi } from "../api"

function Secao({ titulo, texto }: { titulo: string; texto?: string }) {
  if (!texto) return null
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-indigo-600 font-bold mb-2">{titulo}</h3>
      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{texto}</p>
    </div>
  )
}

export default function Igreja() {
  const { tenantId } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ["institucional", tenantId],
    queryFn: () => conteudoApi.institucional(tenantId!).then(r => r.data),
    enabled: !!tenantId,
  })

  return (
    <div className="pb-16 dark:bg-gray-900 min-h-screen">
      <div className="bg-indigo-600 flex flex-col items-center py-10">
        {data?.logoUrl
          ? <img src={data.logoUrl} className="w-20 h-20 rounded-2xl object-cover mb-3" />
          : <div className="w-20 h-20 rounded-2xl bg-indigo-500 flex items-center justify-center text-white text-4xl mb-3">✝</div>
        }
        <h1 className="text-white text-xl font-bold">{data?.nomeIgreja ?? "Minha Igreja"}</h1>
      </div>

      {isLoading && <p className="text-center text-gray-400 dark:text-gray-500 mt-10">Carregando...</p>}

      <div className="p-4 space-y-3">
        <Secao titulo="Nossa História" texto={data?.historia} />
        <Secao titulo="Missão"         texto={data?.missao} />
        <Secao titulo="Visão"          texto={data?.visao} />
        <Secao titulo="Credo"          texto={data?.credo} />

        {(data?.instagram || data?.facebook || data?.youtube) && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-indigo-600 font-bold mb-3">Redes Sociais</h3>
            <div className="flex flex-wrap gap-2">
              {data?.instagram && (
                <a href={data.instagram} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: "#E1306C" }}>
                  📷 Instagram
                </a>
              )}
              {data?.facebook && (
                <a href={data.facebook} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: "#1877F2" }}>
                  Facebook
                </a>
              )}
              {data?.youtube && (
                <a href={data.youtube} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: "#FF0000" }}>
                  ▶ YouTube
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
