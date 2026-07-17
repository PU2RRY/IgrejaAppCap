import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { perfilApi } from "../api"
import { contarNaoLidas } from "../hooks/useNotificationStore"

export default function AppHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [spinning, setSpinning] = useState(false)
  const [naoLidas, setNaoLidas] = useState(contarNaoLidas())

  useEffect(() => {
    const atualizar = () => setNaoLidas(contarNaoLidas())
    window.addEventListener("notif-update", atualizar)
    return () => window.removeEventListener("notif-update", atualizar)
  }, [])

  const { data: perfil } = useQuery({
    queryKey: ["meu-perfil"],
    queryFn: () => perfilApi.meuPerfil().then(r => (r.data as any).data ?? r.data as { nome: string; fotoUrl?: string; fotoEditavel: boolean; tipoMembro?: string }),
  })

  const isVisitante = perfil?.tipoMembro === "Visitante"

  function handleRefresh() {
    setSpinning(true)
    qc.invalidateQueries()
    setTimeout(() => setSpinning(false), 700)
  }

  return (
    <div className="bg-gray-900 dark:bg-black px-4 py-2.5 flex items-center justify-between sticky top-0 z-40"
      style={{ paddingTop: "calc(0.625rem + env(safe-area-inset-top))" }}>
      <button onClick={onMenuClick} className="text-white text-2xl leading-none px-1">☰</button>

      <div className="flex items-center gap-4">
        {!isVisitante && (
          <button onClick={() => navigate("/notificacoes")} className="relative text-white">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {naoLidas > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {naoLidas > 9 ? "9+" : naoLidas}
              </span>
            )}
          </button>
        )}

        <button onClick={handleRefresh} className="text-white">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: "transform 0.7s ease", transform: spinning ? "rotate(360deg)" : "rotate(0deg)" }}>
            <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
