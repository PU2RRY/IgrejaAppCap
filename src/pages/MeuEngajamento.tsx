import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { engajamentoApi } from "../api"

interface HistoricoPonto {
  criadoEm: string
  pontos: number
  motivo: string
  tituloEscala?: string | null
}

interface MeuEngajamento {
  totalPontos: number
  posicaoRanking?: number | null
  totalNoRanking: number
  historico: HistoricoPonto[]
}

const MOTIVO_LABEL: Record<string, string> = {
  Presenca: "Presença confirmada",
  AvaliacaoLiderPositiva: "Boa avaliação do líder",
  FeedbackRespondido: "Feedback respondido",
}

function fmt(s: string) {
  const d = new Date(s.endsWith("Z") || s.includes("+") ? s : s + "Z")
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) + " às " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export default function MeuEngajamento() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ["meu-engajamento"],
    queryFn: () => engajamentoApi.meu().then(r => r.data as MeuEngajamento),
  })

  return (
    <div className="pb-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gray-900 dark:bg-black px-5 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
        <h1 className="text-white text-xl font-bold">Meu Engajamento</h1>
      </div>

      {isLoading && <p className="text-center text-gray-400 dark:text-gray-500 mt-10">Carregando...</p>}

      {data && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <p className="text-3xl font-bold text-indigo-600">{data.totalPontos}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">pontos</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <p className="text-3xl font-bold text-indigo-600">
                {data.posicaoRanking ? `${data.posicaoRanking}º` : "—"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {data.totalNoRanking > 0 ? `de ${data.totalNoRanking} no ministério` : "sem ranking ainda"}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Histórico recente</h2>
            <div className="space-y-2">
              {data.historico.map((h, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {MOTIVO_LABEL[h.motivo] ?? h.motivo}{h.tituloEscala ? ` — ${h.tituloEscala}` : ""}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{fmt(h.criadoEm)}</p>
                  </div>
                  <span className="text-sm font-bold text-green-600 shrink-0">+{h.pontos}</span>
                </div>
              ))}
              {data.historico.length === 0 && (
                <p className="text-center text-gray-400 dark:text-gray-500 py-6">Nenhum ponto ainda — sirva numa escala pra começar!</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
