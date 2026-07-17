import { useEffect, useState } from "react"
import { EVENTO_ATUALIZACAO_DISPONIVEL, aplicarAtualizacaoAgora } from "../services/otaUpdater"

export default function AtualizacaoBanner() {
  const [versao, setVersao] = useState<string | null>(null)
  const [aplicando, setAplicando] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ versao: string }>
      setVersao(custom.detail.versao)
    }
    window.addEventListener(EVENTO_ATUALIZACAO_DISPONIVEL, handler)
    return () => window.removeEventListener(EVENTO_ATUALIZACAO_DISPONIVEL, handler)
  }, [])

  if (!versao) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[999] bg-indigo-600 text-white rounded-xl p-4 shadow-lg flex items-center justify-between gap-3">
      <span className="text-sm">Nova versão disponível ({versao})</span>
      <button
        onClick={() => { setAplicando(true); aplicarAtualizacaoAgora() }}
        disabled={aplicando}
        className="bg-white text-indigo-600 text-sm font-bold px-3 py-1.5 rounded-lg shrink-0 disabled:opacity-60"
      >
        {aplicando ? "Atualizando..." : "Atualizar agora"}
      </button>
    </div>
  )
}
