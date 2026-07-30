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
 * Compara duas versões "x.y.z". Retorna >0 se `a` for mais nova que `b`, <0 se mais velha, 0 se igual.
 * Qualquer valor não numérico em `b` (ex.: o bundle nativo builtin, antes de qualquer OTA já reportar
 * um formato diferente) é tratado como "mais velho que qualquer versão real", nunca bloqueando um OTA
 * genuinamente novo por causa disso.
 */
function compararVersoes(a: string, b: string): number {
  const partsA = a.split(".").map(Number)
  const partsB = b.split(".").map(Number)
  if (partsB.some(isNaN)) return partsA.some(isNaN) ? 0 : 1

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const na = partsA[i] ?? 0
    const nb = partsB[i] ?? 0
    if (na !== nb) return na - nb
  }
  return 0
}

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
    // Nunca aplica downgrade: só atualiza se o OTA for genuinamente mais novo que o bundle atual
    // (nativo ou OTA anterior). Comparação numérica por partes do versionamento "x.y.z".
    if (compararVersoes(manifesto.versao, atual.bundle.version) <= 0) {
      console.log("[OTA] já está na versão mais recente (ou mais nova), nada a fazer.")
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
