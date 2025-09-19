"use client"

import { useEffect, useState } from "react"
import { usePedidos } from "@/contexts/pedidos-context"
import { Printer, CheckCircle, AlertCircle } from "lucide-react"

interface AutoPrintMonitorProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

export default function AutoPrintMonitor({ enabled, onToggle }: AutoPrintMonitorProps) {
  const { comandas, pedidos, getPedidosByComanda } = usePedidos()
  const [lastPrintedComandas, setLastPrintedComandas] = useState<Set<string>>(new Set())
  const [printStatus, setPrintStatus] = useState<"idle" | "printing" | "success" | "error">("idle")
  const [lastPrintTime, setLastPrintTime] = useState<string>("")

  // Monitor for new comandas and auto-print
  useEffect(() => {
    if (!enabled) return

    const checkForNewComandas = () => {
      const comandasAbertas = comandas.filter((c) => c.status === "aberta")

      comandasAbertas.forEach((comanda) => {
        // Check if this comanda has pedidos and hasn't been printed yet
        const pedidosDaComanda = getPedidosByComanda(comanda.id)

        if (pedidosDaComanda.length > 0 && !lastPrintedComandas.has(comanda.id)) {
          console.log("[v0] Nova comanda detectada para impressão:", comanda.numero_comanda)
          handleAutoPrint(comanda, pedidosDaComanda)
        }
      })
    }

    // Check every 5 seconds for new comandas
    const interval = setInterval(checkForNewComandas, 5000)

    // Also check immediately
    checkForNewComandas()

    return () => clearInterval(interval)
  }, [enabled, comandas, lastPrintedComandas, getPedidosByComanda])

  const handleAutoPrint = async (comanda: any, pedidosDaComanda: any[]) => {
    try {
      setPrintStatus("printing")

      // Calculate total
      const total = pedidosDaComanda.reduce((sum, pedido) => {
        return sum + (pedido.produto?.preco || 0) * pedido.quantidade
      }, 0)

      // Create print content
      const printContent = `
        ================================
        CONVENIÊNCIA - PEDIDO
        ================================
        
        Comanda: ${getOriginalComandaName(comanda.numero_comanda)}
        Data: ${new Date().toLocaleString("pt-BR")}
        
        --------------------------------
        ITENS:
        --------------------------------
        ${pedidosDaComanda
          .map(
            (pedido) =>
              `${pedido.quantidade}x ${pedido.produto?.nome || "Produto"}\n` +
              `   R$ ${(pedido.produto?.preco || 0).toFixed(2)} cada\n` +
              `   Subtotal: R$ ${((pedido.produto?.preco || 0) * pedido.quantidade).toFixed(2)}\n` +
              (pedido.observacoes ? `   Obs: ${pedido.observacoes}\n` : "") +
              `\n`,
          )
          .join("")}
        --------------------------------
        TOTAL: R$ ${total.toFixed(2)}
        ================================
        
        Pedido realizado automaticamente
        Sistema APPConveniência
        ================================
      `

      // Print using browser's print API
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Pedido - ${comanda.numero_comanda}</title>
              <style>
                body { 
                  font-family: 'Courier New', monospace; 
                  font-size: 12px; 
                  line-height: 1.2;
                  margin: 0;
                  padding: 10px;
                  white-space: pre-wrap;
                }
                @media print {
                  body { margin: 0; }
                }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `)
        printWindow.document.close()

        // Auto-print after a short delay
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
      }

      // Mark this comanda as printed
      setLastPrintedComandas((prev) => new Set([...prev, comanda.id]))
      setPrintStatus("success")
      setLastPrintTime(new Date().toLocaleString("pt-BR"))

      console.log("[v0] Pedido impresso automaticamente:", comanda.numero_comanda)

      // Reset status after 3 seconds
      setTimeout(() => setPrintStatus("idle"), 3000)
    } catch (error) {
      console.error("[v0] Erro na impressão automática:", error)
      setPrintStatus("error")
      setTimeout(() => setPrintStatus("idle"), 3000)
    }
  }

  const getOriginalComandaName = (numeroComanda: string) => {
    if (!numeroComanda) return "Comanda"
    return numeroComanda.replace(/-\d+$/, "")
  }

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${enabled ? "bg-green-500/20" : "bg-gray-500/20"}`}>
            <Printer className={`w-5 h-5 ${enabled ? "text-green-400" : "text-gray-400"}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Impressão Automática</h3>
            <p className="text-white/60 text-sm">{enabled ? "Monitorando novos pedidos..." : "Sistema desativado"}</p>
          </div>
        </div>

        <button
          onClick={() => onToggle(!enabled)}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            enabled
              ? "bg-green-500/20 border border-green-400/50 text-green-400 hover:bg-green-500/30"
              : "bg-gray-500/20 border border-gray-400/50 text-gray-400 hover:bg-gray-500/30"
          }`}
        >
          {enabled ? "Desativar" : "Ativar"}
        </button>
      </div>

      {enabled && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {printStatus === "printing" && (
              <>
                <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                <span className="text-blue-400 text-sm">Imprimindo...</span>
              </>
            )}
            {printStatus === "success" && (
              <>
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm">Impresso com sucesso!</span>
              </>
            )}
            {printStatus === "error" && (
              <>
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">Erro na impressão</span>
              </>
            )}
            {printStatus === "idle" && lastPrintTime && (
              <span className="text-white/60 text-sm">Última impressão: {lastPrintTime}</span>
            )}
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-400/30 rounded-xl">
            <p className="text-blue-400 text-sm font-medium mb-1">Como funciona:</p>
            <ul className="text-white/70 text-xs space-y-1">
              <li>• Sistema monitora novos pedidos a cada 5 segundos</li>
              <li>• Quando um garçom finaliza um pedido, imprime automaticamente</li>
              <li>• Funciona com qualquer impressora configurada no Windows</li>
              <li>• Não precisa sair do sistema para imprimir</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
