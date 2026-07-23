import { useQuery } from "@tanstack/react-query"
import { Browser } from "@capacitor/browser"
import { useAuth } from "../contexts/AuthContext"
import { conteudoApi } from "../api"

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

// Links de "embed" (ex: youtube.com/embed/ID ou embed/live_stream?channel=X) so funcionam
// dentro de um iframe com contexto de pagina-pai. Abertos direto no navegador (fora de um
// iframe), o YouTube recusa com "Erro 153". Por isso convertemos pro link normal de assistir.
function linkParaAbrir(url: string) {
  const vid = youtubeId(url)
  if (vid) return `https://www.youtube.com/watch?v=${vid}`
  const canal = youtubeCanalAoVivo(url)
  if (canal) return `https://www.youtube.com/channel/${canal}/live`
  return urlAbsoluta(url)
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
  const thumb = vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : null

  return (
    <div className="pb-16 min-h-screen bg-black flex flex-col">
      <div className="bg-gray-900 dark:bg-black px-5 pt-10 pb-4">
        <h1 className="text-white text-2xl font-bold">📡 Culto ao Vivo</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {isLoading && <p className="text-gray-400 dark:text-gray-500">Carregando...</p>}

        {!isLoading && url && (
          <div className="w-full">
            <button className="relative w-full block" onClick={() => Browser.open({ url: linkParaAbrir(url) })}>
              {thumb
                ? <img src={thumb} className="w-full aspect-video object-cover rounded-xl" />
                : <div className="w-full aspect-video bg-gray-900 rounded-xl flex items-center justify-center"><span className="text-5xl">📡</span></div>
              }
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-xl">
                <div className="bg-red-600 rounded-full w-16 h-16 flex items-center justify-center">
                  <span className="text-white text-3xl ml-1">▶</span>
                </div>
              </div>
            </button>
            <button onClick={() => Browser.open({ url: linkParaAbrir(url) })}
              className="mt-4 flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 rounded-xl w-full">
              ▶ Assistir Culto ao Vivo
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
