import { useEffect } from "react"
import { FirebaseMessaging } from "@capacitor-firebase/messaging"
import { Capacitor } from "@capacitor/core"
import { perfilApi } from "../api"
import { addNotificacao } from "./useNotificationStore"

export function usePushNotifications(loggedIn: boolean) {
  useEffect(() => {
    if (!loggedIn || !Capacitor.isNativePlatform()) return

    async function init() {
      const permission = await FirebaseMessaging.requestPermissions()
      if (permission.receive !== "granted") return

      // getToken() ja retorna o token FCM (no iOS, converte o token nativo da Apple por baixo dos panos).
      try {
        const { token } = await FirebaseMessaging.getToken()
        await perfilApi.atualizarFcm(token)
      } catch {
        // silently ignore
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
