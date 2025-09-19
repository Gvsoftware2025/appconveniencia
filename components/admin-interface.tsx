"use client"

import { useEffect, useState } from "react"
import AutoPrintMonitor from "./auto-print-monitor"
import { motion } from "framer-motion"

interface AdminInterfaceProps {
  onBack: () => void
}

export default function AdminInterface({ onBack }: AdminInterfaceProps) {
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("autoPrintEnabled") === "true"
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("autoPrintEnabled", autoPrintEnabled.toString())
    }
  }, [autoPrintEnabled])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
          {/* Auto-print monitor section */}
          <div className="mb-8">
            <AutoPrintMonitor enabled={autoPrintEnabled} onToggle={setAutoPrintEnabled} />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
