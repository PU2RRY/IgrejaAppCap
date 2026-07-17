const KEY = "@app_notificacoes"

export interface NotifLocal {
  id: string
  titulo: string
  corpo: string
  recebidaEm: string
  lida: boolean
  rota?: string
}

export function getNotificacoes(): NotifLocal[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addNotificacao(titulo: string, corpo: string, rota?: string) {
  const lista = getNotificacoes()
  lista.unshift({
    id: crypto.randomUUID(),
    titulo,
    corpo,
    recebidaEm: new Date().toISOString(),
    lida: false,
    rota,
  })
  // Mantém no máximo 50 notificações
  localStorage.setItem(KEY, JSON.stringify(lista.slice(0, 50)))
}

export function marcarTodasLidas() {
  const lista = getNotificacoes().map(n => ({ ...n, lida: true }))
  localStorage.setItem(KEY, JSON.stringify(lista))
}

export function contarNaoLidas(): number {
  return getNotificacoes().filter(n => !n.lida).length
}
