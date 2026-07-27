import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { visitantesApi } from "../api"
import { UserPlus } from "lucide-react"

interface Visitante {
  idVisitante: number
  nome: string
  celular?: string
  email?: string
  convertido: boolean
  criadoEm: string
}

function fmtHora(s: string) {
  const d = new Date(s.endsWith("Z") || s.includes("+") ? s : s + "Z")
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export default function VisitantesHoje() {
  const qc = useQueryClient()
  const [novoAberto, setNovoAberto] = useState(false)
  const [nome, setNome] = useState("")
  const [celular, setCelular] = useState("")
  const [email, setEmail] = useState("")
  const [erro, setErro] = useState("")

  const { data, isLoading, error } = useQuery({
    queryKey: ["visitantes-hoje"],
    queryFn: () => visitantesApi.hoje().then(r => r.data as Visitante[]),
  })

  const cadastrar = useMutation({
    mutationFn: () => visitantesApi.cadastrar({ nome: nome.trim(), celular: celular.trim() || null, email: email.trim() || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visitantes-hoje"] })
      setNovoAberto(false)
      setNome(""); setCelular(""); setEmail(""); setErro("")
    },
    onError: (e: any) => setErro(e.response?.data?.message ?? "Não foi possível cadastrar."),
  })

  const visitantes = data ?? []

  return (
    <div className="pb-20 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gray-900 dark:bg-black px-5 pt-4 pb-4 flex items-center justify-between">
        <h1 className="text-white text-xl font-bold flex items-center gap-2"><UserPlus size={20} /> Visitantes de Hoje</h1>
        <button onClick={() => setNovoAberto(true)} className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
          + Novo Visitante
        </button>
      </div>

      <div className="p-4 space-y-3">
        {isLoading && <p className="text-center text-gray-400 mt-10">Carregando...</p>}

        {error && (
          <p className="text-center text-red-500 text-sm mt-10 px-4">
            {(error as any)?.response?.status === 403
              ? "Você não tem permissão para ver essa tela. Fale com a administração."
              : "Não foi possível carregar os visitantes agora. Tente novamente em instantes."}
          </p>
        )}

        {!isLoading && !error && visitantes.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
            <UserPlus size={48} className="mb-3" />
            <p>Nenhum visitante cadastrado hoje ainda.</p>
          </div>
        )}

        {visitantes.map(v => (
          <div key={v.idVisitante} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-gray-900 dark:text-gray-100">{v.nome}</p>
              <span className="text-xs text-gray-400 dark:text-gray-500">{fmtHora(v.criadoEm)}</span>
            </div>
            {v.celular && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{v.celular}</p>}
            {v.email && <p className="text-sm text-gray-500 dark:text-gray-400">{v.email}</p>}
            {v.convertido && (
              <span className="inline-block mt-2 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 px-2 py-0.5 rounded-full">
                Convertido em Membro
              </span>
            )}
          </div>
        ))}
      </div>

      {novoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setNovoAberto(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Novo Visitante</h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nome completo *</label>
                <input value={nome} onChange={e => setNome(e.target.value)} autoFocus
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl px-3 h-11 mt-1"
                  placeholder="Nome do visitante" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Celular</label>
                <input value={celular} onChange={e => setCelular(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl px-3 h-11 mt-1"
                  placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">E-mail</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl px-3 h-11 mt-1"
                  placeholder="email@exemplo.com" />
              </div>

              {erro && <p className="text-red-500 text-sm">{erro}</p>}

              <div className="flex gap-2 pt-1">
                <button onClick={() => setNovoAberto(false)} className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl">
                  Cancelar
                </button>
                <button onClick={() => cadastrar.mutate()} disabled={!nome.trim() || cadastrar.isPending}
                  className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">
                  {cadastrar.isPending ? "Salvando..." : "Cadastrar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
