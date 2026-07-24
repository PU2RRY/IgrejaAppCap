import { useEffect } from "react"
import { FirebaseMessaging } from "@capacitor-firebase/messaging"
import { Capacitor } from "@capacitor/core"
import { perfilApi } from "../api"
import { addNotificacao } from "./useNotificationStore"

export function usePushNotifications(loggedIn: boolean) {
  useEffect(() => {
    if (!loggedIn || !Capacitor.isNativePlatform()) return

    async function init() {
      console.log("[PUSH] iniciando, plataforma:", Capacitor.getPlatform())
      const permission = await FirebaseMessaging.requestPermissions()
      console.log("[PUSH] permissao:", JSON.stringify(permission))
      if (permission.receive !== "granted") { console.log("[PUSH] permissao negada, abortando"); return }

      // getToken() ja retorna o token FCM (no iOS, converte o token nativo da Apple por baixo dos panos).
      try {
        const { token } = await FirebaseMessaging.getToken()
        console.log("[PUSH] token obtido:", token)
        await perfilApi.atualizarFcm(token)
        console.log("[PUSH] token enviado pro backend com sucesso")
      } catch (err) {
        console.log("[PUSH] ERRO ao obter/enviar token:", JSON.stringify(err))
      }

      await FirebaseMessaging.addListener("tokenReceived", async (event) => {
        try {
          await perfilApi.atualizarFcm(event.token)
        } catch {
          // silently ignore
        }
      })

      await FirebaseMessaging.addListener("notificationReceived", (event) => {
        // App em foreground — salva localmente
        const n: any = event.notification
        addNotificacao(
          n.title ?? n.data?.titulo ?? "Notificação",
          n.body ?? n.data?.corpo ?? "",
          n.data?.rota
        )
        window.dispatchEvent(new Event("notif-update"))
      })

      await FirebaseMessaging.addListener("notificationActionPerformed", (event) => {
        // Usuário tocou na notificação (app em background/fechado)
        const n: any = event.notification
        addNotificacao(
          n.title ?? n.data?.titulo ?? "Notificação",
          n.body ?? n.data?.corpo ?? "",
          n.data?.rota
        )
        window.dispatchEvent(new Event("notif-update"))
        if (n.data?.rota) window.dispatchEvent(new CustomEvent("push-navigate", { detail: n.data.rota }))
      })
    }

    init()

    return () => {
      FirebaseMessaging.removeAllListeners()
    }
  }, [loggedIn])
}
