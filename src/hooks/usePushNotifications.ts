import { useEffect } from "react"
import { PushNotifications } from "@capacitor/push-notifications"
import { Capacitor } from "@capacitor/core"
import { perfilApi } from "../api"
import { addNotificacao } from "./useNotificationStore"

export function usePushNotifications(loggedIn: boolean) {
  useEffect(() => {
    if (!loggedIn || !Capacitor.isNativePlatform()) return

    async function init() {
      const permission = await PushNotifications.requestPermissions()
      if (permission.receive !== "granted") return

      await PushNotifications.register()

      await PushNotifications.addListener("registration", async (token) => {
        try {
          await perfilApi.atualizarFcm(token.value)
        } catch {
          // silently ignore
        }
      })

      await PushNotifications.addListener("pushNotificationReceived", (notification) => {
        // App em foreground — salva localmente
        addNotificacao(
          notification.title ?? notification.data?.titulo ?? "Notificação",
          notification.body ?? notification.data?.corpo ?? "",
          notification.data?.rota
        )
        window.dispatchEvent(new Event("notif-update"))
      })

      await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
        // Usuário tocou na notificação (app em background/fechado) — o Android às vezes
        // não repassa title/body no objeto notification, por isso usamos data como reforço.
        const n = action.notification
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
      PushNotifications.removeAllListeners()
    }
  }, [loggedIn])
}
