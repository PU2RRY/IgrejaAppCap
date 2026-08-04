import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { escalasApi, engajamentoApi } from "../api"

interface MinhaEscala {
  idEscala: number
  idEscalaMembro: number
  nomeMinisterio: string
  titulo: string
  dataEvento: string
  observacoes?: string
  meuStatus: "Pendente" | "Confirmado" | "Recusado"
  minhaFuncao?: string | null
}

interface Troca {
  idTroca: number
  idEscala: number
  tituloEscala: string
  dataEvento: string
  nomeMinisterio: string
  nomeSolicitante: string
  nomeDestino: string
  status: string
  motivo?: string | null
  motivoRejeicao?: string | null
  meuPapel: "Solicitante" | "Substituto" | "Lider"
  souLider: boolean
}

interface PendenteAvaliacao {
  idEscalaMembro: number
  idEscala: number
  tituloEscala: string
  dataEvento: string
  nomeMinisterio: string
}

const TROCA_STATUS_LABEL: Record<string, string> = {
  AguardandoSubstituto: "Aguardando substituto",
  AguardandoLider: "Aguardando aprovação do líder",
  Aprovada: "Aprovada",
  RecusadaPeloSubstituto: "Recusada pelo substituto",
  RejeitadaPeloLider: "Rejeitada pelo líder",
  Cancelada: "Cancelada",
}

const STATUS_COLOR: Record<string, string> = {
  Pendente: "#D97706",
  Confirmado: "#16A34A",
  Recusado: "#DC2626",
}

