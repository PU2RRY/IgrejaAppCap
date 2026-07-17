import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { oracoesApi } from "../api"

interface MinhaOracao {
  idOracao: number
  nomeTipo?: string
  descricao: string
  status: "Pendente" | "EmOracao" | "Respondida"
  criadoEm: string
}

interface OracaoResponsavel {
  idOracao: number
  nomeSolicitante: string
  email?: string
  celular?: string
  nomeFamilia: string
  nomeTipo?: string
  descricao: string
  status: "Pendente" | "EmOracao" | "Respondida"
  criadoEm: string
}

const STATUS_LABEL: Record<string, string> = { Pendente: "Pendente", EmOracao: "Orando", Respondida: "Respondida" }
const STATUS_COLOR: Record<string, string> = { Pendente: "#D97706", EmOracao: "#2563EB", Respondida: "#16A34A" }

function fmt(s: string) {
  const d = new Date(s.endsWith("Z") || s.includes("+") ? s : s + "Z")
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) + " às " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function whatsappLink(celular: string) {
  const digitos = celular.replace(/\D/g, "")
  const comCodigoPais = digitos.startsWith("55") ? digitos : `55${digitos}`
  return `https://wa.me/${comCodigoPais}`
}

export default function MinhasOracoes() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [aba, setAba] = useState<"meus" | "familia">("meus")
  const [detalhe, setDetalhe] = useState<OracaoResponsavel | null>(null)

  const { data: minhas, isLoading: carregandoMinhas } = useQuery({
    queryKey: ["minhas-oracoes"],
    queryFn: () => oracoesApi.minhas().then(r => r.data as MinhaOracao[]),
  })

  const { data: familia, isLoading: carregandoFamilia } = useQuery({
    queryKey: ["oracoes-para-responsavel"],
    queryFn: () => oracoesApi.paraResponsavel().then(r => r.data as OracaoResponsavel[]),
  })

  const atualizarStatusOracao = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "EmOracao" | "Respondida" }) =>
      oracoesApi.atualizarStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["oracoes-para-responsavel"] }),
  })

  return (
    <div className="pb-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-indigo-600 px-5 pt-4 pb-4 flex items-center justify-between">
        <h1 className="text-white text-xl font-bold">🙏 Orações</h1>
        <button onClick={() => navigate("/oracao")} className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
          + Novo Pedido
        </button>
      </div>

      <div className="flex px-4 pt-3 gap-2">
        <button onClick={() => setAba("meus")}
          className={`flex-1 py-2 rounded-lg text-sm font-bold ${aba === "meus" ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700"}`}>
          Meus Pedidos
        </button>
        <button onClick={() => setAba("familia")}
          className={`flex-1 py-2 rounded-lg text-sm font-bold relative ${aba === "familia" ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700"}`}>
          Pedidos da Família
          {!!familia?.length && aba !== "familia" && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {familia.length}
            </span>
          )}
        </button>
      </div>

      {aba === "meus" && (
        <div className="p-4 space-y-3">
          {carregandoMinhas && <p className="text-center text-gray-400 mt-10">Carregando...</p>}

          {minhas?.map(o => (
            <div key={o.idOracao} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between gap-2">
                {o.nomeTipo && <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase">{o.nomeTipo}</p>}
                <span className="text-xs font-bold px-2 py-0.5 rounded-full ml-auto"
                  style={{ color: STATUS_COLOR[o.status], backgroundColor: STATUS_COLOR[o.status] + "22" }}>
                  {STATUS_LABEL[o.status]}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{o.descricao}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{fmt(o.criadoEm)}</p>
            </div>
          ))}

          {!carregandoMinhas && !minhas?.length && (
            <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
              <p className="text-5xl mb-3">🙏</p>
              <p>Você ainda não fez nenhum pedido de oração.</p>
            </div>
          )}
        </div>
      )}

      {aba === "familia" && (
        <div className="p-4 space-y-3">
          {carregandoFamilia && <p className="text-center text-gray-400 mt-10">Carregando...</p>}

          {familia?.map(o => (
            <button key={o.idOracao} onClick={() => setDetalhe(o)}
              className="w-full text-left bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">{o.nomeSolicitante} — {o.nomeFamilia}</p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ color: STATUS_COLOR[o.status], backgroundColor: STATUS_COLOR[o.status] + "22" }}>
                  {STATUS_LABEL[o.status]}
                </span>
              </div>
              {o.nomeTipo && <p className="text-xs text-gray-400 dark:text-gray-500">{o.nomeTipo}</p>}
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{o.descricao}</p>
              <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => atualizarStatusOracao.mutate({ id: o.idOracao, status: "EmOracao" })}
                  disabled={o.status === "EmOracao" || atualizarStatusOracao.isPending}
                  className={`text-xs font-bold px-3 py-1 rounded-lg border ${
                    o.status === "EmOracao"
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "border-amber-300 text-amber-700 disabled:opacity-50"
                  }`}>
                  {o.status === "EmOracao" ? "✓ Orando" : "Estou orando"}
                </button>
                <button onClick={() => atualizarStatusOracao.mutate({ id: o.idOracao, status: "Respondida" })}
                  disabled={atualizarStatusOracao.isPending}
                  className="text-xs font-bold text-white bg-green-600 px-3 py-1 rounded-lg disabled:opacity-50">
                  Marcar como respondida
                </button>
              </div>
            </button>
          ))}

          {!carregandoFamilia && !familia?.length && (
            <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
              <p className="text-5xl mb-3">👪</p>
              <p>Nenhum pedido pendente da sua família.</p>
            </div>
          )}
        </div>
      )}

      {detalhe && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setDetalhe(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-h-[85vh] overflow-y-auto p-5"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Detalhes do Pedido</h2>
              <button onClick={() => setDetalhe(null)} className="text-gray-400 text-xl leading-none">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Nome</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{detalhe.nomeSolicitante}</p>
              </div>

              {detalhe.email && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">E-mail</p>
                  <p className="text-gray-700 dark:text-gray-300">{detalhe.email}</p>
                </div>
              )}

              {detalhe.celular && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Celular</p>
                  <a href={whatsappLink(detalhe.celular)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-green-600 text-white font-bold px-4 py-2 rounded-xl w-fit">
                    💬 {detalhe.celular}
                  </a>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Família</p>
                <p className="text-gray-700 dark:text-gray-300">{detalhe.nomeFamilia}</p>
              </div>

              {detalhe.nomeTipo && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Tipo</p>
                  <p className="text-gray-700 dark:text-gray-300">{detalhe.nomeTipo}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Descrição do pedido</p>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{detalhe.descricao}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Enviado em</p>
                <p className="text-gray-700 dark:text-gray-300">{fmt(detalhe.criadoEm)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
