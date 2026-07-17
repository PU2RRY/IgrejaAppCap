import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { celulasApi } from "../api"

interface MembroCelula { idMembro: number; nome: string; fotoUrl?: string; cargo?: string; ativo: boolean }
interface Celula {
  idCelula: number
  nome: string
  nomeLider?: string
  nomeAnfitriao?: string
  diaSemana?: string
  horario?: string
  endereco?: string
  numero?: string
  bairro?: string
  cidade?: string
  uf?: string
  membros: MembroCelula[]
}

export default function MinhaCelula() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ["minhas-celulas"],
    queryFn: () => celulasApi.minhas().then(r => r.data as Celula[]),
  })

  const { data: podeGerenciar } = useQuery({
    queryKey: ["posso-gerenciar-celulas"],
    queryFn: () => celulasApi.possoGerenciar().then(r => (r.data as any).pode as boolean),
  })

  return (
    <div className="pb-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gray-900 dark:bg-black px-5 pt-4 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
          <h1 className="text-white text-xl font-bold">Célula</h1>
        </div>
        {podeGerenciar && (
          <button onClick={() => navigate("/celulas/gerenciar")}
            className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            Gerenciar
          </button>
        )}
      </div>

      {isLoading && <p className="text-center text-gray-400 mt-10">Carregando...</p>}

      <div className="p-4 space-y-4">
        {data?.map(c => (
          <div key={c.idCelula} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="font-bold text-lg text-gray-900 dark:text-gray-100">{c.nome}</p>

            <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
              {c.nomeLider && <p>👤 Líder: <span className="font-medium">{c.nomeLider}</span></p>}
              {c.nomeAnfitriao && <p>🏠 Anfitrião: <span className="font-medium">{c.nomeAnfitriao}</span></p>}
              {c.diaSemana && <p>📅 {c.diaSemana}{c.horario && ` às ${c.horario}`}</p>}
              {(c.endereco || c.bairro || c.cidade) && (
                <p>📍 {[c.endereco, c.numero].filter(Boolean).join(", ")}{c.bairro && ` — ${c.bairro}`}{c.cidade && `, ${c.cidade}/${c.uf}`}</p>
              )}
            </div>

            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mt-4 mb-2">
              Membros ({c.membros.length})
            </p>
            <div className="space-y-2">
              {c.membros.map(m => (
                <div key={m.idMembro} className="flex items-center gap-2">
                  {m.fotoUrl ? (
                    <img src={m.fotoUrl} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-sm">
                      {m.nome.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm text-gray-800 dark:text-gray-200">{m.nome}</span>
                  {m.cargo && <span className="text-xs text-gray-400 dark:text-gray-500">({m.cargo})</span>}
                </div>
              ))}
            </div>
          </div>
        ))}

        {!isLoading && !data?.length && (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
            <p className="text-5xl mb-3">🏠</p>
            <p>Você ainda não faz parte de nenhuma célula.</p>
          </div>
        )}
      </div>
    </div>
  )
}
