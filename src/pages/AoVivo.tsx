import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../contexts/AuthContext"
import { conteudoApi } from "../api"

function youtubeId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/|\/live\/|\/embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

export default function AoVivo() {
  const { tenantId } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ["institucional", tenantId],
    queryFn: () => conteudoApi.institucional(tenantId!).then(r => r.data),
    enabled: !!tenantId,
  })

  const url: string | undefined = data?.urlStream
  const vid = url ? youtubeId(url) : null
  const embedUrl = vid
    ? `https://www.youtube.com/embed/${vid}?autoplay=0&rel=0&playsinline=1&origin=${encodeURIComponent(window.location.origin)}`
    : null

  return (
    <div className="pb-16 min-h-screen bg-black flex flex-col">
      <div className="bg-gray-900 dark:bg-black px-5 pt-10 pb-4">
        <h1 className="text-white text-2xl font-bold">📡 Culto ao Vivo</h1>
        <p className="text-yellow-400 text-xs mt-1 break-all">DEBUG origin: {window.location.origin} | href: {window.location.href}</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {isLoading && <p className="text-gray-400 dark:text-gray-500">Carregando...</p>}

        {!isLoading && embedUrl && (
          <div className="w-full">
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full rounded-xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 rounded-xl w-full">
              ▶ Abrir no YouTube
            </a>
          </div>
        )}

        {!isLoading && !embedUrl && url && (
          <div className="text-center">
            <p className="text-gray-400 dark:text-gray-500 mb-4">Link configurado mas não é um vídeo do YouTube.</p>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl">
              Abrir Link
            </a>
          </div>
        )}

        {!isLoading && !url && (
          <div className="text-center">
            <p className="text-5xl mb-3">📡</p>
            <p className="text-gray-400 dark:text-gray-500">Nenhuma transmissão ao vivo configurada.</p>
          </div>
        )}
      </div>
    </div>
  )
}
