"use client"

import { useEffect, useState } from "react"
import { XCircle } from "lucide-react"

interface AutoPrintMonitorProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

export default function AutoPrintMonitor({ enabled, onToggle }: AutoPrintMonitorProps) {
  const [printStatus, setPrintStatus] = useState<"idle" | "disabled">("disabled")

  useEffect(() => {
    if (enabled) {
      console.log("[v0] Auto Print Monitor: Sistema desabilitado para evitar conflitos")
      setPrintStatus("disabled")
      onToggle(false) // Force disable to prevent conflicts
    }
  }, [enabled, onToggle])

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-500/20">
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Impressão Automática</h3>
            <p className="text-white/60 text-sm">Sistema desabilitado para evitar conflitos</p>
          </div>
        </div>

        <button
          disabled
          className="px-4 py-2 rounded-xl font-medium bg-gray-500/20 border border-gray-400/50 text-gray-400 cursor-not-allowed"
        >
          Desabilitado
        </button>
      </div>

      <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-xl">
        <p className="text-red-400 text-sm font-medium mb-1">Sistema Unificado:</p>
        <ul className="text-white/70 text-xs space-y-1">
          <li>• Use o painel de notificações para imprimir comandas</li>
          <li>• Sistema unificado evita múltiplas janelas de impressão</li>
          <li>• Formato padronizado em todos os comprovantes</li>
          <li>• Botão "Marcar como Impresso" disponível</li>
        </ul>
      </div>
    </div>
  )
}
