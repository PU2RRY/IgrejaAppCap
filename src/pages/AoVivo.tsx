import { useQuery } from "@tanstack/react-query"
import { Browser } from "@capacitor/browser"
import { useAuth } from "../contexts/AuthContext"
import { conteudoApi } from "../api"

const ORIGEM_EMBED = "https://mixdoreino.com.br"

function youtubeId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/|\/live\/|\/embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function youtubeCanalAoVivo(url: string) {
  const m = url.match(/[?&]channel=([A-Za-z0-9_-]+)/)
  return m ? m[1] : null
}

function urlAbsoluta(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

// Link normal (nao-embed) para abrir no navegador como alternativa, caso o player embutido falhe.
function linkParaAbrir(url: string) {
  const vid = youtubeId(url)
  if (vid) return `https://www.youtube.com/watch?v=${vid}`
  const canal = youtubeCanalAoVivo(url)
  if (canal) return `https://www.youtube.com/channel/${canal}/live`
  return urlAbsoluta(url)
}

// URL de embed valida (com origin fixo) para tocar dentro do proprio app via iframe.
function embedUrl(url: string) {
  const vid = youtubeId(url)
  if (vid) return `https://www.youtube.com/embed/${vid}?autoplay=0&rel=0&playsinline=1&origin=${encodeURIComponent(ORIGEM_EMBED)}`
  const canal = youtubeCanalAoVivo(url)
  if (canal) return `https://www.youtube.com/embed/live_stream?channel=${canal}&autoplay=0&rel=0&playsinline=1&origin=${encodeURIComponent(ORIGEM_EMBED)}`
  return null
}

export default function AoVivo() {
  const { tenantId } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ["institucional", tenantId],
    queryFn: () => conteudoApi.institucional(tenantId!).then(r => r.data),
    enabled: !!tenantId,
  })

  const url: string | undefined = data?.urlStream
  const embed = url ? embedUrl(url) : null

  return (
    <div className="pb-16 min-h-screen bg-black flex flex-col">
      <div className="bg-gray-900 dark:bg-black px-5 pt-10 pb-4">
        <h1 className="text-white text-2xl font-bold">📡 Culto ao Vivo</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {isLoading && <p className="text-gray-400 dark:text-gray-500">Carregando...</p>}

        {!isLoading && embed && (
          <div className="w-full">
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={embed}
                className="absolute inset-0 w-full h-full rounded-xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <button onClick={() => Browser.open({ url: linkParaAbrir(url!) })}
              className="mt-4 flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 rounded-xl w-full">
              ▶ Assistir no YouTube
            </button>
          </div>
        )}

        {!isLoading && !embed && url && (
          <div className="text-center">
            <p className="text-gray-400 dark:text-gray-500 mb-4">Link configurado mas não é um vídeo do YouTube.</p>
            <button onClick={() => Browser.open({ url: urlAbsoluta(url) })}
              className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl">
              Abrir Link
            </button>
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
