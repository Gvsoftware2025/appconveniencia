"use client"
import { usePedidos } from "@/contexts/pedidos-context"
import { ArrowLeft, CheckCircle, Play, Printer, Clock, ChefHat } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface CozinhaInterfaceProps {
  onBack: () => void
}

export default function CozinhaInterface({ onBack }: CozinhaInterfaceProps) {
  const { pedidos, comandas, refreshData, updatePedidoStatus } = usePedidos()
  const { toast } = useToast()
  const [previousPedidosCount, setPreviousPedidosCount] = useState(0)

  useEffect(() => {
    // Initial data refresh when component mounts
    if (refreshData) {
      refreshData()
    }

    // Set up polling every 2 seconds for real-time updates
    const interval = setInterval(() => {
      if (refreshData) {
        refreshData()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [refreshData])

  useEffect(() => {
    if (pedidos && pedidos.length > 0) {
      const currentCount = pedidos.length

      if (previousPedidosCount > 0 && currentCount > previousPedidosCount) {
        const newOrdersCount = currentCount - previousPedidosCount

        toast({
          title: "🔔 Novo Pedido!",
          description: `${newOrdersCount} novo${newOrdersCount > 1 ? "s" : ""} pedido${newOrdersCount > 1 ? "s" : ""} chegou${newOrdersCount > 1 ? "ram" : ""}`,
          duration: 5000,
        })

        // Play notification sound
        if (typeof window !== "undefined") {
          try {
            const audio = new Audio(
              "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT",
            )
            audio.volume = 0.3
            audio.play().catch(() => {
              // Fallback to vibration if audio fails
              if (typeof navigator !== "undefined" && "vibrate" in navigator) {
                navigator.vibrate([200, 100, 200, 100, 200])
              }
            })
          } catch (error) {
            // Fallback to vibration if audio creation fails
            if (typeof navigator !== "undefined" && "vibrate" in navigator) {
              navigator.vibrate([200, 100, 200, 100, 200])
            }
          }
        }
      }

      setPreviousPedidosCount(currentCount)
    }
  }, [pedidos, previousPedidosCount, toast])

  const handleStatusUpdate = async (pedidoId: string, newStatus: "preparando" | "pronto") => {
    try {
      await updatePedidoStatus(pedidoId, newStatus)

      if (newStatus === "pronto") {
        const pedido = pedidos.find((p) => p.id === pedidoId)
        const comanda = comandas?.find((c) => c.id === pedido?.comanda_id)
        const mesaNome = comanda?.numero_comanda || "Mesa"

        toast({
          title: "✅ Pedido Finalizado!",
          description: `${pedido?.produto?.nome} da ${mesaNome} está pronto`,
          duration: 3000,
        })

        if (typeof window !== "undefined") {
          const eventDetail = {
            mesaNome,
            itemName: pedido?.produto?.nome || "Item",
            pedidoId,
            timestamp: new Date().toISOString(),
          }

          const event = new CustomEvent("orderReady", {
            detail: eventDetail,
          })

          console.log("[v0] Kitchen: Dispatching orderReady event:", eventDetail)
          window.dispatchEvent(event)

          // Verify event was dispatched
          setTimeout(() => {
            console.log("[v0] Kitchen: OrderReady event dispatched successfully")
          }, 100)
        }

        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([200, 100, 200])
        }
      }
    } catch (error) {
      console.error("Error updating pedido status:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      })
    }
  }

  const handleStartAllPreparation = async (pedidosDaComanda: any[]) => {
    const pedidosPendentes = pedidosDaComanda.filter((p) => p.status === "pendente")

    try {
      await Promise.all(pedidosPendentes.map((pedido) => updatePedidoStatus(pedido.id, "preparando")))

      toast({
        title: "🔥 Preparo Iniciado!",
        description: `Todos os ${pedidosPendentes.length} itens estão sendo preparados`,
        duration: 3000,
      })
    } catch (error) {
      console.error("Error starting preparation:", error)
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o preparo",
        variant: "destructive",
      })
    }
  }

  const handlePrintReceipt = (mesaNome: string, pedidosDaComanda: any[]) => {
    const total = pedidosDaComanda.reduce((sum, pedido) => {
      return sum + (pedido.produto?.preco || 0) * pedido.quantidade
    }, 0)

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comprovante - ${mesaNome}</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .receipt {
              width: 100%;
              max-width: 420px;
              background: white;
              border-radius: 20px;
              box-shadow: 0 25px 50px rgba(0,0,0,0.15);
              overflow: hidden;
              position: relative;
            }
            .receipt::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 6px;
              background: linear-gradient(90deg, #ff6b6b, #ffa500, #4ecdc4, #45b7d1);
            }
            .header {
              background: linear-gradient(135deg, #2c3e50, #34495e);
              color: white;
              text-align: center;
              padding: 30px 20px;
              position: relative;
            }
            .header::after {
              content: '';
              position: absolute;
              bottom: -10px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 15px solid transparent;
              border-right: 15px solid transparent;
              border-top: 10px solid #34495e;
            }
            .logo {
              font-size: 24px;
              font-weight: 800;
              margin-bottom: 8px;
              letter-spacing: 1px;
            }
            .subtitle {
              font-size: 14px;
              opacity: 0.9;
              font-weight: 500;
            }
            .date {
              font-size: 12px;
              opacity: 0.8;
              margin-top: 5px;
            }
            .content {
              padding: 25px;
            }
            .mesa-info {
              background: linear-gradient(135deg, #667eea, #764ba2);
              color: white;
              padding: 18px;
              border-radius: 15px;
              text-align: center;
              margin-bottom: 25px;
              box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
            }
            .mesa-info h2 {
              font-size: 18px;
              font-weight: 700;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            }
            .items {
              margin-bottom: 25px;
            }
            .item {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding: 15px 0;
              border-bottom: 2px solid #f8f9fa;
              position: relative;
            }
            .item:last-child {
              border-bottom: none;
            }
            .item-info {
              flex: 1;
              padding-right: 15px;
            }
            .item-name {
              font-weight: 700;
              font-size: 16px;
              color: #2c3e50;
              margin-bottom: 6px;
              line-height: 1.3;
            }
            .item-qty {
              background: linear-gradient(135deg, #667eea, #764ba2);
              color: white;
              padding: 4px 10px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 700;
              display: inline-block;
              margin-bottom: 8px;
              box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
            }
            .item-obs {
              background: linear-gradient(135deg, #fff3cd, #ffeaa7);
              border: 2px solid #f39c12;
              padding: 8px 12px;
              border-radius: 10px;
              font-size: 12px;
              color: #d68910;
              margin-top: 8px;
              font-weight: 600;
              box-shadow: 0 2px 4px rgba(243, 156, 18, 0.2);
            }
            .item-status {
              font-size: 10px;
              padding: 4px 8px;
              border-radius: 12px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 5px;
              display: inline-block;
            }
            .status-pendente { 
              background: linear-gradient(135deg, #fff3cd, #ffeaa7); 
              color: #d68910; 
              border: 1px solid #f39c12;
            }
            .status-preparando { 
              background: linear-gradient(135deg, #cce5ff, #a8d8ff); 
              color: #0066cc; 
              border: 1px solid #3498db;
            }
            .status-pronto { 
              background: linear-gradient(135deg, #d4edda, #c3e6cb); 
              color: #155724; 
              border: 1px solid #27ae60;
            }
            .item-price {
              font-weight: 800;
              font-size: 16px;
              color: #27ae60;
              text-align: right;
              min-width: 80px;
            }
            .total-section {
              background: linear-gradient(135deg, #27ae60, #2ecc71);
              color: white;
              padding: 20px;
              border-radius: 15px;
              margin-top: 20px;
              box-shadow: 0 10px 20px rgba(39, 174, 96, 0.3);
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .total-label {
              font-size: 16px;
              font-weight: 700;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .total-value {
              font-size: 22px;
              font-weight: 800;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #7f8c8d;
              font-size: 12px;
              border-top: 2px solid #ecf0f1;
              background: #f8f9fa;
            }
            .footer-message {
              font-weight: 600;
              color: #2c3e50;
              margin-bottom: 5px;
            }
            @media print {
              body { 
                background: white !important; 
                padding: 0 !important; 
                min-height: auto !important;
                display: block !important;
              }
              .receipt { 
                box-shadow: none !important; 
                max-width: none !important;
                width: 100% !important;
                page-break-inside: avoid !important;
                border-radius: 0 !important;
              }
              .header { padding: 20px !important; }
              .content { padding: 20px !important; }
              .item { padding: 10px 0 !important; }
              .total-section { padding: 15px !important; }
              .footer { padding: 15px !important; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="logo">CONVENIÊNCIA RIVES</div>
              <div class="subtitle">Comprovante de Pedidos</div>
              <div class="date">${new Date().toLocaleString("pt-BR")}</div>
            </div>
            
            <div class="content">
              <div class="mesa-info">
                <h2>📍 ${mesaNome}</h2>
              </div>
              
              <div class="items">
                ${pedidosDaComanda
                  .map(
                    (pedido) => `
                  <div class="item">
                    <div class="item-info">
                      <div class="item-name">${pedido.produto?.nome || "Item"}</div>
                      <div class="item-qty">${pedido.quantidade}x unidade</div>
                      ${pedido.observacoes ? `<div class="item-obs">📝 ${pedido.observacoes}</div>` : ""}
                      <div class="item-status status-${pedido.status || "pendente"}">${(pedido.status || "pendente").toUpperCase()}</div>
                    </div>
                    <div class="item-price">R$ ${((pedido.produto?.preco || 0) * pedido.quantidade).toFixed(2)}</div>
                  </div>
                `,
                  )
                  .join("")}
              </div>
              
              <div class="total-section">
                <div class="total-row">
                  <span class="total-label">💰 TOTAL GERAL</span>
                  <span class="total-value">R$ ${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-message">Obrigado pela preferência! 🙏</div>
              <div>Gerado em ${new Date().toLocaleString("pt-BR")}</div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1000);
              }, 500);
            }
          </script>
        </body>
      </html>
    `

    const blob = new Blob([printContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const printWindow = window.open(url, "_blank", "width=800,height=600")

    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          URL.revokeObjectURL(url)
        }, 1000)
      }
    }
  }

  const handleMarkAllReady = async (pedidosDaComanda: any[]) => {
    const pedidosPreparando = pedidosDaComanda.filter((p) => p.status === "preparando")

    try {
      await Promise.all(pedidosPreparando.map((pedido) => handleStatusUpdate(pedido.id, "pronto")))

      toast({
        title: "✅ Comanda Finalizada!",
        description: `Todos os ${pedidosPreparando.length} itens estão prontos para entrega`,
        duration: 3000,
      })
    } catch (error) {
      console.error("Error marking items as ready:", error)
      toast({
        title: "Erro",
        description: "Não foi possível finalizar os itens",
        variant: "destructive",
      })
    }
  }

  const pedidosAgrupadosPorComanda = (pedidos || []).reduce(
    (acc, pedido) => {
      const comanda = comandas?.find((c) => c.id === pedido.comanda_id)

      if (comanda) {
        const comandaKey = comanda.numero_comanda || `Comanda ${comanda.id.slice(-4)}`

        if (!acc[comandaKey]) {
          acc[comandaKey] = []
        }
        acc[comandaKey].push(pedido)
      }

      return acc
    },
    {} as Record<string, typeof pedidos>,
  )

  const sortedComandas = Object.entries(pedidosAgrupadosPorComanda).sort(([, pedidosA], [, pedidosB]) => {
    const hasPendingA = pedidosA.some((p) => p.status === "pendente")
    const hasPendingB = pedidosB.some((p) => p.status === "pendente")
    const hasPreparingA = pedidosA.some((p) => p.status === "preparando")
    const hasPreparingB = pedidosB.some((p) => p.status === "preparando")

    if (hasPendingA && !hasPendingB) return -1
    if (!hasPendingA && hasPendingB) return 1
    if (hasPreparingA && !hasPreparingB) return -1
    if (!hasPreparingA && hasPreparingB) return 1
    return 0
  })

  if (!pedidos) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando pedidos...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/restaurant-interior.png" alt="Restaurant Background" fill className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/80 to-slate-900/80" />
      </div>

      <div className="relative z-10">
        <header className="flex items-center justify-between p-6 backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-2xl">
          <button
            onClick={onBack}
            className="flex items-center gap-3 px-6 py-3 backdrop-blur-xl bg-slate-700/60 border border-white/20 rounded-2xl text-white hover:bg-slate-700/80 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </button>

          <div className="flex items-center gap-4">
            <Image
              src="/logo-conveniencia.png"
              alt="Conveniência"
              width={140}
              height={45}
              className="hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="flex items-center gap-3 px-6 py-3 backdrop-blur-xl bg-orange-500/20 border border-orange-400/30 rounded-2xl shadow-lg">
            <ChefHat className="w-5 h-5 text-orange-400" />
            <span className="text-orange-400 font-semibold">Interface da Cozinha</span>
          </div>
        </header>

        <div className="p-6 border-b border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="backdrop-blur-xl bg-yellow-500/10 border border-yellow-400/20 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {
                  Object.keys(pedidosAgrupadosPorComanda).filter((comanda) =>
                    pedidosAgrupadosPorComanda[comanda].some((p) => p.status === "pendente"),
                  ).length
                }
              </div>
              <div className="text-yellow-300 text-sm font-medium">Comandas Pendentes</div>
            </div>
            <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-400/20 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {pedidos.filter((p) => p.status === "preparando").length}
              </div>
              <div className="text-blue-300 text-sm font-medium">Em Preparo</div>
            </div>
            <div className="backdrop-blur-xl bg-green-500/10 border border-green-400/20 rounded-2xl p-4">
              <div className="text-2xl font-bold text-green-400 mb-2">
                {
                  Object.keys(pedidosAgrupadosPorComanda).filter((comanda) =>
                    pedidosAgrupadosPorComanda[comanda].every((p) => p.status === "pronto"),
                  ).length
                }
              </div>
              <div className="text-green-300 text-sm font-medium mb-2">Comandas Prontas</div>
              {Object.keys(pedidosAgrupadosPorComanda)
                .filter((comanda) => pedidosAgrupadosPorComanda[comanda].every((p) => p.status === "pronto"))
                .slice(0, 3)
                .map((comanda) => (
                  <div key={comanda} className="text-green-400 text-xs bg-green-500/20 rounded px-2 py-1 mb-1">
                    {comanda.replace(/-\d+$/, "")}
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedComandas.map(([comandaNome, pedidosDaComanda]) => {
              const hasPendingItems = pedidosDaComanda.some((p) => p.status === "pendente")
              const hasPreparingItems = pedidosDaComanda.some((p) => p.status === "preparando")
              const allItemsReady = pedidosDaComanda.every((p) => p.status === "pronto")
              const displayName = comandaNome.replace(/-\d+$/, "")

              return (
                <div
                  key={comandaNome}
                  className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full animate-pulse ${
                          allItemsReady ? "bg-green-400" : hasPendingItems ? "bg-yellow-400" : "bg-blue-400"
                        }`}
                      ></div>
                      {displayName}
                    </h3>
                    <button
                      onClick={() => handlePrintReceipt(displayName, pedidosDaComanda)}
                      className="flex items-center gap-2 px-4 py-2 backdrop-blur-xl bg-slate-700/60 border border-white/20 rounded-xl text-white hover:bg-slate-700/80 transition-all duration-300"
                      title="Imprimir Comprovante"
                    >
                      <Printer className="w-4 h-4" />
                      <span className="text-sm font-medium">Imprimir</span>
                    </button>
                  </div>

                  {hasPendingItems && (
                    <div className="mb-6">
                      {console.log(
                        `[v0] Comanda ${comandaNome} - hasPendingItems: ${hasPendingItems}, pedidos:`,
                        pedidosDaComanda.map((p) => ({ nome: p.produto?.nome, status: p.status })),
                      )}
                      <button
                        onClick={() => handleStartAllPreparation(pedidosDaComanda)}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border border-blue-400/30 rounded-2xl text-white font-bold text-lg transition-all duration-200 hover:scale-105 shadow-lg"
                      >
                        <Play className="w-5 h-5" />🔥 Iniciar Preparo da Comanda
                      </button>
                    </div>
                  )}

                  {hasPreparingItems && !hasPendingItems && (
                    <div className="mb-6">
                      {console.log(
                        `[v0] Comanda ${comandaNome} - hasPreparingItems: ${hasPreparingItems}, hasPendingItems: ${hasPendingItems}, pedidos:`,
                        pedidosDaComanda.map((p) => ({ nome: p.produto?.nome, status: p.status })),
                      )}
                      <button
                        onClick={() => handleMarkAllReady(pedidosDaComanda)}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border border-green-400/30 rounded-2xl text-white font-bold text-lg transition-all duration-200 hover:scale-105 shadow-lg"
                      >
                        <CheckCircle className="w-5 h-5" />✅ Pedido Pronto
                      </button>
                    </div>
                  )}

                  <div className="space-y-4">
                    {pedidosDaComanda.map((pedido) => (
                      <div
                        key={pedido.id}
                        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all duration-300"
                      >
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-white font-semibold text-lg flex items-center gap-2">
                                <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg text-sm font-bold">
                                  {pedido.quantidade}x
                                </span>
                                {pedido.produto?.nome || "Produto não encontrado"}
                              </p>
                              {pedido.produto?.tempo_preparo && (
                                <p className="text-white/60 text-sm flex items-center gap-1 mt-1">
                                  <Clock className="w-3 h-3" />
                                  Tempo: {pedido.produto.tempo_preparo}
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wide ${
                                pedido.status === "pendente"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-400/30"
                                  : pedido.status === "preparando"
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-400/30"
                                    : pedido.status === "pronto"
                                      ? "bg-green-500/20 text-green-400 border border-green-400/30"
                                      : "bg-gray-500/20 text-gray-400 border border-gray-400/30"
                              }`}
                            >
                              {pedido.status === "pendente"
                                ? "Pendente"
                                : pedido.status === "preparando"
                                  ? "Preparando"
                                  : pedido.status === "pronto"
                                    ? "Pronto"
                                    : pedido.status}
                            </span>
                          </div>

                          {pedido.observacoes && (
                            <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-3">
                              <p className="text-amber-300 text-sm font-medium flex items-start gap-2">
                                <span className="text-amber-400 font-bold">📝 Observações:</span>
                                {pedido.observacoes}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <p className="text-white/40 text-xs font-mono">#{pedido.id.slice(-8)}</p>
                            <p className="text-emerald-400 font-bold">
                              R$ {((pedido.produto?.preco || 0) * pedido.quantidade).toFixed(2)}
                            </p>
                          </div>

                          {pedido.status === "pronto" && (
                            <div className="flex items-center gap-2 px-4 py-3 bg-green-500/20 border border-green-400/30 rounded-xl text-green-400 text-sm font-semibold">
                              <CheckCircle className="w-4 h-4" />
                              Aguardando Entrega
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {sortedComandas.length === 0 && (
              <div className="col-span-full text-center py-20">
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12">
                  <ChefHat className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60 text-2xl font-semibold mb-2">Nenhum pedido no momento</p>
                  <p className="text-white/40 text-lg">Os pedidos aparecerão aqui automaticamente</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
