import { CapacitorUpdater } from "@capgo/capacitor-updater"
import { Capacitor } from "@capacitor/core"

// Manifesto público hospedado junto com o site do IgrejaFront (pasta public/app-updates/).
// Cada nova versão do app: sobe o zip do build + atualiza esse latest.json com a versão/URL novas.
const MANIFESTO_URL = "https://mixdoreino.com.br/app-updates/latest.json"

interface ManifestoAtualizacao {
  versao: string
  url: string
}

// Disparado na window quando uma atualização foi baixada e já está pronta pra aplicar.
export const EVENTO_ATUALIZACAO_DISPONIVEL = "ota-atualizacao-disponivel"

/**
 * Avisa a camada nativa que o bundle carregou com sucesso (evita rollback automático do Capacitor Updater),
 * e então verifica se existe uma versão mais nova do app publicada. Se existir, baixa e agenda pra aplicar
 * na próxima vez que o app for pra segundo plano ou reaberto — sem interromper a sessão atual do usuário.
 */
export async function iniciarAtualizador() {
  console.log("[OTA] iniciarAtualizador chamado. Nativo?", Capacitor.isNativePlatform())
  if (!Capacitor.isNativePlatform()) return

  await CapacitorUpdater.notifyAppReady()
  console.log("[OTA] notifyAppReady enviado")

  try {
    const atual = await CapacitorUpdater.current()
    console.log("[OTA] bundle atual:", JSON.stringify(atual))

    const resp = await fetch(MANIFESTO_URL, { cache: "no-store" })
    console.log("[OTA] fetch manifesto status:", resp.status)
    if (!resp.ok) return

    const manifesto: ManifestoAtualizacao = await resp.json()
    console.log("[OTA] manifesto:", JSON.stringify(manifesto))
    if (!manifesto.versao || !manifesto.url) return
    if (manifesto.versao === atual.bundle.version) {
      console.log("[OTA] já está na versão mais recente, nada a fazer.")
      return
    }

    console.log("[OTA] baixando nova versão...")
    const bundle = await CapacitorUpdater.download({ url: manifesto.url, version: manifesto.versao })
    console.log("[OTA] baixado, agendando com next():", JSON.stringify(bundle))
    await CapacitorUpdater.next({ id: bundle.id })
    console.log("[OTA] agendado com sucesso!")

    window.dispatchEvent(new CustomEvent(EVENTO_ATUALIZACAO_DISPONIVEL, { detail: { versao: manifesto.versao } }))
  } catch (err) {
    console.warn("[OTA] Falha ao verificar atualização OTA:", err)
  }
}

/** Aplica imediatamente a atualização já baixada e agendada (recarrega o app). */
export async function aplicarAtualizacaoAgora() {
  await CapacitorUpdater.reload()
}
