import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { disponibilidadeApi } from "../api"

interface Indisponibilidade {
  id: number
  diaSemana?: number | null
  data?: string | null
  periodo?: string | null
  motivo?: string | null
}

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
const PERIODOS = ["Manha", "Tarde", "Noite"] as const
const PERIODO_LABEL: Record<string, string> = { Manha: "Manhã", Tarde: "Tarde", Noite: "Noite" }

function fmtData(s: string) {
  const [ano, mes, dia] = s.split("-")
  return `${dia}/${mes}/${ano}`
}

export default function Disponibilidade() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [aba, setAba] = useState<"semana" | "data">("semana")
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["disponibilidade"],
    queryFn: () => disponibilidadeApi.listar().then(r => r.data as Indisponibilidade[]),
  })

  const remover = useMutation({
    mutationFn: (id: number) => disponibilidadeApi.remover(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disponibilidade"] }),
  })

  const recorrentes = data?.filter(i => i.diaSemana !== null && i.diaSemana !== undefined) ?? []
  const pontuais = data?.filter(i => !!i.data) ?? []

  return (
    <div className="pb-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gray-900 dark:bg-black px-5 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
        <h1 className="text-white text-xl font-bold">Minha Disponibilidade</h1>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Marque quando você não pode servir. Você não aparecerá como sugestão em escalas nesses horários.
        </p>

        <button onClick={() => setShowForm(true)}
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">
          + Marcar indisponibilidade
        </button>

        {isLoading && <p className="text-center text-gray-400 dark:text-gray-500 mt-6">Carregando...</p>}

        <div>
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Toda semana</h2>
          <div className="space-y-2">
            {recorrentes.map(i => (
              <div key={i.id} className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {DIAS[i.diaSemana!]}{i.periodo ? ` — ${PERIODO_LABEL[i.periodo]}` : " — dia todo"}
                  </p>
                  {i.motivo && <p className="text-xs text-gray-500 dark:text-gray-400">{i.motivo}</p>}
                </div>
                <button onClick={() => remover.mutate(i.id)} className="text-red-500 text-sm font-bold">Remover</button>
              </div>
            ))}
            {!isLoading && recorrentes.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma indisponibilidade recorrente.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Datas específicas</h2>
          <div className="space-y-2">
            {pontuais.map(i => (
              <div key={i.id} className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {fmtData(i.data!)}{i.periodo ? ` — ${PERIODO_LABEL[i.periodo]}` : " — dia todo"}
                  </p>
                  {i.motivo && <p className="text-xs text-gray-500 dark:text-gray-400">{i.motivo}</p>}
                </div>
                <button onClick={() => remover.mutate(i.id)} className="text-red-500 text-sm font-bold">Remover</button>
              </div>
            ))}
            {!isLoading && pontuais.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma data específica marcada.</p>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <FormModal
          aba={aba}
          setAba={setAba}
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            disponibilidadeApi.criar(data).then(() => {
              qc.invalidateQueries({ queryKey: ["disponibilidade"] })
              setShowForm(false)
            })
          }}
        />
      )}
    </div>
  )
}

function FormModal({ aba, setAba, onClose, onSave }: {
  aba: "semana" | "data"
  setAba: (a: "semana" | "data") => void
  onClose: () => void
  onSave: (data: { diaSemana?: number | null; data?: string | null; periodo?: string | null; motivo?: string | null }) => void
}) {
  const [diaSemana, setDiaSemana] = useState(0)
  const [data, setData] = useState("")
  const [periodo, setPeriodo] = useState<string | null>(null)
  const [motivo, setMotivo] = useState("")

  function submit() {
    if (aba === "data" && !data) return
    onSave({
      diaSemana: aba === "semana" ? diaSemana : null,
      data: aba === "data" ? data : null,
      periodo,
      motivo: motivo || null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full min-h-[55vh] max-h-[90vh] overflow-y-auto p-5">
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Nova indisponibilidade</h2>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setAba("semana")}
            className={`flex-1 py-2 rounded-xl font-bold text-sm ${aba === "semana" ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
            Toda semana
          </button>
          <button onClick={() => setAba("data")}
            className={`flex-1 py-2 rounded-xl font-bold text-sm ${aba === "data" ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
            Data específica
          </button>
        </div>

        {aba === "semana" ? (
          <>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Dia da semana</label>
            <select value={diaSemana} onChange={e => setDiaSemana(Number(e.target.value))}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1 mb-3">
              {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </>
        ) : (
          <>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Data</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1 mb-3" />
          </>
        )}

        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Período</label>
        <div className="flex gap-2 mt-1 mb-3">
          <button onClick={() => setPeriodo(null)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold ${periodo === null ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
            Dia todo
          </button>
          {PERIODOS.map(p => (
            <button key={p} onClick={() => setPeriodo(p)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold ${periodo === p ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
              {PERIODO_LABEL[p]}
            </button>
          ))}
        </div>

        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Motivo (opcional)</label>
        <input value={motivo} onChange={e => setMotivo(e.target.value)}
          placeholder="Ex: Viagem, trabalho..."
          className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1 mb-4" />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-3 font-bold text-gray-600 dark:text-gray-300">
            Cancelar
          </button>
          <button onClick={submit} disabled={aba === "data" && !data}
            className="flex-1 bg-indigo-600 text-white rounded-xl py-3 font-bold disabled:opacity-50">
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
