"use client"

import { useEffect, useRef, useState } from "react"
import { usePedidos } from "@/contexts/pedidos-context"
import { useInterface } from "@/contexts/interface-context"

interface PrintData {
  id: string
  produto_id: string
  comanda_id: string
  quantidade: number
  observacoes: string | null
  produto: {
    id: string
    nome: string
    preco: number
    categoria_id: string
  }
}

export function useGlobalPrintMonitor() {
  const { comandas, pedidos, products } = usePedidos()
  const { activeInterface } = useInterface()
  const processedComandasRef = useRef<Set<string>>(new Set())
  const comandaPedidosCountRef = useRef<Map<string, number>>(new Map())
  const isInitializedRef = useRef(false)
  const isExecutingPrintRef = useRef(false)
  const lastActiveInterfaceRef = useRef<string | null>(null)
  const [pendingPrint, setPendingPrint] = useState<{
    nomeComanda: string
    pedidos: PrintData[]
    comandaId: string
  } | null>(null)

  const [showAutoPrintNotification, setShowAutoPrintNotification] = useState(false)
  const [autoPrintMessage, setAutoPrintMessage] = useState("")

  useEffect(() => {
    if (lastActiveInterfaceRef.current !== activeInterface) {
      console.log(
        `[v0] Global Print Monitor: Interface mudou de ${lastActiveInterfaceRef.current} para ${activeInterface}`,
      )
      isInitializedRef.current = false
      processedComandasRef.current.clear()
      comandaPedidosCountRef.current.clear()
      lastActiveInterfaceRef.current = activeInterface
    }
  }, [activeInterface])

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
      console.log("[v0] Global Print Monitor: Comanda marcada como impressa:", comandaId)

      window.dispatchEvent(
        new CustomEvent("comandaPrinted", {
          detail: { comandaId },
        }),
      )
    } catch (error) {
      console.error("[v0] Erro ao salvar comanda impressa:", error)
    }
  }

  const createStandardizedReceipt = (nomeComanda: string, pedidosParaImprimir: PrintData[], comandaId: string) => {
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
          console.log("[v0] Auto-print: Página carregada");
          
          function attemptPrint() {
            try {
              console.log("[v0] Auto-print: Tentando imprimir");
              window.print();
              
              setTimeout(function() {
                console.log("[v0] Auto-print: Fechando janela");
                window.close();
              }, 2000);
            } catch (error) {
              console.error("[v0] Auto-print: Erro na impressão:", error);
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
            console.log("[v0] Auto-print: Preparando para imprimir");
          }
          
          window.onafterprint = function() {
            console.log("[v0] Auto-print: Impressão concluída");
            setTimeout(function() {
              window.close();
            }, 1000);
          }
        </script>
      </body>
      </html>
    `
  }

  const handlePrintReceipt = (nomeComanda: string, pedidosParaImprimir: PrintData[], comandaId: string) => {
    if (isExecutingPrintRef.current) {
      console.log("[v0] Global Print Monitor: Impressão já em execução, ignorando duplicata")
      return
    }

    isExecutingPrintRef.current = true
    console.log("[v0] Global Print Monitor: INICIANDO IMPRESSÃO AUTOMÁTICA para:", nomeComanda)

    if (!pedidosParaImprimir || pedidosParaImprimir.length === 0) {
      console.log("[v0] Global Print Monitor: Nenhum pedido para imprimir")
      isExecutingPrintRef.current = false
      return
    }

    try {
      const receiptHTML = createStandardizedReceipt(nomeComanda, pedidosParaImprimir, comandaId)
      const windowFeatures =
        "width=450,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no"

      console.log("[v0] Global Print Monitor: Abrindo janela de impressão...")
      const printWindow = window.open("", "_blank", windowFeatures)

      if (printWindow && !printWindow.closed) {
        printWindow.document.write(receiptHTML)
        printWindow.document.close()
        printWindow.focus()
        console.log("[v0] Global Print Monitor: ✅ JANELA DE IMPRESSÃO ABERTA COM SUCESSO!")

        savePrintedComanda(comandaId)

        setTimeout(() => {
          isExecutingPrintRef.current = false
        }, 3000) // Increased timeout to prevent rapid duplicates
      } else {
        console.log("[v0] Global Print Monitor: ❌ Popup bloqueado, tentando método alternativo...")

        try {
          const newTab = window.open("about:blank", "_blank")
          if (newTab) {
            newTab.document.write(receiptHTML)
            newTab.document.close()
            newTab.focus()
            console.log("[v0] Global Print Monitor: ✅ Método alternativo funcionou!")
            savePrintedComanda(comandaId)
          }
        } catch (error) {
          console.error("[v0] Global Print Monitor: Erro no método alternativo:", error)
        }

        setTimeout(() => {
          isExecutingPrintRef.current = false
        }, 3000)
      }

      console.log("[v0] Global Print Monitor: ✅ PROCESSO DE IMPRESSÃO CONCLUÍDO")
    } catch (error) {
      console.error("[v0] Global Print Monitor: ❌ ERRO NA IMPRESSÃO:", error)
      isExecutingPrintRef.current = false
    }
  }

  useEffect(() => {
    if (!comandas || !pedidos || !products) {
      console.log("[v0] Global Print Monitor: Aguardando dados...")
      return
    }

    if (activeInterface !== "pagamento") {
      console.log(
        `[v0] Global Print Monitor: Auto-print DESABILITADO - interface atual: ${activeInterface || "nenhuma"}`,
      )
      return
    }

    console.log("[v0] Global Print Monitor: Ativo e monitorando:", true)

    if (!isInitializedRef.current) {
      console.log("[v0] Global Print Monitor: Inicializando sistema...")
      comandas.forEach((comanda) => {
        processedComandasRef.current.add(comanda.id)
        const pedidosCount = pedidos.filter((p) => p.comanda_id === comanda.id).length
        comandaPedidosCountRef.current.set(comanda.id, pedidosCount)
      })
      isInitializedRef.current = true
      console.log("[v0] Global Print Monitor: Sistema inicializado com", comandas.length, "comandas existentes")
      return
    }

    if (isExecutingPrintRef.current) {
      console.log("[v0] Global Print Monitor: Execução em andamento, ignorando...")
      return
    }

    const newComandas = comandas.filter((comanda) => !processedComandasRef.current.has(comanda.id))

    const comandasWithNewPedidos = comandas.filter((comanda) => {
      const currentPedidosCount = pedidos.filter((p) => p.comanda_id === comanda.id).length
      const previousCount = comandaPedidosCountRef.current.get(comanda.id) || 0
      return currentPedidosCount > previousCount && currentPedidosCount > 0
    })

    const comandasToProcess = [...newComandas, ...comandasWithNewPedidos]

    if (comandasToProcess.length > 0) {
      console.log("[v0] Global Print Monitor: 🔥 DETECTADAS COMANDAS PARA IMPRESSÃO:", comandasToProcess.length)

      const comanda = comandasToProcess[0]
      const pedidosComanda = pedidos.filter((pedido) => pedido.comanda_id === comanda.id)

      if (pedidosComanda.length > 0) {
        const pedidosComProdutos = pedidosComanda
          .map((pedido) => {
            const produto = products.find((p) => p.id === pedido.produto_id)
            return produto ? { ...pedido, produto } : null
          })
          .filter(Boolean) as PrintData[]

        if (pedidosComProdutos.length > 0) {
          console.log("[v0] Global Print Monitor: 🚀 AUTO-IMPRIMINDO COMANDA:", comanda.numero_comanda)
          setTimeout(() => {
            if (!isExecutingPrintRef.current) {
              handlePrintReceipt(comanda.numero_comanda, pedidosComProdutos, comanda.id)
            }
          }, 1000)
        }
      }

      comandasToProcess.forEach((comanda) => {
        processedComandasRef.current.add(comanda.id)
        const pedidosCount = pedidos.filter((p) => p.comanda_id === comanda.id).length
        comandaPedidosCountRef.current.set(comanda.id, pedidosCount)
      })
    }

    console.log("[v0] Global Print Monitor: Monitorando", comandas.length, "comandas ativas")
  }, [comandas, pedidos, products, activeInterface])

  return {
    isMonitoring: activeInterface === "pagamento",
    pendingPrint,
    clearPendingPrint: () => setPendingPrint(null),
    handlePrintReceipt,
    getPrintedComandas,
    savePrintedComanda,
    showAutoPrintNotification,
    autoPrintMessage,
  }
}
