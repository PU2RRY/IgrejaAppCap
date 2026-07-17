import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { escalasApi, reunioesApi, celulasApi, perfilApi } from "../api"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"

export default function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const { data: perfil } = useQuery({
    queryKey: ["meu-perfil"],
    queryFn: () => perfilApi.meuPerfil().then(r => (r.data as any).data ?? r.data as { nome: string; fotoUrl?: string; tipoMembro?: string }),
    enabled: open,
  })

  const isVisitante = perfil?.tipoMembro === "Visitante"

  const { data: temAcessoEscalas } = useQuery({
    queryKey: ["tenho-acesso-escalas"],
    queryFn: () => escalasApi.tenhoAcesso().then(r => (r.data as any).tem as boolean),
    enabled: open && !isVisitante,
  })

  const { data: temAcessoReunioes } = useQuery({
    queryKey: ["tenho-acesso-reunioes"],
    queryFn: () => reunioesApi.tenhoAcesso().then(r => (r.data as any).tem as boolean),
    enabled: open && !isVisitante,
  })

  const { data: temAcessoCelulas } = useQuery({
    queryKey: ["tenho-acesso-celulas"],
    queryFn: () => celulasApi.tenhoAcesso().then(r => (r.data as any).tem as boolean),
    enabled: open && !isVisitante,
  })

  function go(path: string) {
    onClose()
    navigate(path)
  }

  function trocarIgreja() {
    if (confirm("Isso irá desconectar sua conta. Confirmar?")) { logout(); navigate("/") }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 w-72 max-w-[80vw] h-full shadow-xl flex flex-col">
        <div className="bg-gray-900 dark:bg-black px-5 pt-10 pb-5">
          {perfil?.fotoUrl ? (
            <img src={perfil.fotoUrl} className="w-12 h-12 rounded-full object-cover mb-2 border border-gray-700" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-bold mb-2">
              {user?.nome?.charAt(0).toUpperCase() ?? "?"}
            </div>
          )}
          <p className="text-white font-bold">{user?.nome}</p>
          <p className="text-gray-400 text-xs">{user?.email}</p>
        </div>

        <nav className="flex-1 py-3 space-y-1 px-2 overflow-y-auto">
          <button onClick={() => go("/home")} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-200">
            🏠 Início
          </button>

          {!isVisitante && temAcessoEscalas && (
            <button onClick={() => go("/escalas")} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-200">
              📅 Escalas
            </button>
          )}

          {!isVisitante && temAcessoReunioes && (
            <button onClick={() => go("/reunioes")} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-200">
              🗓️ Reuniões
            </button>
          )}

          {!isVisitante && (
            <button onClick={() => go("/oracoes")} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-200">
              🙏 Orações
            </button>
          )}

          {!isVisitante && temAcessoCelulas && (
            <button onClick={() => go("/celulas")} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-200">
              🏠 Células
            </button>
          )}

          <div className="border-t dark:border-gray-700 my-2" />

          {!isVisitante && (
            <button onClick={() => go("/perfil")} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-200">
              👤 Perfil
            </button>
          )}

          {!isVisitante && (
            <button onClick={() => go("/igreja")} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-200">
              ✝️ Igreja
            </button>
          )}

          <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-200">
            <span>{theme === "dark" ? "☀️ Tema Claro" : "🌙 Tema Escuro"}</span>
          </button>

          <button onClick={trocarIgreja} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-200">
            ⛪ Trocar de Igreja
          </button>
        </nav>
      </div>
    </div>
  )
}
