import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { bemEstarApi } from "../api"

const EMOJI_EMOCAO: Record<string, string> = {
  Alegre: "😊",
  Desanimado: "😔",
  Deprimido: "😞",
  Diverso: "🌀",
  Isolado: "🚪",
  Apreensivo: "😟",
  Agradecido: "🙏",
  Alienado: "😶",
  Cuidado: "🤗",
}

export default function BemEstar() {
  const navigate = useNavigate()
  const [emocao, setEmocao] = useState<string | null>(null)
  const [nota, setNota] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState("")

  const { data: emocoes } = useQuery({
    queryKey: ["bem-estar-emocoes"],
    queryFn: () => bemEstarApi.emocoes().then(r => r.data as string[]),
  })

  const { data: status, isLoading: carregandoStatus } = useQuery({
    queryKey: ["bem-estar-status"],
    queryFn: () => bemEstarApi.status().then(r => r.data as { jaRegistrouHoje: boolean }),
  })

  const registrar = useMutation({
    mutationFn: () => bemEstarApi.registrar(emocao!, nota),
    onSuccess: () => setEnviado(true),
    onError: (e: any) => setErro(e.response?.data?.message ?? "Não foi possível registrar. Tente novamente."),
  })

  const jaRegistrouHoje = status?.jaRegistrouHoje

  if (enviado || (!carregandoStatus && jaRegistrouHoje && !enviado)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50 dark:bg-gray-900 text-center">
        <p className="text-6xl mb-4">💜</p>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {enviado ? "Obrigado por compartilhar!" : "Você já registrou hoje"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {enviado
            ? "Sua equipe pastoral está de olho no bem-estar de todos. Volte amanhã!"
            : "Você já nos contou como está se sentindo hoje. Volte amanhã pra um novo registro."}
        </p>
        <button onClick={() => navigate(-1)} className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl">
          Voltar
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-10">
      <div className="bg-gray-900 dark:bg-black px-5 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
        <h1 className="text-white text-xl font-bold">💜 Como você está?</h1>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sua resposta é vista apenas pela liderança da igreja, com carinho e cuidado — nunca por outros membros.
        </p>

        <div className="grid grid-cols-3 gap-3">
          {(emocoes ?? Object.keys(EMOJI_EMOCAO)).map((e) => (
            <button
              key={e}
              onClick={() => setEmocao(e)}
              className={`flex flex-col items-center gap-1 py-4 rounded-xl border-2 transition-colors ${
                emocao === e
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              }`}
            >
              <span className="text-3xl">{EMOJI_EMOCAO[e] ?? "❔"}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{e}</span>
            </button>
          ))}
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Quer contar mais? (opcional)</label>
          <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={4}
            placeholder="Escreva aqui, se quiser compartilhar mais alguma coisa..."
            className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl p-3 mt-2 resize-none" />
        </div>

        {erro && <p className="text-red-500 text-sm">{erro}</p>}

        <button onClick={() => registrar.mutate()} disabled={!emocao || registrar.isPending}
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">
          {registrar.isPending ? "Enviando..." : "Registrar"}
        </button>
      </div>
    </div>
  )
}
