import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getNotificacoes, marcarTodasLidas, type NotifLocal } from "../hooks/useNotificationStore"

function fmt(s: string) {
  return new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

export default function Notificacoes() {
  const navigate = useNavigate()
  const [lista, setLista] = useState<NotifLocal[]>([])

  useEffect(() => {
    setLista(getNotificacoes())
    marcarTodasLidas()
    window.dispatchEvent(new Event("notif-update"))
  }, [])

  return (
    <div className="pb-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-indigo-600 px-5 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
        <h1 className="text-white text-xl font-bold">Notificações</h1>
      </div>

      {lista.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-24 text-gray-400 dark:text-gray-500">
          <p className="text-5xl mb-3">🔔</p>
          <p>Nenhuma notificação ainda.</p>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {lista.map(n => (
            <button key={n.id} onClick={() => n.rota && navigate(n.rota)}
              className={`w-full text-left bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 ${n.rota ? "cursor-pointer active:opacity-70" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{n.titulo}</p>
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{fmt(n.recebidaEm)}</span>
              </div>
              {n.corpo && <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{n.corpo}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
