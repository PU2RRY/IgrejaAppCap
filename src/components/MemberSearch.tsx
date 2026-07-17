import { useEffect, useRef, useState } from "react"
import { membrosApi } from "../api"

export interface MemberSearchResult {
  idMembro: number
  nome: string
  fotoUrl?: string
}

interface Props {
  placeholder?: string
  onSelect: (m: MemberSearchResult) => void
}

export default function MemberSearch({ placeholder = "Buscar membro pelo nome...", onSelect }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<MemberSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); setOpen(false); return }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await membrosApi.buscar(query)
        const items = (r.data as any)?.items ?? (r.data as any)?.data?.items ?? []
        setResults(items.map((m: any) => ({ idMembro: m.idMembro, nome: m.nome, fotoUrl: m.fotoUrl })))
        setOpen(true)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 300)
  }, [query])

  function handleSelect(m: MemberSearchResult) {
    onSelect(m)
    setQuery("")
    setResults([])
    setOpen(false)
  }

  return (
    <div className="relative">
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3" />
      {loading && <span className="absolute right-3 top-3 text-xs text-gray-400">...</span>}

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden max-h-56 overflow-y-auto">
          {results.map(m => (
            <button key={m.idMembro} type="button" onClick={() => handleSelect(m)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left">
              {m.fotoUrl ? (
                <img src={m.fotoUrl} className="w-7 h-7 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 text-xs font-bold text-gray-500">
                  {m.nome.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="truncate text-gray-800 dark:text-gray-200">{m.nome}</span>
            </button>
          ))}
        </div>
      )}

      {open && !loading && results.length === 0 && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg px-3 py-2 text-sm text-gray-400">
          Nenhum membro encontrado.
        </div>
      )}
    </div>
  )
}
