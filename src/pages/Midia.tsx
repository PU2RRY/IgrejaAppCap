import { useQuery } from "@tanstack/react-query"
import { Browser } from "@capacitor/browser"
import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { conteudoApi } from "../api"

const CATS = ["Todas", "Pregação", "Louvor", "Podcast", "Rádio"]

interface Midia { idMidia: number; titulo: string; tipo: string; categoria: string; url: string; thumbnailUrl?: string }

function youtubeId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/|\/embed\/|\/live\/|\/shorts\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function urlAbsoluta(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

function spotifyEmbed(url: string) {
  const m = url.match(/open\.spotify\.com\/(?:embed\/)?(track|episode|show|playlist|album|artist)\/([A-Za-z0-9]+)/)
  if (!m) return null
  const [, tipo, id] = m
  const altura = tipo === "track" || tipo === "episode" ? 152 : 352
  return { src: `https://open.spotify.com/embed/${tipo}/${id}`, altura }
}

function MidiaCard({ m }: { m: Midia }) {
  const ytId = m.tipo === "YouTube" ? youtubeId(m.url) : null
  const spotify = m.tipo === "Spotify" ? spotifyEmbed(m.url) : null
  const thumb = m.thumbnailUrl ?? (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null)

  if (spotify) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 mb-3">
        <iframe
          src={spotify.src}
          width="100%"
          height={spotify.altura}
          style={{ border: 0 }}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
        <div className="px-3 pb-3 pt-2">
          <p className="text-xs text-gray-400 dark:text-gray-500">{m.categoria}</p>
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{m.titulo}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 mb-3">
      {ytId ? (
        <button className="relative w-full block" onClick={() => Browser.open({ url: urlAbsoluta(m.url) })}>
          {thumb
            ? <img src={thumb} className="w-full aspect-video object-cover" />
            : <div className="w-full aspect-video bg-gray-900 flex items-center justify-center"><span className="text-4xl">▶</span></div>
          }
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-red-600 rounded-full w-14 h-14 flex items-center justify-center">
              <span className="text-white text-2xl ml-1">▶</span>
            </div>
          </div>
        </button>
      ) : (
        <a href={urlAbsoluta(m.url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3">
          <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl text-white flex-shrink-0 ${
            m.tipo === "Spotify" ? "bg-green-500" : "bg-red-600"
          }`}>
            {m.tipo === "Spotify" ? "🎵" : "▶"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{m.categoria}</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-2">{m.titulo}</p>
            <span className={`text-xs font-bold ${m.tipo === "Spotify" ? "text-green-600" : "text-red-600"}`}>
              {m.tipo === "Spotify" ? "🎵 Spotify" : `▶ ${m.tipo}`}
            </span>
          </div>
        </a>
      )}
      {ytId && (
        <div className="px-3 pb-3 pt-2">
          <p className="text-xs text-gray-400 dark:text-gray-500">{m.categoria}</p>
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{m.titulo}</p>
        </div>
      )}
    </div>
  )
}

export default function Midia() {
  const { tenantId } = useAuth()
  const [cat, setCat] = useState("Todas")

  const { data, isLoading } = useQuery({
    queryKey: ["midias", tenantId, cat],
    queryFn: () => conteudoApi.midias(tenantId!, cat === "Todas" ? undefined : cat).then(r => r.data as Midia[]),
    enabled: !!tenantId,
  })

  return (
    <div className="pb-16 dark:bg-gray-900 min-h-screen">
      <div className="bg-gray-900 dark:bg-black px-5 pt-10 pb-4">
        <h1 className="text-white text-2xl font-bold">🎵 Áudio & Vídeo</h1>
      </div>

      <div className="flex gap-2 p-3 overflow-x-auto">
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
              cat === c ? "bg-indigo-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}>
            {c}
          </button>
        ))}
      </div>

      <div className="px-4">
        {isLoading && <p className="text-center text-gray-400 dark:text-gray-500 mt-10">Carregando...</p>}
        {data?.map(m => <MidiaCard key={m.idMidia} m={m} />)}
        {!isLoading && !data?.length && (
          <p className="text-center text-gray-400 dark:text-gray-500 mt-10">Nenhum conteúdo nesta categoria.</p>
        )}
      </div>
    </div>
  )
}
