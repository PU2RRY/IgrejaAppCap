import { useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { conteudoApi, perfilApi } from "../api"

interface Noticia { idNoticia: number; titulo: string; subtitulo?: string; imagemUrl?: string; publicadoEm?: string }

function toUtc(s: string) {
  return s.endsWith("Z") || s.includes("+") ? s : s + "Z"
}

function fmt(s?: string) {
  return s ? new Date(toUtc(s)).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }) : ""
}

const quickActions = [
  {
    label: "Pedido de oração",
    action: (navigate: ReturnType<typeof useNavigate>) => navigate("/oracao"),
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s-7-4.35-9.5-8.55C.83 9.24 2.2 5.5 5.6 5.06 7.7 4.8 9.6 5.9 12 8.5c2.4-2.6 4.3-3.7 6.4-3.44 3.4.44 4.77 4.18 3.1 7.39C19 16.65 12 21 12 21z" />
      </svg>
    ),
  },
  {
    label: "Envolva-se",
    action: (navigate: ReturnType<typeof useNavigate>) => navigate("/celulas"),
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Horários",
    action: (navigate: ReturnType<typeof useNavigate>) => navigate("/horarios"),
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    label: "Eventos",
    action: (navigate: ReturnType<typeof useNavigate>) => navigate("/eventos"),
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
]

const acaoBemEstar = {
  label: "Bem-estar",
  action: (navigate: ReturnType<typeof useNavigate>) => navigate("/bem-estar"),
  icon: <span className="text-lg leading-none">💜</span>,
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

  const { data: meuPerfil } = useQuery({
    queryKey: ["meu-perfil"],
    queryFn: () => perfilApi.meuPerfil().then(r => r.data as { permiteSaudeEmocional?: boolean }),
  })

  // A lista já vem ordenada da mais recente pra mais antiga — pega só a 1ª com imagem pro banner.
  const destaque = data?.find(n => n.imagemUrl)
  const comImagem = data?.filter(n => n.imagemUrl && n.idNoticia !== destaque?.idNoticia) ?? []
  const semImagem = data?.filter(n => !n.imagemUrl) ?? []

  return (
    <div className="pb-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Saudação */}
      <div className="px-5 pt-4">
        <p className="text-gray-400 dark:text-gray-500 text-sm">Olá, {user?.nome?.split(" ")[0]} 👋</p>
      </div>

      {isLoading && <p className="text-center text-gray-400 mt-10">Carregando...</p>}

      {/* Banner de destaque — só a notícia mais recente com imagem */}
      {destaque && (
        <div className="mt-3 px-5">
          <button
            onClick={() => navigate(`/noticia/${destaque.idNoticia}`)}
            className="w-full rounded-3xl overflow-hidden relative shadow-md bg-gray-900 block"
            style={{ height: 200 }}
          >
            <img src={destaque.imagemUrl!} className="w-full h-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/20 to-transparent" />
            {destaque.publicadoEm && (
              <span className="absolute top-4 left-4 bg-white/15 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">
                {fmt(destaque.publicadoEm)}
              </span>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
              <p className="text-white font-bold text-lg leading-snug line-clamp-2">{destaque.titulo}</p>
            </div>
          </button>
        </div>
      )}

      {/* Atalhos rápidos */}
      <div className={`px-5 mt-5 grid gap-2 ${meuPerfil?.permiteSaudeEmocional ? "grid-cols-5" : "grid-cols-4"}`}>
        {(meuPerfil?.permiteSaudeEmocional ? [...quickActions, acaoBemEstar] : quickActions).map((qa) => (
          <button key={qa.label} onClick={() => qa.action(navigate)} className="flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              {qa.icon}
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center leading-tight">{qa.label}</span>
          </button>
        ))}
      </div>

      {/* Notícias com imagem — lista horizontal */}
      {comImagem.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between px-5 mb-3">
            <h2 className="text-gray-900 dark:text-gray-100 font-bold text-lg">Notícias</h2>
          </div>

          <div ref={scrollRef} className="flex overflow-x-auto gap-3 px-5 pb-2" style={{ scrollbarWidth: "none" }}>
            {comImagem.map(n => (
              <button key={n.idNoticia} onClick={() => navigate(`/noticia/${n.idNoticia}`)}
                className="flex-shrink-0 w-36 text-left">
                <img src={n.imagemUrl!} className="w-36 h-24 object-cover rounded-xl mb-2" />
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-snug line-clamp-2">{n.titulo}</p>
                {n.subtitulo && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.subtitulo}</p>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notícias sem imagem — lista de texto, mais abaixo */}
      {semImagem.length > 0 && (
        <div className="mt-6 px-5">
          {!destaque && comImagem.length === 0 && (
            <h2 className="text-gray-900 dark:text-gray-100 font-bold text-lg mb-3">Notícias</h2>
          )}
          <div className="space-y-3">
            {semImagem.map(n => (
              <button key={n.idNoticia} onClick={() => navigate(`/noticia/${n.idNoticia}`)}
                className="w-full bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 text-left block">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{fmt(n.publicadoEm)}</p>
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-2">{n.titulo}</p>
                {n.subtitulo && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{n.subtitulo}</p>}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !data?.length && (
        <p className="text-center text-gray-400 mt-10">Nenhuma notícia publicada ainda.</p>
      )}
    </div>
  )
}
