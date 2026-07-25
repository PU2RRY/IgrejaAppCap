import { useQuery } from "@tanstack/react-query"
import { useLocation, useNavigate } from "react-router-dom"
import { Home, Calendar, CalendarDays, Users, Church, Sun, Moon, Repeat, Contact } from "lucide-react"
import { escalasApi, reunioesApi, celulasApi, perfilApi } from "../api"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import { PersonPraying } from "./icons/PersonPraying"

function ItemMenu({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl font-medium transition-colors ${
        active
          ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
          : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
      }`}
    >
      <span className={active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500"}>{icon}</span>
      {label}
    </button>
  )
}

export default function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()
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

  const ativo = (path: string) => location.pathname === path

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
          <ItemMenu icon={<Home size={20} />} label="Início" active={ativo("/home")} onClick={() => go("/home")} />

          {!isVisitante && temAcessoEscalas && (
            <ItemMenu icon={<Calendar size={20} />} label="Escalas" active={ativo("/escalas")} onClick={() => go("/escalas")} />
          )}

          {!isVisitante && temAcessoReunioes && (
            <ItemMenu icon={<CalendarDays size={20} />} label="Reuniões" active={ativo("/reunioes")} onClick={() => go("/reunioes")} />
          )}

          {!isVisitante && (
            <ItemMenu icon={<PersonPraying size={20} />} label="Orações" active={ativo("/oracoes")} onClick={() => go("/oracoes")} />
          )}

          {!isVisitante && temAcessoCelulas && (
            <ItemMenu icon={<Users size={20} />} label="Células" active={ativo("/celulas")} onClick={() => go("/celulas")} />
          )}

          <div className="border-t dark:border-gray-700 my-2" />

          {!isVisitante && (
            <ItemMenu icon={<Contact size={20} />} label="Perfil" active={ativo("/perfil")} onClick={() => go("/perfil")} />
          )}

          {!isVisitante && (
            <ItemMenu icon={<Church size={20} />} label="Igreja" active={ativo("/igreja")} onClick={() => go("/igreja")} />
          )}

          <ItemMenu
            icon={theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            label={theme === "dark" ? "Tema Claro" : "Tema Escuro"}
            onClick={toggleTheme}
          />

          <ItemMenu icon={<Repeat size={20} />} label="Trocar de Igreja" onClick={trocarIgreja} />
        </nav>
      </div>
    </div>
  )
}
