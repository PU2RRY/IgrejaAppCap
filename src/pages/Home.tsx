import { useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { conteudoApi } from "../api"

interface Noticia { idNoticia: number; titulo: string; subtitulo?: string; imagemUrl?: string; publicadoEm?: string }

function toUtc(s: string) {
  return s.endsWith("Z") || s.includes("+") ? s : s + "Z"
}

function fmt(s?: string) {
  return s ? new Date(toUtc(s)).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }) : ""
}

export default function Home() {
  const { tenantId, user } = useAuth()
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["noticias", tenantId],
    queryFn: () => conteudoApi.noticias(tenantId!).then(r => r.data as Noticia[]),
    enabled: !!tenantId,
  })

  const destaques = data?.filter(n => n.imagemUrl).slice(0, 5) ?? []
  const destacadosIds = new Set(destaques.map(n => n.idNoticia))
  const demais = data?.filter(n => !destacadosIds.has(n.idNoticia)) ?? []

  return (
    <div className="pb-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Cabeçalho simples da página */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-gray-400 dark:text-gray-500 text-sm">Olá, {user?.nome?.split(" ")[0]} 👋</p>
        <h1 className="text-gray-900 dark:text-gray-100 text-2xl font-bold mt-1">Notícias</h1>
      </div>

      {isLoading && <p className="text-center text-gray-400 mt-10">Carregando...</p>}

      {/* Banner carousel */}
      {destaques.length > 0 && (
        <div className="mt-4">
          <div
            ref={scrollRef}
            className="flex overflow-x-auto gap-3 px-4 pb-2 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none" }}
          >
            {destaques.map(n => (
              <button
                key={n.idNoticia}
                onClick={() => navigate(`/noticia/${n.idNoticia}`)}
                className="flex-shrink-0 w-[85vw] snap-start rounded-2xl overflow-hidden relative shadow-md"
                style={{ height: 200 }}
              >
                <img src={n.imagemUrl!} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                  <p className="text-white/70 text-xs mb-1">{fmt(n.publicadoEm)}</p>
                  <p className="text-white font-bold text-base leading-snug line-clamp-2">{n.titulo}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Dots */}
          {destaques.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-2">
              {destaques.map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Demais notícias */}
      <div className="p-4 space-y-3 mt-2">
        {(destaques.length === 0 ? data ?? [] : demais).map(n => (
          <button key={n.idNoticia} onClick={() => navigate(`/noticia/${n.idNoticia}`)}
            className="w-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm text-left border border-gray-100 dark:border-gray-700 flex gap-3">
            {n.imagemUrl && <img src={n.imagemUrl} className="w-24 h-24 object-cover flex-shrink-0" />}
            <div className="p-3 flex-1 min-w-0">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{fmt(n.publicadoEm)}</p>
              <p className="font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-2">{n.titulo}</p>
              {n.subtitulo && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{n.subtitulo}</p>}
            </div>
          </button>
        ))}

        {!isLoading && !data?.length && (
          <p className="text-center text-gray-400 mt-10">Nenhuma notícia publicada ainda.</p>
        )}
      </div>
    </div>
  )
}
