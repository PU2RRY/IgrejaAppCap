import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { celulasApi } from "../api"
import MemberSearch from "../components/MemberSearch"
import type { MemberSearchResult } from "../components/MemberSearch"

interface CelulaResumo { idCelula: number; nome: string; nomeLider?: string; diaSemana?: string; horario?: string; totalMembros: number }
interface MembroCelula { idMembro: number; nome: string; fotoUrl?: string; cargo?: string; ativo: boolean }
interface CelulaDetalhe {
  idCelula: number
  nome: string
  idLider?: number
  nomeLider?: string
  diaSemana?: string
  horario?: string
  cep?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  membros: MembroCelula[]
}

async function buscarCep(cep: string) {
  const digitos = cep.replace(/\D/g, "")
  if (digitos.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`)
    const data = await res.json()
    if (data.erro) return null
    return {
      endereco: data.logradouro || "",
      bairro: data.bairro || "",
      cidade: data.localidade || "",
      uf: data.uf || "",
    }
  } catch {
    return null
  }
}

export default function GerenciarCelulas() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [celulaSelecionada, setCelulaSelecionada] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formNovo, setFormNovo] = useState(false)

  const { data: celulas, isLoading } = useQuery({
    queryKey: ["celulas-gerenciar"],
    queryFn: () => celulasApi.todas().then(r => r.data as CelulaResumo[]),
  })

  const { data: detalhe } = useQuery({
    queryKey: ["celula-detalhe", celulaSelecionada],
    queryFn: () => celulasApi.obter(celulaSelecionada!).then(r => r.data as CelulaDetalhe),
    enabled: !!celulaSelecionada,
  })

  const salvar = useMutation({
    mutationFn: (dados: any) =>
      formNovo ? celulasApi.criar(dados) : celulasApi.atualizar(celulaSelecionada!, dados),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["celulas-gerenciar"] })
      qc.invalidateQueries({ queryKey: ["celula-detalhe", celulaSelecionada] })
      setShowForm(false)
    },
  })

  const excluir = useMutation({
    mutationFn: (id: number) => celulasApi.excluir(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["celulas-gerenciar"] })
      setCelulaSelecionada(null)
    },
  })

  const adicionarMembro = useMutation({
    mutationFn: (m: MemberSearchResult) => celulasApi.adicionarMembro(celulaSelecionada!, m.idMembro),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["celula-detalhe", celulaSelecionada] })
      qc.invalidateQueries({ queryKey: ["celulas-gerenciar"] })
    },
    onError: (e: any) => alert(e.response?.data?.message || "Erro ao adicionar membro."),
  })

  const removerMembro = useMutation({
    mutationFn: (idMembro: number) => celulasApi.removerMembro(celulaSelecionada!, idMembro),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["celula-detalhe", celulaSelecionada] })
      qc.invalidateQueries({ queryKey: ["celulas-gerenciar"] })
    },
    onError: (e: any) => alert(e.response?.data?.message || "Erro ao remover membro."),
  })

  function abrirNova() {
    setFormNovo(true)
    setCelulaSelecionada(null)
    setShowForm(true)
  }

  function abrirEditar(id: number) {
    setFormNovo(false)
    setCelulaSelecionada(id)
    setShowForm(true)
  }

  return (
    <div className="pb-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-indigo-600 px-5 pt-4 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
        <h1 className="text-white text-xl font-bold">Gerenciar Células</h1>
      </div>

      <div className="p-4 space-y-3">
        <button onClick={abrirNova} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">
          + Nova Célula
        </button>

        {isLoading && <p className="text-center text-gray-400 mt-6">Carregando...</p>}

        {celulas?.map(c => (
          <button key={c.idCelula} onClick={() => abrirEditar(c.idCelula)}
            className="w-full text-left bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="font-bold text-gray-900 dark:text-gray-100">{c.nome}</p>
            {c.nomeLider && <p className="text-sm text-gray-500 dark:text-gray-400">Líder: {c.nomeLider}</p>}
            {c.diaSemana && <p className="text-sm text-gray-500 dark:text-gray-400">{c.diaSemana}{c.horario && ` às ${c.horario}`}</p>}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{c.totalMembros} membro(s)</p>
          </button>
        ))}

        {!isLoading && celulas?.length === 0 && (
          <p className="text-center text-gray-400 mt-10">Nenhuma célula criada ainda.</p>
        )}
      </div>

      {showForm && (
        <CelulaFormModal
          novo={formNovo}
          detalhe={detalhe}
          onClose={() => setShowForm(false)}
          onSave={(dados) => salvar.mutate(dados)}
          onExcluir={celulaSelecionada ? () => { if (confirm("Excluir esta célula?")) excluir.mutate(celulaSelecionada) } : undefined}
          onAdicionarMembro={celulaSelecionada ? (m) => adicionarMembro.mutate(m) : undefined}
          onRemoverMembro={celulaSelecionada ? (id) => removerMembro.mutate(id) : undefined}
          saving={salvar.isPending}
        />
      )}
    </div>
  )
}

function CelulaFormModal({ novo, detalhe, onClose, onSave, onExcluir, onAdicionarMembro, onRemoverMembro, saving }: {
  novo: boolean
  detalhe?: CelulaDetalhe
  onClose: () => void
  onSave: (dados: any) => void
  onExcluir?: () => void
  onAdicionarMembro?: (m: MemberSearchResult) => void
  onRemoverMembro?: (idMembro: number) => void
  saving: boolean
}) {
  const [nome, setNome] = useState(detalhe?.nome ?? "")
  const [diaSemana, setDiaSemana] = useState(detalhe?.diaSemana ?? "")
  const [horario, setHorario] = useState(detalhe?.horario ?? "")
  const [cep, setCep] = useState(detalhe?.cep ?? "")
  const [endereco, setEndereco] = useState(detalhe?.endereco ?? "")
  const [numero, setNumero] = useState(detalhe?.numero ?? "")
  const [complemento, setComplemento] = useState(detalhe?.complemento ?? "")
  const [bairro, setBairro] = useState(detalhe?.bairro ?? "")
  const [cidade, setCidade] = useState(detalhe?.cidade ?? "")
  const [uf, setUf] = useState(detalhe?.uf ?? "")
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [lider, setLider] = useState<MemberSearchResult | null>(
    detalhe?.idLider ? { idMembro: detalhe.idLider, nome: detalhe.nomeLider ?? "" } : null
  )

  useEffect(() => {
    if (!detalhe) return
    setNome(detalhe.nome ?? "")
    setDiaSemana(detalhe.diaSemana ?? "")
    setHorario(detalhe.horario ?? "")
    setCep(detalhe.cep ?? "")
    setEndereco(detalhe.endereco ?? "")
    setNumero(detalhe.numero ?? "")
    setComplemento(detalhe.complemento ?? "")
    setBairro(detalhe.bairro ?? "")
    setCidade(detalhe.cidade ?? "")
    setUf(detalhe.uf ?? "")
    setLider(detalhe.idLider ? { idMembro: detalhe.idLider, nome: detalhe.nomeLider ?? "" } : null)
  }, [detalhe])

  async function handleCepBlur() {
    const digitos = cep.replace(/\D/g, "")
    if (digitos.length !== 8) return
    setBuscandoCep(true)
    const resultado = await buscarCep(cep)
    if (resultado) {
      setEndereco(resultado.endereco)
      setBairro(resultado.bairro)
      setCidade(resultado.cidade)
      setUf(resultado.uf)
    }
    setBuscandoCep(false)
  }

  function submit() {
    if (!nome.trim()) return
    onSave({
      nome,
      idLider: lider?.idMembro,
      diaSemana: diaSemana || undefined,
      horario: horario ? horario + ":00" : undefined,
      cep: cep || undefined,
      endereco: endereco || undefined,
      numero: numero || undefined,
      complemento: complemento || undefined,
      bairro: bairro || undefined,
      cidade: cidade || undefined,
      uf: uf || undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-h-[90vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">{novo ? "Nova Célula" : "Editar Célula"}</h2>

        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nome</label>
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Célula Vida Nova"
          className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1 mb-3" />

        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Líder</label>
        {lider ? (
          <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-xl p-3 mt-1 mb-3">
            <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{lider.nome}</span>
            <button onClick={() => setLider(null)} className="text-gray-400">✕</button>
          </div>
        ) : (
          <div className="mt-1 mb-3">
            <MemberSearch placeholder="Buscar líder..." onSelect={setLider} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Dia da semana</label>
            <input value={diaSemana} onChange={e => setDiaSemana(e.target.value)} placeholder="Ex: Sexta"
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Horário</label>
            <input type="time" value={horario} onChange={e => setHorario(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1" />
          </div>
        </div>

        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">CEP</label>
        <div className="flex items-center gap-2 mt-1 mb-3">
          <input value={cep} onChange={e => setCep(e.target.value)} onBlur={handleCepBlur}
            placeholder="00000-000" maxLength={9}
            className="flex-1 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3" />
          {buscandoCep && <span className="text-xs text-gray-400">Buscando...</span>}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="col-span-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Rua</label>
            <input value={endereco} onChange={e => setEndereco(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Número</label>
            <input value={numero} onChange={e => setNumero(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Complemento</label>
            <input value={complemento} onChange={e => setComplemento(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bairro</label>
            <input value={bairro} onChange={e => setBairro(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cidade</label>
            <input value={cidade} onChange={e => setCidade(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">UF</label>
            <input value={uf} onChange={e => setUf(e.target.value)} maxLength={2}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 mt-1" />
          </div>
        </div>

        {!novo && detalhe && (
          <>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Adicionar membro</label>
            <div className="mt-1 mb-3">
              <MemberSearch placeholder="Buscar membro..." onSelect={(m) => onAdicionarMembro?.(m)} />
            </div>

            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">
              Membros ({detalhe.membros.length})
            </p>
            <div className="space-y-2 mb-4">
              {detalhe.membros.map(m => (
                <div key={m.idMembro} className="flex items-center gap-2 border border-gray-100 dark:border-gray-700 rounded-xl p-2">
                  <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{m.nome}</span>
                  <button onClick={() => onRemoverMembro?.(m.idMembro)} className="text-red-500 text-xs font-bold">Remover</button>
                </div>
              ))}
              {detalhe.membros.length === 0 && <p className="text-sm text-gray-400">Nenhum membro ainda.</p>}
            </div>
          </>
        )}

        <div className="flex gap-3 mt-2">
          {onExcluir && (
            <button onClick={onExcluir} className="flex-1 border border-red-300 text-red-600 rounded-xl py-3 font-bold">
              Excluir
            </button>
          )}
          <button onClick={onClose} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-3 font-bold text-gray-600 dark:text-gray-300">
            Cancelar
          </button>
          <button onClick={submit} disabled={saving || !nome.trim()}
            className="flex-1 bg-indigo-600 text-white rounded-xl py-3 font-bold disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  )
}
