"use client"

import { useState, useEffect } from "react"
import { Printer, Coffee, UtensilsCrossed, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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

interface CategoryPrintSystemProps {
  nomeComanda: string
  pedidos: PrintData[]
  onPrintComplete: () => void
}

function CategoryPrintSystem({ nomeComanda, pedidos, onPrintComplete }: CategoryPrintSystemProps) {
  const [printedCategories, setPrintedCategories] = useState<Set<string>>(new Set())

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
    const descricao = ""

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

    if (
      nome.includes("batata") ||
      nome.includes("frango") ||
      nome.includes("porção") ||
      nome.includes("petisco") ||
      nome.includes("aperitivo") ||
      nome.includes("mandioca") ||
      nome.includes("calabresa") ||
      nome.includes("linguiça") ||
      nome.includes("pastéis")
    ) {
      return "porcoes"
    }

    return "diversos"
  }

  const groupedPedidos = pedidos.reduce(
    (acc, pedido) => {
      const categoria = getCategoriaFromProduct(pedido.produto)
      if (!acc[categoria]) {
        acc[categoria] = []
      }
      acc[categoria].push(pedido)
      return acc
    },
    {} as Record<string, PrintData[]>,
  )

  const getCategoryInfo = (categoria: string) => {
    switch (categoria) {
      case "bebidas":
        return {
          name: "Bebidas",
          icon: Coffee,
          color: "bg-blue-500",
          emoji: "🥤",
          description: "Bar/Bebidas",
        }
      case "porcoes":
        return {
          name: "Porções",
          icon: UtensilsCrossed,
          color: "bg-orange-500",
          emoji: "🍟",
          description: "Cozinha/Porções",
        }
      default:
        return {
          name: "Diversos",
          icon: Package,
          color: "bg-gray-500",
          emoji: "📦",
          description: "Diversos",
        }
    }
  }

  const createCategoryReceipt = (categoria: string, pedidosCategoria: PrintData[]) => {
    const categoryInfo = getCategoryInfo(categoria)

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Comanda ${categoryInfo.name} - ${nomeComanda}</title>
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
            border: 2px solid ${categoria === "bebidas" ? "#3b82f6" : categoria === "porcoes" ? "#f97316" : "#6b7280"};
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
          .category-badge {
            background: ${categoria === "bebidas" ? "#3b82f6" : categoria === "porcoes" ? "#f97316" : "#6b7280"};
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-weight: bold;
            font-size: 12px;
            display: inline-block;
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
          .items-section {
            margin-bottom: 15px;
          }
          .section-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 10px;
            padding: 5px;
            background: ${categoria === "bebidas" ? "#e3f2fd" : categoria === "porcoes" ? "#fff3e0" : "#f5f5f5"};
            border-radius: 3px;
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
            body { 
              margin: 0; 
              padding: 8px; 
            }
            .receipt-container {
              border: 1px solid #000;
              padding: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div class="logo">Conveniência Rives</div>
            <div class="category-badge">${categoryInfo.emoji} ${categoryInfo.name}</div>
          </div>
          
          <div class="comanda-info">
            Comanda: ${nomeComanda}
          </div>
          
          <div class="items-section">
            <div class="section-title">${categoryInfo.name} (${pedidosCategoria.length} ${pedidosCategoria.length === 1 ? "item" : "itens"})</div>
            ${pedidosCategoria
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
          
          <div class="footer">
            ${categoryInfo.description} - ${new Date().toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
        
        <script>
          console.log("[v0] Category print: Página carregada para categoria ${categoria}");
          
          function attemptPrint() {
            try {
              console.log("[v0] Category print: Tentando imprimir categoria ${categoria}");
              window.print();
              
              setTimeout(function() {
                console.log("[v0] Category print: Fechando janela da categoria ${categoria}");
                window.close();
              }, 2000);
            } catch (error) {
              console.error("[v0] Category print: Erro na impressão:", error);
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
            console.log("[v0] Category print: Preparando para imprimir categoria ${categoria}");
          }
          
          window.onafterprint = function() {
            console.log("[v0] Category print: Impressão da categoria ${categoria} concluída");
            setTimeout(function() {
              window.close();
            }, 1000);
          }
        </script>
      </body>
      </html>
    `
  }

  const handlePrintCategory = (categoria: string, pedidosCategoria: PrintData[]) => {
    console.log(`[v0] Category print: Iniciando impressão para categoria ${categoria}`)

    if (!pedidosCategoria || pedidosCategoria.length === 0) {
      console.log(`[v0] Category print: Nenhum pedido para categoria ${categoria}`)
      return
    }

    try {
      const receiptHTML = createCategoryReceipt(categoria, pedidosCategoria)
      const windowFeatures =
        "width=450,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no"

      const printWindow = window.open("", "_blank", windowFeatures)

      if (printWindow && !printWindow.closed) {
        printWindow.document.write(receiptHTML)
        printWindow.document.close()
        printWindow.focus()
        console.log(`[v0] Category print: Janela de impressão aberta para categoria ${categoria}`)

        setPrintedCategories((prev) => new Set([...prev, categoria]))

        setTimeout(() => {
          try {
            printWindow.print()
          } catch (e) {
            console.log(`[v0] Failed to trigger print for ${categoria}:`, e)
          }
        }, 1000)
      } else {
        alert(
          `⚠️ POPUP BLOQUEADO!\\n\\nO navegador bloqueou a janela de impressão.\\n\\nCategoria: ${getCategoryInfo(categoria).name}\\nComanda: ${nomeComanda}\\n\\nPor favor, permita popups para este site.`,
        )
      }
    } catch (error) {
      console.error(`[v0] Category print: Erro na impressão da categoria ${categoria}:`, error)
      alert(
        `❌ ERRO NA IMPRESSÃO!\\n\\nCategoria: ${getCategoryInfo(categoria).name}\\nComanda: ${nomeComanda}\\n\\nErro: ${error.message}`,
      )
    }
  }

  const handlePrintAllCategories = () => {
    console.log("[v0] Category print: Iniciando impressão de todas as categorias")

    Object.entries(groupedPedidos).forEach(([categoria, pedidosCategoria], index) => {
      setTimeout(() => {
        handlePrintCategory(categoria, pedidosCategoria)
      }, index * 1500) // 1.5 second delay between each category
    })

    setTimeout(
      () => {
        onPrintComplete()
      },
      Object.keys(groupedPedidos).length * 1500 + 2000,
    )
  }

  useEffect(() => {
    // This component should only be used for manual printing
    console.log("[v0] Category print: Component loaded but auto-print disabled")
  }, []) // Only run once when component mounts

  if (Object.keys(groupedPedidos).length === 0) return null

  return (
    <div className="fixed top-4 left-4 z-50 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-2xl p-4 min-w-[300px]">
      <div className="flex items-center gap-2 mb-4">
        <Printer className="h-5 w-5 text-blue-600" />
        <span className="font-bold text-gray-800">Impressão por Categoria</span>
      </div>

      <div className="space-y-3">
        <div className="text-sm text-gray-600 mb-3">
          <strong>Comanda:</strong> {nomeComanda}
        </div>

        {Object.entries(groupedPedidos).map(([categoria, pedidosCategoria]) => {
          const categoryInfo = getCategoryInfo(categoria)
          const Icon = categoryInfo.icon
          const isPrinted = printedCategories.has(categoria)

          return (
            <div key={categoria} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 ${categoria === "bebidas" ? "text-blue-600" : categoria === "porcoes" ? "text-orange-600" : "text-gray-600"}`}
                />
                <div>
                  <div className="font-medium text-gray-800">{categoryInfo.name}</div>
                  <div className="text-xs text-gray-500">
                    {pedidosCategoria.length} {pedidosCategoria.length === 1 ? "item" : "itens"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isPrinted ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Impresso
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                    Imprimindo...
                  </Badge>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePrintCategory(categoria, pedidosCategoria)}
                  className="text-xs"
                >
                  <Printer className="h-3 w-3 mr-1" />
                  Reimprimir
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">Sistema de impressão separada por categoria ativo</div>
      </div>
    </div>
  )
}

export default CategoryPrintSystem
export { CategoryPrintSystem }
