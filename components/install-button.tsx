"use client"

import { useState, useEffect } from "react"
import { Download, Check, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [installStatus, setInstallStatus] = useState<"idle" | "installing" | "success" | "error">("idle")

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
      console.log("[v0] Install prompt available")
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Listen for successful installation
    window.addEventListener("appinstalled", () => {
      console.log("[v0] App installed successfully")
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setInstallStatus("success")
      setTimeout(() => setInstallStatus("idle"), 3000)
    })

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log("[v0] No install prompt available")
      setInstallStatus("error")
      setTimeout(() => setInstallStatus("idle"), 3000)
      return
    }

    setInstallStatus("installing")

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      console.log("[v0] Install prompt outcome:", outcome)

      if (outcome === "accepted") {
        setInstallStatus("success")
        setIsInstalled(true)
      } else {
        setInstallStatus("idle")
      }

      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error("[v0] Install error:", error)
      setInstallStatus("error")
      setTimeout(() => setInstallStatus("idle"), 3000)
    }
  }

  // Don't show button if already installed
  if (isInstalled) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <div className="bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          <span className="text-sm font-medium">App Instalado</span>
        </div>
      </motion.div>
    )
  }

  // Don't show button if install prompt is not available
  if (!showInstallPrompt) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.button
          onClick={handleInstallClick}
          disabled={installStatus === "installing"}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            px-6 py-3 rounded-full shadow-2xl font-bold text-white
            flex items-center gap-3 transition-all duration-300
            ${
              installStatus === "installing"
                ? "bg-blue-500 cursor-wait"
                : installStatus === "success"
                  ? "bg-emerald-500"
                  : installStatus === "error"
                    ? "bg-red-500"
                    : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            }
          `}
        >
          {installStatus === "installing" ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Instalando...</span>
            </>
          ) : installStatus === "success" ? (
            <>
              <Check className="w-5 h-5" />
              <span>Instalado!</span>
            </>
          ) : installStatus === "error" ? (
            <>
              <X className="w-5 h-5" />
              <span>Erro na instalação</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Instalar App</span>
            </>
          )}
        </motion.button>

        {installStatus === "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -top-16 right-0 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-xl text-sm whitespace-nowrap"
          >
            Clique para instalar no seu dispositivo
            <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-2 h-2 bg-slate-800" />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
