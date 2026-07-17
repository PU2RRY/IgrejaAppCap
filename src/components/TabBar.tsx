import { NavLink } from "react-router-dom"

const tabs = [
  { to: "/home",    icon: "🏠", label: "Início"  },
  { to: "/ao-vivo", icon: "📡", label: "Ao Vivo" },
  { to: "/midia",   icon: "🎵", label: "Mídia"   },
]

export default function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around h-14 z-50">
      {tabs.map(t => (
        <NavLink key={t.to} to={t.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 text-xs gap-0.5 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500"}`
          }>
          <span className="text-xl leading-none">{t.icon}</span>
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
