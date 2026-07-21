import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { igrejasApi } from "../api"
import { useFundoApp } from "../hooks/useFundoApp"

interface Igreja { tenantId: string; nomeIgreja: string; cidade: string; uf: string; logoUrl?: string }

export default function BuscarIgreja() {
  const [termo, setTermo] = useState("")
  const [search, setSearch] = useState("")
  const { setTenant } = useAuth()
  const navigate = useNavigate()
  const fundo = useFundoApp()

  const { data, isLoading } = useQuery({
    queryKey: ["igrejas", search],
    queryFn: () => igrejasApi.buscar(search).then(r => r.data as Igreja[]),
    enabled: search.length >= 2,
    retry: 1,
  })

  const selecionar = (ig: Igreja) => {
    setTenant(ig.tenantId, ig.nomeIgreja)
    navigate(`/login?tenantId=${ig.tenantId}&nome=${encodeURIComponent(ig.nomeIgreja)}`)
  }

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col bg-cover bg-center"
      style={fundo ? { backgroundImage: `url(${fundo})` } : undefined}
    >
      <div
        className={`text-white text-center py-10 px-4 ${fundo ? "bg-black/40" : "bg-indigo-600"}`}
        style={fundo ? { textShadow: "0 1px 4px rgba(0,0,0,0.6)" } : undefined}
      >
        <h1 className="text-3xl font-bold">Mix do Reino</h1>
        <p className={`mt-1 ${fundo ? "text-white/90" : "text-indigo-200"}`}>Encontre sua igreja</p>
      </div>

      <div className="p-4 flex gap-2">
        <input
          className="flex-1 border border-gray-300 dark:border-gray-700 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-4 h-11 text-base outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Nome da igreja, cidade..."
          value={termo}
          onChange={e => setTermo(e.target.value)}
          onKeyDown={e => e.key === "Enter" && setSearch(termo)}
        />
        <button
          className="bg-indigo-600 text-white rounded-lg px-4 h-11 font-semibold text-sm"
          onClick={() => setSearch(termo)}
        >
          Buscar
        </button>
      </div>

      <div className="flex-1 px-4 space-y-3 pb-6">
        {isLoading && (
          <p className={`text-center mt-8 ${fundo ? "text-white font-medium" : "text-gray-400 dark:text-gray-500"}`}
             style={fundo ? { textShadow: "0 1px 4px rgba(0,0,0,0.6)" } : undefined}>
            Buscando...
          </p>
        )}
        {data?.map(ig => (
          <button
            key={ig.tenantId}
            onClick={() => selecionar(ig)}
            className={`w-full flex items-center gap-3 border rounded-xl p-3 text-left shadow-sm ${
              fundo
                ? "bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm border-white/40 dark:border-gray-700/50"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            }`}
          >
            {ig.logoUrl
              ? <img src={ig.logoUrl} className="w-12 h-12 rounded-lg object-cover" />
              : <div className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xl">✝</div>
            }
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">{ig.nomeIgreja}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{ig.cidade} — {ig.uf}</p>
            </div>
            <span className="text-indigo-500 text-lg">›</span>
          </button>
        ))}
        {search.length >= 2 && !isLoading && !data?.length && (
          <p className={`text-center mt-8 ${fundo ? "text-white font-medium" : "text-gray-400 dark:text-gray-500"}`}
             style={fundo ? { textShadow: "0 1px 4px rgba(0,0,0,0.6)" } : undefined}>
            Nenhuma igreja encontrada.
          </p>
        )}
      </div>
    </div>
  )
}
