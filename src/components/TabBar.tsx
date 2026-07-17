import { NavLink } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { perfilApi } from "../api"

const tabs = [
  {
    to: "/home", label: "Início",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5 12 3l9 6.5" /><path d="M5 9.5V21h14V9.5" />
      </svg>
    ),
  },
  {
    to: "/ao-vivo", label: "Ao Vivo",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" />
      </svg>
    ),
  },
  {
    to: "/midia", label: "Mídia",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    to: "/eventos", label: "Eventos",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
]

export default function TabBar() {
  const { data: perfil } = useQuery({
    queryKey: ["meu-perfil"],
    queryFn: () => perfilApi.meuPerfil().then(r => (r.data as any).data ?? r.data as { nome: string; fotoUrl?: string }),
  })

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50">
      <div className="flex items-center justify-between bg-white/30 dark:bg-gray-900/30 backdrop-blur-md rounded-full shadow-lg shadow-black/10 border border-gray-200/60 dark:border-gray-700/60 px-6 py-2.5">
        {tabs.map(t => (
          <NavLink key={t.to} to={t.to} aria-label={t.label}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 transition-colors ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-300 dark:text-gray-300"}`
            }>
            {({ isActive }) => (
              <>
                {t.icon}
                <span className={`w-1 h-1 rounded-full transition-opacity ${isActive ? "bg-indigo-600 dark:bg-indigo-400 opacity-100" : "opacity-0"}`} />
              </>
            )}
          </NavLink>
        ))}

        <NavLink to="/perfil" aria-label="Meu perfil" className="shrink-0">
          {perfil?.fotoUrl ? (
            <img src={perfil.fotoUrl} className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
              {perfil?.nome?.charAt(0).toUpperCase() ?? "?"}
            </div>
          )}
        </NavLink>
      </div>
    </nav>
  )
}
