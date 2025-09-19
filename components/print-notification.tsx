"use client"

import { useState, useEffect } from "react"
import { Printer, X, Clock, CheckCircle2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePrintStatus } from "@/hooks/use-print-status"
import { usePedidos } from "@/contexts/pedidos-context"

interface PrintNotificationProps {
  comandas: any[]
  onPrintComanda?: (comanda: any) => void
}

export function PrintNotification({ comandas, onPrintComanda }: PrintNotificationProps) {
  const { isPrinted, markAsPrinted } = usePrintStatus()
  const { pedidos, products } = usePedidos()
  const [isVisible, setIsVisible] = useState(false)
  const [hasNewComandas, setHasNewComandas] = useState(false)

  const unprintedComandas = comandas.filter((comanda) => !isPrinted(comanda.id))
  const unprintedCount = unprintedComandas.length

  useEffect(() => {
    const handleComandaPrinted = (event: CustomEvent) => {
      console.log("[v0] Print notification: Comanda marked as printed:", event.detail.comandaId)
      setHasNewComandas(false)
    }

    window.addEventListener("comandaPrinted", handleComandaPrinted as EventListener)
    return () => {
      window.removeEventListener("comandaPrinted", handleComandaPrinted as EventListener)
    }
  }, [])

  useEffect(() => {
    console.log("[v0] Print notification: Unprinted count:", unprintedCount)
    if (unprintedCount > 0) {
      setHasNewComandas(true)
      setIsVisible(true)

      const timer = setTimeout(() => {
        setHasNewComandas(false)
      }, 15000)

      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
      setHasNewComandas(false)
    }
  }, [unprintedCount])

  const getPrintedComandas = (): Set<string> => {
    if (typeof window === "undefined") return new Set()
    try {
      const stored = localStorage.getItem("printed_comandas")
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  }

  const savePrintedComanda = (comandaId: string) => {
    if (typeof window === "undefined") return
    try {
      const printed = getPrintedComandas()
      printed.add(comandaId)
      localStorage.setItem("printed_comandas", JSON.stringify([...printed]))
      console.log("[v0] Print notification: Comanda marcada como impressa:", comandaId)

      window.dispatchEvent(
        new CustomEvent("comandaPrinted", {
          detail: { comandaId },
        }),
      )
    } catch (error) {
      console.error("[v0] Erro ao salvar comanda impressa:", error)
    }
  }

  const createStandardizedReceipt = (nomeComanda: string, pedidosParaImprimir: any[], comandaId: string) => {
    const total = pedidosParaImprimir.reduce((sum, pedido) => {
      return sum + pedido.produto.preco * pedido.quantidade
    }, 0)

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Comprovante - ${nomeComanda}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
            font-size: 14px; 
            line-height: 1.6; 
            margin: 0; 
            padding: 20px;
            max-width: 380px;
            background: #ffffff;
            color: #1f2937;
            -webkit-font-smoothing: antialiased;
          }
          .receipt-container {
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 24px;
            background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #6366f1; 
            padding-bottom: 16px; 
            margin-bottom: 24px; 
          }
          .logo {
            font-size: 24px;
            font-weight: 900;
            color: #6366f1;
            letter-spacing: 1.5px;
            margin-bottom: 6px;
            text-transform: uppercase;
          }
          .comanda-info {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 24px;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3);
          }
          .datetime {
            font-size: 12px;
            color: #6b7280;
            text-align: center;
            margin-bottom: 24px;
            font-weight: 500;
          }
          .items-section {
            margin-bottom: 24px;
          }
          .section-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .section-title::before {
            content: "🍽️";
            font-size: 16px;
          }
          .item { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            margin-bottom: 16px; 
            padding: 14px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #6366f1;
            transition: all 0.2s ease;
          }
          .item-details {
            flex: 1;
          }
          .item-name {
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 4px;
            font-size: 15px;
          }
          .item-qty {
            font-size: 12px;
            color: #6b7280;
            font-weight: 600;
            background: #e0e7ff;
            padding: 2px 8px;
            border-radius: 12px;
            display: inline-block;
          }
          .item-obs {
            font-size: 11px;
            color: #dc2626;
            font-style: italic;
            margin-top: 6px;
            padding: 6px 10px;
            background: #fef2f2;
            border-radius: 6px;
            border: 1px solid #fecaca;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .item-obs::before {
            content: "📝";
            font-size: 12px;
          }
          .item-price {
            font-weight: 800;
            color: #059669;
            font-size: 15px;
            background: #ecfdf5;
            padding: 6px 12px;
            border-radius: 6px;
            border: 1px solid #a7f3d0;
          }
          .total-section { 
            border-top: 3px solid #e5e7eb; 
            padding-top: 20px; 
            margin-top: 24px; 
          }
          .subtotal {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 13px;
            color: #6b7280;
            font-weight: 600;
          }
          .total { 
            display: flex;
            justify-content: space-between;
            font-weight: 900; 
            font-size: 18px;
            color: #1f2937;
            padding: 16px;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: 8px;
            border: 2px solid #0ea5e9;
            box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.2);
          }
          .footer { 
            text-align: center; 
            margin-top: 28px; 
            padding-top: 20px;
            border-top: 2px dashed #d1d5db;
          }
          .thank-you {
            font-size: 16px;
            font-weight: 700;
            color: #6366f1;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          .thank-you::before {
            content: "🙏";
            font-size: 18px;
          }
          .system-info {
            font-size: 11px;
            color: #9ca3af;
            line-height: 1.4;
          }
          @media print {
            body { 
              margin: 0; 
              padding: 15px; 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .receipt-container {
              border: 1px solid #e5e7eb;
              padding: 20px;
              background: white;
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div class="logo">Conveniência Rives</div>
          </div>
          
          <div class="comanda-info">
            Comanda: ${nomeComanda}
          </div>
          
          <div class="datetime">
            📅 ${new Date().toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          
          <div class="items-section">
            <div class="section-title">Itens do Pedido</div>
            ${pedidosParaImprimir
              .map(
                (pedido) => `
              <div class="item">
                <div class="item-details">
                  <div class="item-name">${pedido.produto.nome}</div>
                  <div class="item-qty">${pedido.quantidade}x unidade</div>
                  ${pedido.observacoes ? `<div class="item-obs">${pedido.observacoes}</div>` : ""}
                </div>
                <div class="item-price">R$ ${(pedido.produto.preco * pedido.quantidade).toFixed(2)}</div>
              </div>
            `,
              )
              .join("")}
          </div>
          
          <div class="total-section">
            <div class="subtotal">
              <span>Subtotal:</span>
              <span>R$ ${total.toFixed(2)}</span>
            </div>
            <div class="total">
              <span>💰 TOTAL GERAL</span>
              <span>R$ ${total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            <div class="thank-you">Obrigado pela preferência!</div>
            <div class="system-info">
              ${new Date().toLocaleString("pt-BR")}
            </div>
          </div>
        </div>
        
        <script>
          console.log("[v0] Manual print: Página carregada");
          
          function attemptPrint() {
            try {
              console.log("[v0] Manual print: Tentando imprimir");
              window.print();
              
              setTimeout(function() {
                console.log("[v0] Manual print: Fechando janela");
                window.close();
              }, 2000);
            } catch (error) {
              console.error("[v0] Manual print: Erro na impressão:", error);
              setTimeout(function() {
                window.close();
              }, 1000);
            }
          }
          
          window.onload = function() {
            setTimeout(attemptPrint, 300);
          }
          
          document.addEventListener('DOMContentLoaded', function() {
            setTimeout(attemptPrint, 500);
          });
          
          window.onbeforeprint = function() {
            console.log("[v0] Manual print: Preparando para imprimir");
          }
          
          window.onafterprint = function() {
            console.log("[v0] Manual print: Impressão concluída");
            setTimeout(function() {
              window.close();
            }, 1000);
          }
        </script>
      </body>
      </html>
    `
  }

  const handleManualPrintReceipt = (nomeComanda: string, pedidosParaImprimir: any[], comandaId: string) => {
    console.log("[v0] Print notification: Iniciando impressão manual para:", nomeComanda)

    if (!pedidosParaImprimir || pedidosParaImprimir.length === 0) {
      console.log("[v0] Print notification: Nenhum pedido para imprimir")
      return
    }

    try {
      const receiptHTML = createStandardizedReceipt(nomeComanda, pedidosParaImprimir, comandaId)
      const windowFeatures =
        "width=450,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no"

      const printWindow = window.open("", "_blank", windowFeatures)

      if (printWindow && !printWindow.closed) {
        printWindow.document.write(receiptHTML)
        printWindow.document.close()
        printWindow.focus()
        console.log("[v0] Print notification: Janela de impressão aberta com sucesso")

        savePrintedComanda(comandaId)

        setTimeout(() => {
          try {
            printWindow.print()
          } catch (e) {
            console.log("[v0] Failed to trigger print:", e)
          }
        }, 1000)
      } else {
        alert(
          `⚠️ POPUP BLOQUEADO!\n\nO navegador bloqueou a janela de impressão.\n\nComanda: ${nomeComanda}\n\nPor favor, permita popups para este site.`,
        )
      }
    } catch (error) {
      console.error("[v0] Print notification: Erro na impressão:", error)
      alert(`❌ ERRO NA IMPRESSÃO!\n\nComanda: ${nomeComanda}\n\nErro: ${error.message}`)
    }
  }

  const handlePrintComanda = (comanda: any) => {
    const pedidosComanda = pedidos.filter((p) => p.comanda_id === comanda.id)

    if (pedidosComanda.length > 0) {
      const pedidosParaImprimir = pedidosComanda.map((pedido) => {
        const produto = products.find((p) => p.id === pedido.produto_id)
        return {
          ...pedido,
          produto: produto || {
            id: pedido.produto_id,
            nome: "Produto não encontrado",
            preco: 0,
            categoria_id: "",
          },
        }
      })

      handleManualPrintReceipt(comanda.numero_comanda, pedidosParaImprimir, comanda.id)
    }

    if (onPrintComanda) {
      onPrintComanda(comanda)
    }
    markAsPrinted(comanda.id)
  }

  const handleMarkAsPrinted = (comanda: any) => {
    markAsPrinted(comanda.id)
    savePrintedComanda(comanda.id)
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setHasNewComandas(false)
  }

  if (unprintedCount === 0) return null

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-500 ease-in-out transform ${
        isVisible ? "translate-x-0 opacity-100 scale-100" : "translate-x-full opacity-0 scale-95"
      }`}
    >
      <div
        className={`bg-gradient-to-br from-white to-gray-50 border-2 rounded-xl shadow-2xl p-5 min-w-[350px] max-w-[400px] ${
          hasNewComandas ? "border-orange-400 shadow-orange-200/50 animate-pulse" : "border-gray-200 shadow-gray-200/50"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`relative p-2 rounded-full ${hasNewComandas ? "bg-orange-100" : "bg-blue-100"}`}>
              <Printer className={`h-5 w-5 ${hasNewComandas ? "text-orange-600" : "text-blue-600"}`} />
              {hasNewComandas && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <span className="font-bold text-gray-800 text-sm">Pedidos para impressão</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="destructive"
                  className={`${hasNewComandas ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-500 hover:bg-blue-600"} text-white font-semibold`}
                >
                  {unprintedCount} {unprintedCount === 1 ? "nova" : "novas"}
                </Badge>
                {hasNewComandas && (
                  <span className="text-xs text-orange-600 font-medium animate-pulse">🔥 Recém chegados!</span>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
          >
            <X className="h-4 w-4 text-gray-500" />
          </Button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
          {unprintedComandas.map((comanda, index) => {
            const isAlreadyPrinted = getPrintedComandas().has(comanda.id)

            return (
              <div
                key={comanda.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  isAlreadyPrinted
                    ? "bg-gradient-to-r from-green-50 to-green-100 border-green-200"
                    : index === 0 && hasNewComandas
                      ? "ring-2 ring-orange-200 bg-gradient-to-r from-orange-50 to-white border-orange-200"
                      : "bg-gradient-to-r from-gray-50 to-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <Clock className="h-4 w-4 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500 font-mono">
                      {new Date(comanda.created_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{comanda.numero_comanda}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      💰 R$ {comanda.total?.toFixed(2) || "0.00"}
                      {index === 0 && hasNewComandas && !isAlreadyPrinted && (
                        <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                          NOVA
                        </span>
                      )}
                      {isAlreadyPrinted && (
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          IMPRESSO
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkAsPrinted(comanda)}
                    className={`${
                      isAlreadyPrinted
                        ? "bg-green-100 border-green-300 text-green-700 hover:bg-green-200"
                        : "border-gray-300 text-gray-600 hover:bg-gray-100"
                    } transition-all duration-200`}
                    disabled={isAlreadyPrinted}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {isAlreadyPrinted ? "Marcado" : "Marcar"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handlePrintComanda(comanda)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <CheckCircle2 className="h-3 w-3" />
            <span>Comandas impressas ficam em verde</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  )
}
