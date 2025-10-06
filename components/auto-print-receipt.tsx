"use client"

import { useEffect, useRef } from "react"

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

interface AutoPrintReceiptProps {
  nomeComanda: string
  pedidos: PrintData[]
  onPrintComplete: () => void
}

export function AutoPrintReceipt({ nomeComanda, pedidos, onPrintComplete }: AutoPrintReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const hasPrintedRef = useRef(false)

  useEffect(() => {
    if (!hasPrintedRef.current && pedidos.length > 0) {
      console.log("[v0] Auto-print: Iniciando impressão automática para:", nomeComanda)

      // Small delay to ensure content is rendered
      setTimeout(() => {
        if (printRef.current) {
          // Create a new window with the receipt content
          const printWindow = window.open("", "_blank", "width=450,height=700,scrollbars=yes")

          if (printWindow) {
            const total = pedidos.reduce((sum, pedido) => sum + pedido.produto.preco * pedido.quantidade, 0)

            printWindow.document.write(`
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
                  .subtitle {
                    font-size: 12px;
                    color: #6b7280;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
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
                  .item:hover {
                    background: #f1f5f9;
                    transform: translateX(2px);
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
                    .item:hover {
                      background: #f8fafc;
                      transform: none;
                    }
                  }
                </style>
              </head>
              <body>
                <div class="receipt-container">
                  <div class="header">
                    <div class="logo">Conveniência</div>
                    <div class="subtitle">Sistema de Pedidos Premium</div>
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
                    ${pedidos
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
                      Pedido processado em ${new Date().toLocaleString("pt-BR")}<br>
                      🚀 Sistema APPConveniência v2.0 - Powered by Innovation
                    </div>
                  </div>
                </div>
                
                <script>
                  console.log("[v0] Auto-print: Página carregada");
                  window.onload = function() {
                    setTimeout(function() {
                      console.log("[v0] Auto-print: Iniciando impressão");
                      window.print();
                    }, 500);
                  }
                  
                  window.onafterprint = function() {
                    console.log("[v0] Auto-print: Impressão concluída, fechando janela");
                    setTimeout(function() {
                      window.close();
                    }, 1000);
                  }
                </script>
              </body>
              </html>
            `)

            printWindow.document.close()
            hasPrintedRef.current = true
            onPrintComplete()

            console.log("[v0] Auto-print: Janela de impressão criada com sucesso")
          } else {
            console.log("[v0] Auto-print: Falha ao criar janela - popup bloqueado")
            // Fallback: trigger browser print directly
            setTimeout(() => {
              window.print()
              onPrintComplete()
            }, 500)
          }
        }
      }, 300)
    }
  }, [nomeComanda, pedidos, onPrintComplete])

  if (pedidos.length === 0) return null

  const total = pedidos.reduce((sum, pedido) => sum + pedido.produto.preco * pedido.quantidade, 0)

  return (
    <div ref={printRef} className="hidden print:block">
      {/* Hidden content for fallback printing */}
      <div className="receipt-container max-w-sm mx-auto bg-white p-6 border-2 border-gray-200 rounded-lg">
        <div className="header text-center border-b-2 border-indigo-500 pb-4 mb-6">
          <div className="text-2xl font-black text-indigo-600 tracking-wider uppercase mb-2">Conveniência</div>
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Sistema de Pedidos Premium</div>
        </div>

        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-lg text-center mb-6 font-bold text-lg">
          Comanda: {nomeComanda}
        </div>

        <div className="text-xs text-gray-500 text-center mb-6 font-medium">
          📅{" "}
          {new Date().toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>

        <div className="mb-6">
          <div className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
            🍽️ Itens do Pedido
          </div>
          {pedidos.map((pedido, index) => (
            <div
              key={index}
              className="flex justify-between items-start mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-indigo-500"
            >
              <div className="flex-1">
                <div className="font-bold text-gray-900 mb-1 text-sm">{pedido.produto.nome}</div>
                <div className="text-xs text-gray-600 font-semibold bg-indigo-100 px-2 py-1 rounded-full inline-block">
                  {pedido.quantidade}x unidade
                </div>
                {pedido.observacoes && (
                  <div className="text-xs text-red-600 italic mt-2 p-2 bg-red-50 rounded border border-red-200 flex items-center gap-1">
                    📝 {pedido.observacoes}
                  </div>
                )}
              </div>
              <div className="font-bold text-green-600 text-sm bg-green-50 px-3 py-1 rounded border border-green-200">
                R$ {(pedido.produto.preco * pedido.quantidade).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t-2 border-gray-200 pt-5 mt-6">
          <div className="flex justify-between mb-3 text-sm text-gray-600 font-semibold">
            <span>Subtotal:</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-black text-lg text-gray-900 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-2 border-sky-500">
            <span>💰 TOTAL GERAL</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center mt-7 pt-5 border-t-2 border-dashed border-gray-300">
          <div className="text-lg font-bold text-indigo-600 mb-2 flex items-center justify-center gap-2">
            🙏 Obrigado pela preferência!
          </div>
          <div className="text-xs text-gray-400 leading-relaxed">
            Pedido processado em {new Date().toLocaleString("pt-BR")}
            <br />🚀 Sistema APPConveniência v2.0 - Powered by Innovation
          </div>
        </div>
      </div>
    </div>
  )
}
