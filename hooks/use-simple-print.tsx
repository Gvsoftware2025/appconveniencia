"use client"

import { useEffect, useRef } from "react"
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

export function useSimplePrint() {
  const { comandas, pedidos, products } = usePedidos()
  const { activeInterface } = useInterface()
  const processedPedidosRef = useRef<Set<string>>(new Set())
  const isInitializedRef = useRef(false)
  const isPrintingRef = useRef(false)
  const printWindowsRef = useRef<Window[]>([])

  const getCategoriaFromProduct = (produto: PrintData["produto"]) => {
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

  const cleanupPrintWindows = () => {
    printWindowsRef.current.forEach((window) => {
      if (window && !window.closed) {
        try {
          window.close()
        } catch (e) {
          console.log("[v0] Failed to close print window:", e)
        }
      }
    })
    printWindowsRef.current = []
  }

  const createPrintHTML = (categoria: string, pedidos: PrintData[], nomeComanda: string) => {
    const categoryInfo =
      categoria === "bebidas"
        ? { name: "Bebidas", emoji: "🥤", color: "#3b82f6", description: "Bar/Bebidas" }
        : { name: "Porções", emoji: "🍟", color: "#f97316", description: "Cozinha/Porções" }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Comanda ${categoryInfo.name} - ${nomeComanda}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          /* Optimized for thermal printers - darker text, compact layout */
          body { 
            font-family: 'Courier New', monospace;
            font-size: 14px; 
            font-weight: bold;
            line-height: 1.3; 
            margin: 0; 
            padding: 8px;
            max-width: 280px;
            background: #ffffff;
            color: #000000;
          }
          
          .receipt-container {
            border: 2px solid #000;
            padding: 8px;
            background: #ffffff;
          }
          
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 6px; 
            margin-bottom: 8px; 
          }
          
          .logo {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 4px;
            color: #000;
          }
          
          .category-badge {
            background: #000;
            color: #fff;
            padding: 4px 8px;
            border-radius: 3px;
            font-weight: bold;
            font-size: 14px;
            display: inline-block;
          }
          
          .comanda-info {
            text-align: center;
            margin-bottom: 8px;
            font-weight: bold;
            font-size: 16px;
            padding: 6px;
            background: #f0f0f0;
            border: 1px solid #000;
            color: #000;
          }
          
          .item { 
            margin-bottom: 6px; 
            padding: 6px;
            background: #f5f5f5;
            border: 1px solid #000;
            font-size: 13px;
          }
          
          .item-name {
            font-weight: bold;
            margin-bottom: 2px;
            color: #000;
          }
          
          .item-qty {
            font-size: 12px;
            color: #000;
            font-weight: bold;
          }
          
          .item-obs {
            font-size: 11px;
            color: #000;
            font-weight: bold;
            margin-top: 2px;
            text-decoration: underline;
          }
          
          .item-price {
            font-weight: bold;
            color: #000;
            font-size: 14px;
            margin-top: 2px;
          }
          
          .footer { 
            text-align: center; 
            margin-top: 8px; 
            padding-top: 6px;
            border-top: 2px dashed #000;
            font-size: 11px;
            color: #000;
            font-weight: bold;
          }
          
          @media print {
            body { 
              margin: 0; 
              padding: 4px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .receipt-container { 
              border: 2px solid #000; 
              padding: 6px; 
            }
            
            * {
              color: #000 !important;
              font-weight: bold !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div class="logo">CONVENIÊNCIA RIVES</div>
            <div class="category-badge">${categoryInfo.emoji} ${categoryInfo.name.toUpperCase()}</div>
          </div>
          
          <div class="comanda-info">
            COMANDA: ${nomeComanda}
          </div>
          
          <div class="items-section">
            ${pedidos
              .map(
                (pedido) => `
              <div class="item">
                <div class="item-name">${pedido.produto.nome.toUpperCase()}</div>
                <div class="item-qty">QTD: ${pedido.quantidade}x</div>
                ${pedido.observacoes ? `<div class="item-obs">OBS: ${pedido.observacoes.toUpperCase()}</div>` : ""}
                <div class="item-price">R$ ${(pedido.produto.preco * pedido.quantidade).toFixed(2)}</div>
              </div>
            `,
              )
              .join("")}
          </div>
          
          <div class="footer">
            ${categoryInfo.description.toUpperCase()}<br>
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

  const printCategory = (categoria: string, pedidos: PrintData[], nomeComanda: string) => {
    if (!pedidos || pedidos.length === 0) return

    console.log(`[v0] Simple Print: Abrindo 1 aba para ${categoria}`)

    try {
      const printHTML = createPrintHTML(categoria, pedidos, nomeComanda)
      const printWindow = window.open("", "_blank", "width=450,height=700,scrollbars=yes,resizable=yes")

      if (printWindow) {
        printWindowsRef.current.push(printWindow)

        printWindow.document.write(printHTML)
        printWindow.document.close()
        printWindow.focus()
        console.log(`[v0] Simple Print: Aba de ${categoria} aberta com sucesso`)
      } else {
        console.log(`[v0] Simple Print: Falha ao abrir aba de ${categoria} - popup bloqueado`)
      }
    } catch (error) {
      console.error(`[v0] Simple Print: Erro ao abrir aba de ${categoria}:`, error)
    }
  }

  const handleSimplePrint = (nomeComanda: string, pedidos: PrintData[]) => {
    if (isPrintingRef.current) {
      console.log("[v0] Simple Print: Já está imprimindo, ignorando nova solicitação")
      return
    }

    cleanupPrintWindows()

    isPrintingRef.current = true
    console.log(`[v0] Simple Print: Iniciando impressão simples para ${nomeComanda}`)

    const bebidas = pedidos.filter((p) => getCategoriaFromProduct(p.produto) === "bebidas")
    const porcoes = pedidos.filter((p) => getCategoriaFromProduct(p.produto) !== "bebidas")

    if (bebidas.length > 0) {
      printCategory("bebidas", bebidas, nomeComanda)
    }

    if (porcoes.length > 0) {
      setTimeout(() => {
        printCategory("porcoes", porcoes, nomeComanda)
      }, 500)
    }

    setTimeout(() => {
      isPrintingRef.current = false
      // Clean up any remaining windows after print timeout
      setTimeout(cleanupPrintWindows, 2000)
    }, 2000)
  }

  useEffect(() => {
    if (!comandas || !pedidos || !products) {
      return
    }

    const shouldMonitor = activeInterface === "comandas"

    if (!shouldMonitor) {
      if (printWindowsRef.current.length > 0) {
        cleanupPrintWindows()
      }
      return
    }

    if (!isInitializedRef.current) {
      pedidos.forEach((pedido) => {
        processedPedidosRef.current.add(pedido.id)
      })
      isInitializedRef.current = true
      console.log("[v0] Simple Print: Inicializado com", pedidos.length, "pedidos existentes")
      return
    }

    const newPedidos = pedidos.filter((pedido) => !processedPedidosRef.current.has(pedido.id))

    if (newPedidos.length > 0 && !isPrintingRef.current) {
      const pedidosByComanda = new Map<string, typeof newPedidos>()

      newPedidos.forEach((pedido) => {
        if (!pedidosByComanda.has(pedido.comanda_id)) {
          pedidosByComanda.set(pedido.comanda_id, [])
        }
        pedidosByComanda.get(pedido.comanda_id)!.push(pedido)
      })

      pedidosByComanda.forEach((pedidosComanda, comandaId) => {
        const comanda = comandas.find((c) => c.id === comandaId)
        if (comanda) {
          const pedidosComProdutos = pedidosComanda
            .map((pedido) => {
              const produto = products.find((p) => p.id === pedido.produto_id)
              return produto ? { ...pedido, produto } : null
            })
            .filter(Boolean) as PrintData[]

          if (pedidosComProdutos.length > 0) {
            console.log(
              "[v0] Simple Print: Imprimindo",
              pedidosComProdutos.length,
              "pedidos da comanda",
              comanda.numero_comanda,
            )
            handleSimplePrint(comanda.numero_comanda, pedidosComProdutos)
          }
        }
      })

      newPedidos.forEach((pedido) => {
        processedPedidosRef.current.add(pedido.id)
      })
    }
  }, [comandas, pedidos, products, activeInterface])

  useEffect(() => {
    return () => {
      cleanupPrintWindows()
    }
  }, [])

  return {
    isMonitoring: activeInterface === "comandas",
    handleSimplePrint,
  }
}
