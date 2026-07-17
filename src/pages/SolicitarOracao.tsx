import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { oracoesApi } from "../api"

interface Tipo { idTipoOracao: number; nome: string }

export default function SolicitarOracao() {
  const navigate = useNavigate()
  const [idTipo, setIdTipo] = useState<number | null>(null)
  const [descricao, setDescricao] = useState("")
  const [enviado, setEnviado] = useState(false)

  const { data: tipos } = useQuery({
    queryKey: ["tipos-oracao"],
    queryFn: () => oracoesApi.tipos().then(r => r.data as Tipo[]),
  })

  const solicitar = useMutation({
    mutationFn: () => oracoesApi.solicitar({ idTipoOracao: idTipo, descricao }),
    onSuccess: () => setEnviado(true),
  })

  if (enviado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50 dark:bg-gray-900 text-center">
        <p className="text-6xl mb-4">🙏</p>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Pedido enviado!</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Estamos orando com você. Deus abençoe!</p>
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
        <h1 className="text-white text-xl font-bold">🙏 Pedido de Oração</h1>
      </div>

      <div className="p-4 space-y-4">
        {tipos && tipos.length > 0 && (
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tipo de pedido</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {tipos.map(t => (
                <button key={t.idTipoOracao} onClick={() => setIdTipo(t.idTipoOracao)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    idTipo === t.idTipoOracao ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                  }`}>
                  {t.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Conte-nos seu pedido</label>
          <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={6}
            placeholder="Escreva aqui o motivo do seu pedido de oração..."
            className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl p-3 mt-2 resize-none" />
        </div>

        <button onClick={() => solicitar.mutate()} disabled={!descricao.trim() || solicitar.isPending}
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">
          {solicitar.isPending ? "Enviando..." : "Enviar Pedido"}
        </button>
      </div>
    </div>
  )
}
