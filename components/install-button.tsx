"use client"

import { useState, useEffect } from "react"
import { Download, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [installStatus, setInstallStatus] = useState<"idle" | "installing">("idle")

  useEffect(() => {
    console.log("[v0] InstallButton: Component mounted")

    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)

    if (isIOSDevice) {
      console.log("[v0] InstallButton: iOS device detected, hiding button (use Safari share menu)")
      return
    }

    if (window.matchMedia("(display-mode: standalone)").matches) {
      console.log("[v0] InstallButton: App already installed, hiding button")
      setIsInstalled(true)
      return
    }

    console.log("[v0] InstallButton: Waiting for beforeinstallprompt event")

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("[v0] InstallButton: beforeinstallprompt event fired")
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    window.addEventListener("appinstalled", () => {
      console.log("[v0] InstallButton: App installed successfully, hiding button")
      setIsInstalled(true)
      setShowInstallPrompt(false)
    })

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    console.log("[v0] InstallButton: Install button clicked")

    if (!deferredPrompt) {
      console.log("[v0] InstallButton: No install prompt available")
      return
    }

    setInstallStatus("installing")
    console.log("[v0] InstallButton: Showing install prompt")

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      console.log("[v0] InstallButton: Install prompt outcome:", outcome)

      if (outcome === "accepted") {
        setIsInstalled(true)
        setShowInstallPrompt(false)
      } else {
        setInstallStatus("idle")
      }

      setDeferredPrompt(null)
    } catch (error) {
      console.error("[v0] InstallButton: Install error:", error)
      setInstallStatus("idle")
    }
  }

  if (isInstalled || !showInstallPrompt) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <motion.button
          onClick={handleInstallClick}
          disabled={installStatus === "installing"}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={`
            relative px-8 py-4 rounded-2xl font-bold text-white text-lg
            flex items-center gap-3 transition-all duration-300
            shadow-2xl hover:shadow-orange-500/50
            ${
              installStatus === "installing"
                ? "bg-gradient-to-r from-blue-500 to-blue-600 cursor-wait"
                : "bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 bg-size-200 animate-gradient"
            }
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl blur-xl opacity-50 -z-10" />

          {installStatus === "installing" ? (
            <>
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              <span>Instalando...</span>
            </>
          ) : (
            <>
              <Download className="w-6 h-6" />
              <span>Instalar App</span>
              <Sparkles className="w-5 h-5 ml-1" />
            </>
          )}
        </motion.button>

        {installStatus === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute -top-20 right-0 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm whitespace-nowrap border border-slate-700"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>Instale para acesso rápido</span>
            </div>
            <div className="absolute bottom-0 right-8 transform translate-y-1/2 rotate-45 w-3 h-3 bg-slate-900 border-r border-b border-slate-700" />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