function fmt(s: string) {
  const d = new Date(s.endsWith("Z") || s.includes("+") ? s : s + "Z")
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) + " às " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export default function MinhasEscalas() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [trocaAlvo, setTrocaAlvo] = useState<MinhaEscala | null>(null)
  const [avaliacaoAlvo, setAvaliacaoAlvo] = useState<PendenteAvaliacao | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["minhas-escalas"],
    queryFn: () => escalasApi.minhas().then(r => r.data as MinhaEscala[]),
  })

  const { data: lideraAlgum } = useQuery({
    queryKey: ["ministerios-que-lidero"],
    queryFn: () => escalasApi.ministeriosQueLidero().then(r => (r.data as any[]).length > 0),
  })

  const { data: trocas } = useQuery({
    queryKey: ["minhas-trocas"],
    queryFn: () => escalasApi.minhasTrocas().then(r => r.data as Troca[]),
  })

  const { data: pendentesAvaliacao } = useQuery({
    queryKey: ["pendentes-avaliacao"],
    queryFn: () => engajamentoApi.pendentesAvaliacao().then(r => r.data as PendenteAvaliacao[]),
  })

  const responder = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "Confirmado" | "Recusado" }) =>
      escalasApi.responder(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["minhas-escalas"] }),
  })

  const solicitarTroca = useMutation({
    mutationFn: (data: { idEscalaMembro: number; idMembroDestino: number; motivo?: string }) =>
      escalasApi.solicitarTroca(data.idEscalaMembro, { idMembroDestino: data.idMembroDestino, motivo: data.motivo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["minhas-trocas"] })
      setTrocaAlvo(null)
    },
  })

  const responderSubstituto = useMutation({
    mutationFn: ({ id, aceitar }: { id: number; aceitar: boolean }) =>
      escalasApi.responderTrocaSubstituto(id, aceitar),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["minhas-trocas"] }),
  })

  const responderLider = useMutation({
    mutationFn: ({ id, aprovar }: { id: number; aprovar: boolean }) =>
      escalasApi.responderTrocaLider(id, aprovar),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["minhas-trocas"] })
      qc.invalidateQueries({ queryKey: ["minhas-escalas"] })
    },
  })

  const removerTroca = useMutation({
    mutationFn: (id: number) => escalasApi.removerTroca(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["minhas-trocas"] }),
  })

  const registrarAvaliacao = useMutation({
    mutationFn: (dados: { idEscalaMembro: number; notaVoluntario: number; comentarioVoluntario?: string }) =>
      engajamentoApi.registrarAvaliacao(dados.idEscalaMembro, dados),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pendentes-avaliacao"] })
      setAvaliacaoAlvo(null)
    },
  })

  const pendentesSubstituto = trocas?.filter(t => t.meuPapel === "Substituto" && t.status === "AguardandoSubstituto") ?? []
  const pendentesLider = trocas?.filter(t => t.souLider && t.status === "AguardandoLider") ?? []
  const minhasSolicitacoes = trocas?.filter(t => t.meuPapel === "Solicitante") ?? []

  return (
    <div className="pb-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gray-900 dark:bg-black px-5 pt-10 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="text-white text-xl shrink-0">←</button>
          <h1 className="text-white text-xl font-bold truncate">Minhas Escalas</h1>
        </div>
        <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-0.5 [&::-webkit-scrollbar]:hidden">
          <button onClick={() => navigate("/escalas/engajamento")}
            className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full shrink-0 whitespace-nowrap">
            Engajamento
          </button>
          <button onClick={() => navigate("/escalas/disponibilidade")}
            className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full shrink-0 whitespace-nowrap">
            Disponibilidade
          </button>
          {lideraAlgum && (
            <button onClick={() => navigate("/escalas/gerenciar")}
              className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full shrink-0 whitespace-nowrap">
              Gerenciar
            </button>
          )}
        </div>
      </div>

      {isLoading && <p className="text-center text-gray-400 dark:text-gray-500 mt-10">Carregando...</p>}

      <div className="p-4 space-y-3">
        {pendentesAvaliacao && pendentesAvaliacao.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">Avalie sua experiência</h2>
            {pendentesAvaliacao.map(p => (
              <div key={p.idEscalaMembro} className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{p.tituloEscala}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{p.nomeMinisterio} · {fmt(p.dataEvento)}</p>
                </div>
                <button onClick={() => setAvaliacaoAlvo(p)}
                  className="text-xs font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-lg shrink-0">
                  Avaliar
                </button>
              </div>
            ))}
          </div>
        )}

        {(pendentesSubstituto.length > 0 || pendentesLider.length > 0 || minhasSolicitacoes.length > 0) && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">Solicitações de troca</h2>

            {pendentesSubstituto.map(t => (
              <div key={t.idTroca} className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  <strong>{t.nomeSolicitante}</strong> pediu pra você assumir <strong>{t.tituloEscala}</strong> ({fmt(t.dataEvento)})
                </p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => responderSubstituto.mutate({ id: t.idTroca, aceitar: false })}
                    className="text-xs font-bold text-red-600 border border-red-200 px-3 py-1.5 rounded-lg">Recusar</button>
                  <button onClick={() => responderSubstituto.mutate({ id: t.idTroca, aceitar: true })}
                    className="text-xs font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-lg">Aceitar</button>
                </div>
              </div>
            ))}

            {pendentesLider.map(t => (
              <div key={t.idTroca} className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  Troca em <strong>{t.tituloEscala}</strong>: <strong>{t.nomeDestino}</strong> aceitou assumir o lugar de <strong>{t.nomeSolicitante}</strong>. Aprovar?
                </p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => responderLider.mutate({ id: t.idTroca, aprovar: false })}
                    className="text-xs font-bold text-red-600 border border-red-200 px-3 py-1.5 rounded-lg">Rejeitar</button>
                  <button onClick={() => responderLider.mutate({ id: t.idTroca, aprovar: true })}
                    className="text-xs font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-lg">Aprovar</button>
                </div>
              </div>
            ))}

            {minhasSolicitacoes.filter(t => t.status !== "Aprovada").map(t => {
              const rejeitada = t.status === "RecusadaPeloSubstituto" || t.status === "RejeitadaPeloLider"
              const escalaDaTroca = data?.find(e => e.idEscala === t.idEscala)
              return (
                <div key={t.idTroca} className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      Troca de <strong>{t.tituloEscala}</strong> com <strong>{t.nomeDestino}</strong>
                    </p>
                    {!rejeitada && (
                      <button onClick={() => removerTroca.mutate(t.idTroca)}
                        className="text-xs font-bold text-red-600 shrink-0">
                        Cancelar
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{TROCA_STATUS_LABEL[t.status] ?? t.status}</p>
                  {t.motivoRejeicao && <p className="text-xs text-gray-500 dark:text-gray-400">Motivo: {t.motivoRejeicao}</p>}
                  {rejeitada && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => removerTroca.mutate(t.idTroca)}
                        className="text-xs font-bold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg">
                        Remover
                      </button>
                      {escalaDaTroca && (
                        <button onClick={() => { removerTroca.mutate(t.idTroca); setTrocaAlvo(escalaDaTroca) }}
                          className="text-xs font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-lg">
                          Escolher outro substituto
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {data?.map(e => (
          <div key={e.idEscala} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-xs text-indigo-600 font-bold uppercase">{e.nomeMinisterio}</p>
            <p className="font-bold text-gray-900 dark:text-gray-100 mt-1">{e.titulo}{e.minhaFuncao ? ` — ${e.minhaFuncao}` : ""}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{fmt(e.dataEvento)}</p>
            {e.observacoes && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{e.observacoes}</p>}

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs font-bold px-2 py-1 rounded-full"
                style={{ color: STATUS_COLOR[e.meuStatus], backgroundColor: STATUS_COLOR[e.meuStatus] + "22" }}>
                {e.meuStatus}
              </span>

              <div className="flex gap-2">
                {e.meuStatus === "Pendente" && (
                  <>
                    <button onClick={() => responder.mutate({ id: e.idEscala, status: "Recusado" })}
                      className="text-xs font-bold text-red-600 border border-red-200 px-3 py-1.5 rounded-lg">
                      Recusar
                    </button>
                    <button onClick={() => responder.mutate({ id: e.idEscala, status: "Confirmado" })}
                      className="text-xs font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-lg">
                      Confirmar
                    </button>
                  </>
                )}
                {e.meuStatus !== "Recusado" && (
                  <button onClick={() => setTrocaAlvo(e)}
                    className="text-xs font-bold text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg">
                    Pedir troca
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {!isLoading && !data?.length && (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400 dark:text-gray-500">
            <p className="text-5xl mb-3">📅</p>
            <p>Você não está escalado no momento.</p>
          </div>
        )}
      </div>

      {trocaAlvo && (
        <TrocaModal
          escala={trocaAlvo}
          onClose={() => setTrocaAlvo(null)}
          onSave={(idMembroDestino, motivo) =>
            solicitarTroca.mutate({ idEscalaMembro: trocaAlvo.idEscalaMembro, idMembroDestino, motivo })}
          saving={solicitarTroca.isPending}
          erro={solicitarTroca.isError ? ((solicitarTroca.error as any)?.response?.data?.message ?? "Erro ao solicitar troca.") : null}
        />
      )}

      {avaliacaoAlvo && (
        <AvaliacaoModal
          pendente={avaliacaoAlvo}
          onClose={() => setAvaliacaoAlvo(null)}
          onSave={(dados) => registrarAvaliacao.mutate({ idEscalaMembro: avaliacaoAlvo.idEscalaMembro, ...dados })}
          saving={registrarAvaliacao.isPending}
        />
      )}
    </div>
  )
}

function AvaliacaoModal({ pendente, onClose, onSave, saving }: {
  pendente: PendenteAvaliacao
  onClose: () => void
  onSave: (dados: { notaVoluntario: number; comentarioVoluntario?: string }) => void
  saving: boolean
}) {
  const [nota, setNota] = useState(0)
  const [comentario, setComentario] = useState("")

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-5">
        <h2 className="text-lg font-bold mb-1 text-gray-900 dark:text-gray-100">Avalie sua experiência</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{pendente.tituloEscala} — {fmt(pendente.dataEvento)}</p>

        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Como foi servir?</label>
        <div className="flex gap-1 mt-1 mb-3">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setNota(n)} className="text-3xl leading-none">
              {n <= nota ? <span className="text-yellow-400">★</span> : <span className="text-gray-300 dark:text-gray-600">☆</span>}
            </button>
          ))}
        </div>

        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Comentário (opcional)</label>
        <input value={comentario} onChange={e => setComentario(e.target.value)}
          placeholder="Conta como foi..."
          className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1 mb-4" />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-3 font-bold text-gray-600 dark:text-gray-300">
            Cancelar
          </button>
          <button onClick={() => onSave({ notaVoluntario: nota, comentarioVoluntario: comentario || undefined })}
            disabled={nota === 0 || saving}
            className="flex-1 bg-indigo-600 text-white rounded-xl py-3 font-bold disabled:opacity-50">
            {saving ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  )
}

function TrocaModal({ escala, onClose, onSave, saving, erro }: {
  escala: MinhaEscala
  onClose: () => void
  onSave: (idMembroDestino: number, motivo?: string) => void
  saving: boolean
  erro: string | null
}) {
  const [selecionado, setSelecionado] = useState<{ idMembro: number; nome: string } | null>(null)
  const [motivo, setMotivo] = useState("")

  const { data: candidatos, isLoading } = useQuery({
    queryKey: ["substitutos", escala.idEscalaMembro],
    queryFn: () => escalasApi.substitutos(escala.idEscalaMembro).then(r => r.data as { idMembro: number; nome: string; fotoUrl?: string | null }[]),
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full min-h-[55vh] max-h-[90vh] overflow-y-auto p-5">
        <h2 className="text-lg font-bold mb-1 text-gray-900 dark:text-gray-100">Pedir troca</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{escala.titulo} — {fmt(escala.dataEvento)}</p>

        {!selecionado ? (
          <>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Escolha um substituto</label>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Membros do mesmo ministério, já disponíveis nessa data.</p>
            {isLoading && <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">Carregando...</p>}
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {(candidatos ?? []).map((m) => (
                <button key={m.idMembro} onClick={() => setSelecionado({ idMembro: m.idMembro, nome: m.nome })}
                  className="w-full text-left p-3 rounded-xl border border-gray-200 dark:border-gray-700 font-medium text-gray-800 dark:text-gray-200">
                  {m.nome}
                </button>
              ))}
              {!isLoading && candidatos?.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">Nenhum colega do ministério disponível nessa data.</p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="p-3 rounded-xl border border-indigo-500 bg-indigo-50 dark:bg-indigo-950 flex items-center justify-between mb-3">
              <span className="font-medium text-gray-800 dark:text-gray-200">{selecionado.nome}</span>
              <button onClick={() => setSelecionado(null)} className="text-xs text-indigo-600 font-bold">Trocar</button>
            </div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Motivo (opcional)</label>
            <input value={motivo} onChange={e => setMotivo(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1 mb-3" />
          </>
        )}

        {erro && <p className="text-sm text-red-600 mb-3">{erro}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-3 font-bold text-gray-600 dark:text-gray-300">
            Cancelar
          </button>
          <button onClick={() => selecionado && onSave(selecionado.idMembro, motivo || undefined)}
            disabled={!selecionado || saving}
            className="flex-1 bg-indigo-600 text-white rounded-xl py-3 font-bold disabled:opacity-50">
            {saving ? "Enviando..." : "Enviar pedido"}
          </button>
        </div>
      </div>
    </div>
  )
}
