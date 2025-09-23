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

  const getCategoriaFromProduct = (produto: any) => {
    if (produto.categoria_id) {
      switch (produto.categoria_id) {
        case "2b8538f0-9ffc-4982-bd15-b8fb49f67fa1":
          return "bebidas"
        case "3c9649f1-0aad-4093-ae26-c9ac50a78ab2":
          return "porcoes"
        default:
          return "diversos"
      }
    }

    const nome = produto.nome.toLowerCase()
    if (
      nome.includes("refrigerante") ||
      nome.includes("suco") ||
      nome.includes("caipirinha") ||
      nome.includes("cerveja") ||
      nome.includes("água") ||
      nome.includes("drink")
    ) {
      return "bebidas"
    }

    return "porcoes"
  }

  const createUnifiedPrintHTML = (pedidos: any[], nomeComanda: string) => {
    const bebidas = pedidos.filter((p) => getCategoriaFromProduct(p.produto) === "bebidas")
    const porcoes = pedidos.filter((p) => getCategoriaFromProduct(p.produto) !== "bebidas")

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Comanda - ${nomeComanda}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Arial', sans-serif;
            font-size: 12px; 
            line-height: 1.4; 
            margin: 0; 
            padding: 10px;
            max-width: 300px;
            background: #ffffff;
            color: #000;
          }
          .receipt-container {
            border: 2px solid #333;
            padding: 15px;
            background: #ffffff;
          }
          .header { 
            text-align: center; 
            border-bottom: 1px solid #ccc; 
            padding-bottom: 10px; 
            margin-bottom: 15px; 
          }
          .logo {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .comanda-info {
            text-align: center;
            margin-bottom: 15px;
            font-weight: bold;
            font-size: 14px;
            padding: 8px;
            background: #f5f5f5;
            border-radius: 5px;
          }
          .category-section {
            margin-bottom: 20px;
          }
          .category-header {
            background: #333;
            color: white;
            padding: 8px 12px;
            border-radius: 5px;
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 10px;
            text-align: center;
          }
          .category-header.bebidas {
            background: #3b82f6;
          }
          .category-header.porcoes {
            background: #f97316;
          }
          .item { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px; 
            padding: 8px;
            background: #f9f9f9;
            border-radius: 3px;
            font-size: 11px;
          }
          .item-details {
            flex: 1;
          }
          .item-name {
            font-weight: bold;
            margin-bottom: 2px;
          }
          .item-qty {
            font-size: 10px;
            color: #666;
          }
          .item-obs {
            font-size: 10px;
            color: #d32f2f;
            font-style: italic;
            margin-top: 3px;
          }
          .item-price {
            font-weight: bold;
            color: #2e7d32;
          }
          .footer { 
            text-align: center; 
            margin-top: 15px; 
            padding-top: 10px;
            border-top: 1px dashed #ccc;
            font-size: 10px;
            color: #666;
          }
          @media print {
            body { margin: 0; padding: 8px; }
            .receipt-container { border: 1px solid #000; padding: 10px; }
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
          
          ${
            bebidas.length > 0
              ? `
            <div class="category-section">
              <div class="category-header bebidas">🥤 Bebidas - Bar</div>
              ${bebidas
                .map(
                  (pedido) => `
                <div class="item">
                  <div class="item-details">
                    <div class="item-name">${pedido.produto.nome}</div>
                    <div class="item-qty">${pedido.quantidade}x</div>
                    ${pedido.observacoes ? `<div class="item-obs">${pedido.observacoes}</div>` : ""}
                  </div>
                  <div class="item-price">R$ ${(pedido.produto.preco * pedido.quantidade).toFixed(2)}</div>
                </div>
              `,
                )
                .join("")}
            </div>
          `
              : ""
          }
          
          ${
            porcoes.length > 0
              ? `
            <div class="category-section">
              <div class="category-header porcoes">🍟 Porções - Cozinha</div>
              ${porcoes
                .map(
                  (pedido) => `
                <div class="item">
                  <div class="item-details">
                    <div class="item-name">${pedido.produto.nome}</div>
                    <div class="item-qty">${pedido.quantidade}x</div>
                    ${pedido.observacoes ? `<div class="item-obs">${pedido.observacoes}</div>` : ""}
                  </div>
                  <div class="item-price">R$ ${(pedido.produto.preco * pedido.quantidade).toFixed(2)}</div>
                </div>
              `,
                )
                .join("")}
            </div>
          `
              : ""
          }
          
          <div class="footer">
            ${new Date().toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
        
        <script>
          let printAttempted = false;
          
          function attemptPrint() {
            if (printAttempted) return;
            printAttempted = true;
            
            try {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1500);
            } catch (error) {
              console.error("Print error:", error);
              window.close();
            }
          }
          
          window.onload = function() {
            setTimeout(attemptPrint, 300);
          }
          
          window.onafterprint = function() {
            setTimeout(function() {
              window.close();
            }, 500);
          }
          
          window.onbeforeunload = function() {
            printAttempted = true;
          }
        </script>
      </body>
      </html>
    `
  }

  const handleMarkAsPrinted = (comanda: any) => {
    markAsPrinted(comanda.id)
    savePrintedComanda(comanda.id)
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setHasNewComandas(false)
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

      const bebidas = pedidosParaImprimir.filter((p) => getCategoriaFromProduct(p.produto) === "bebidas")
      const porcoes = pedidosParaImprimir.filter((p) => getCategoriaFromProduct(p.produto) !== "bebidas")

      console.log(`[v0] Print notification: Imprimindo comanda ${comanda.numero_comanda}`)
      console.log(`[v0] Print notification: ${bebidas.length} bebidas, ${porcoes.length} porções`)

      const todosItens = [...bebidas, ...porcoes]

      if (todosItens.length > 0) {
        const printHTML = createUnifiedPrintHTML(todosItens, comanda.numero_comanda)

        try {
          const printWindow = window.open("", "_blank", "width=450,height=700,scrollbars=yes,resizable=yes")

          if (printWindow) {
            printWindow.document.write(printHTML)
            printWindow.document.close()
            printWindow.focus()
            console.log(`[v0] Print notification: Aba única aberta com sucesso`)
          } else {
            console.log(`[v0] Print notification: Falha ao abrir aba - popup bloqueado`)
          }
        } catch (error) {
          console.error(`[v0] Print notification: Erro ao abrir aba:`, error)
        }
      }
    }

    if (onPrintComanda) {
      onPrintComanda(comanda)
    }
    markAsPrinted(comanda.id)
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
