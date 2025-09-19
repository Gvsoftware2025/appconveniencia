"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, Clock, AlertCircle, X } from "lucide-react"

interface Notification {
  id: string
  type: "success" | "info" | "warning" | "error"
  title: string
  message: string
  duration?: number
}

const icons = {
  success: CheckCircle,
  info: Clock,
  warning: AlertCircle,
  error: AlertCircle,
}

const colors = {
  success: "from-emerald-500 to-teal-600",
  info: "from-blue-500 to-indigo-600",
  warning: "from-amber-500 to-orange-600",
  error: "from-red-500 to-rose-600",
}

export function ModernNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const handleNewOrder = (event: CustomEvent) => {
      const order = event.detail
      const notification: Notification = {
        id: `notif-${Date.now()}`,
        type: "success",
        title: "Novo Pedido!",
        message: `${order.comandaName || "Nova Comanda"} - R$ ${order.totalPrice.toFixed(2)}`,
        duration: 5000,
      }

      setNotifications((prev) => [...prev, notification])
    }

    const handleOrderReady = (event: CustomEvent) => {
      const order = event.detail
      const notification: Notification = {
        id: `ready-${Date.now()}`,
        type: "info",
        title: "Pedido Pronto!",
        message: `${order.comandaNome || order.mesaNome} - ${order.itemName} está pronto para entrega`,
        duration: 8000,
      }

      setNotifications((prev) => [...prev, notification])

      if (typeof window !== "undefined") {
        // Play sound
        try {
          const audio = new Audio("/notification-sound.mp3")
          audio.volume = 0.7
          audio.play().catch(console.error)
        } catch (error) {
          console.error("Error playing notification sound:", error)
        }

        // Vibrate if supported
        if ("vibrate" in navigator) {
          navigator.vibrate([300, 100, 300, 100, 300])
        }
      }
    }

    window.addEventListener("newOrder", handleNewOrder as EventListener)
    window.addEventListener("orderReady", handleOrderReady as EventListener)

    return () => {
      window.removeEventListener("newOrder", handleNewOrder as EventListener)
      window.removeEventListener("orderReady", handleOrderReady as EventListener)
    }
  }, [])

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  useEffect(() => {
    notifications.forEach((notification) => {
      if (notification.duration) {
        const timer = setTimeout(() => {
          removeNotification(notification.id)
        }, notification.duration)
        return () => clearTimeout(timer)
      }
    })
  }, [notifications])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = icons[notification.type]
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              className={`
                relative overflow-hidden rounded-2xl p-4 shadow-2xl backdrop-blur-xl
                bg-gradient-to-r ${colors[notification.type]}
                border border-white/20 max-w-sm
              `}
            >
              {notification.type === "info" && notification.title.includes("Pronto") && (
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                  className="absolute inset-0 bg-white/10 rounded-2xl"
                />
              )}

              <div className="flex items-start gap-3 relative z-10">
                <div className="flex-shrink-0">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white">{notification.title}</h4>
                  <p className="text-sm text-white/90 mt-1">{notification.message}</p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Progress bar */}
              {notification.duration && (
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: notification.duration / 1000, ease: "linear" }}
                  className="absolute bottom-0 left-0 h-1 bg-white/30"
                />
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
