"use client"

import { useEffect, useRef } from "react"
import { usePedidos } from "@/contexts/pedidos-context"

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
  const isInitializedRef = useRef(false)

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
    } catch (error) {
      console.error("[v0] Erro ao salvar comanda impressa:", error)
    }
  }

  const handlePrintReceipt = (nomeComanda: string, pedidosParaImprimir: PrintData[]) => {
    console.log("[v0] Global Print Monitor: Iniciando impressão para:", nomeComanda)
    console.log("[v0] Global Print Monitor: Pedidos:", pedidosParaImprimir)

    if (!pedidosParaImprimir || pedidosParaImprimir.length === 0) {
      console.log("[v0] Global Print Monitor: Nenhum pedido para imprimir")
      return
    }

    try {
      // Calcular total
      const total = pedidosParaImprimir.reduce((sum, pedido) => {
        return sum + pedido.produto.preco * pedido.quantidade
      }, 0)

      console.log("[v0] Global Print Monitor: Total calculado:", total)

      // Criar HTML do comprovante
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Comprovante - ${nomeComanda}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              line-height: 1.4; 
              margin: 0; 
              padding: 20px;
              max-width: 300px;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #000; 
              padding-bottom: 10px; 
              margin-bottom: 15px; 
            }
            .item { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 5px; 
              border-bottom: 1px dotted #ccc;
              padding-bottom: 3px;
            }
            .total { 
              border-top: 2px solid #000; 
              padding-top: 10px; 
              margin-top: 15px; 
              font-weight: bold; 
              font-size: 14px;
            }
            .footer { 
              text-align: center; 
              margin-top: 20px; 
              font-size: 10px; 
            }
            @media print {
              body { margin: 0; padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>CONVENIÊNCIA RIVES</h2>
            <p>Comanda: ${nomeComanda}</p>
            <p>${new Date().toLocaleString("pt-BR")}</p>
          </div>
          
          <div class="items">
            ${pedidosParaImprimir
              .map(
                (pedido) => `
              <div class="item">
                <div>
                  <div>${pedido.quantidade}x ${pedido.produto.nome}</div>
                  ${pedido.observacoes ? `<div style="font-size: 10px; color: #666;">Obs: ${pedido.observacoes}</div>` : ""}
                </div>
                <div>R$ ${(pedido.produto.preco * pedido.quantidade).toFixed(2)}</div>
              </div>
            `,
              )
              .join("")}
          </div>
          
          <div class="total">
            <div style="display: flex; justify-content: space-between;">
              <span>TOTAL GERAL:</span>
              <span>R$ ${total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Obrigado pela preferência!</p>
            <p>Gerado pelo sistema em ${new Date().toLocaleString("pt-BR")}</p>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 100);
            }
          </script>
        </body>
        </html>
      `

      // Criar iframe invisível para impressão
      const printFrame = document.createElement("iframe")
      printFrame.style.position = "absolute"
      printFrame.style.top = "-1000px"
      printFrame.style.left = "-1000px"
      printFrame.style.width = "0"
      printFrame.style.height = "0"
      printFrame.style.border = "none"

      document.body.appendChild(printFrame)

      // Escrever conteúdo no iframe
      const frameDoc = printFrame.contentWindow?.document
      if (frameDoc) {
        frameDoc.open()
        frameDoc.write(receiptHTML)
        frameDoc.close()

        // Remover iframe após impressão
        setTimeout(() => {
          document.body.removeChild(printFrame)
        }, 2000)
      }

      console.log("[v0] Global Print Monitor: Impressão executada com sucesso")
    } catch (error) {
      console.error("[v0] Global Print Monitor: Erro na impressão:", error)
    }
  }

  useEffect(() => {
    if (!comandas || comandas.length === 0) {
      return
    }

    if (!isInitializedRef.current) {
      console.log("[v0] Global Print Monitor: Inicializando - marcando comandas existentes como impressas")
      const printedComandas = getPrintedComandas()

      comandas.forEach((comanda) => {
        if (!printedComandas.has(comanda.id)) {
          savePrintedComanda(comanda.id)
        }
      })

      isInitializedRef.current = true
      return
    }

    const printedComandas = getPrintedComandas()
    const novasComandas = comandas.filter((comanda) => !printedComandas.has(comanda.id))

    if (novasComandas.length > 0) {
      console.log("[v0] Global Print Monitor: Novas comandas detectadas:", novasComandas.length)

      // Processar apenas comandas verdadeiramente novas
      const sortedNovasComandas = [...novasComandas].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )

      for (const comanda of sortedNovasComandas) {
        console.log("[v0] Global Print Monitor: Processando nova comanda:", comanda.numero_comanda)

        // Buscar pedidos desta comanda
        const pedidosComanda = pedidos.filter((p) => p.comanda_id === comanda.id)

        if (pedidosComanda.length > 0) {
          // Criar dados para impressão
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

          // Imprimir automaticamente
          handlePrintReceipt(comanda.numero_comanda, pedidosParaImprimir)
        }

        savePrintedComanda(comanda.id)
      }
    }
  }, [comandas, pedidos, products])

  return {
    isMonitoring: true,
  }
}
