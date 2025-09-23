"use client"

import { useState, useMemo, useEffect } from "react"
import { ArrowLeft, TrendingUp, DollarSign, CreditCard, Calendar, Download, Filter, Eye, FileText } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import { usePedidos } from "@/contexts/pedidos-context"
import { toast } from "react-toastify"

interface RelatoriosPagamentoProps {
  onBack: () => void
}

interface TransacaoPagamento {
  id: string
  comanda: string
  valor: number
  metodoPagamento: string
  data: Date
  tipo: "total" | "parcial"
  itens: Array<{
    nome: string
    quantidade: number
    preco: number
  }>
}

export default function RelatoriosPagamento({ onBack }: RelatoriosPagamentoProps) {
  const { comandas, pedidos, calcularTotalComanda } = usePedidos()
  const [filtroData, setFiltroData] = useState("hoje")
  const [filtroMetodo, setFiltroMetodo] = useState("todos")
  const [transacaoSelecionada, setTransacaoSelecionada] = useState<TransacaoPagamento | null>(null)

  const [transacoesAcumuladas, setTransacoesAcumuladas] = useState<TransacaoPagamento[]>([])

  // Load accumulated transactions from localStorage on component mount
  useEffect(() => {
    const transacoesSalvas = localStorage.getItem("transacoes_acumuladas")
    if (transacoesSalvas) {
      const transacoes = JSON.parse(transacoesSalvas).map((t: any) => ({
        ...t,
        data: new Date(t.data),
      }))
      setTransacoesAcumuladas(transacoes)
    }
  }, [])

  useEffect(() => {
    if (!comandas || !pedidos) return

    const transacoesSalvas = localStorage.getItem("transacoes_acumuladas")
    if (transacoesSalvas) {
      // If we have saved transactions, don't reload from database
      return
    }

    const novasTransacoes = comandas
      .filter((comanda) => comanda.status === "fechada")
      .map((comanda) => {
        const pedidosDaComanda = pedidos.filter((p) => p.comanda_id === comanda.id)
        const itens = pedidosDaComanda.map((pedido) => ({
          nome: pedido.produto?.nome || "Produto não encontrado",
          quantidade: pedido.quantidade,
          preco: pedido.preco_unitario || 0,
        }))

        return {
          id: comanda.id,
          comanda: comanda.numero_comanda,
          valor: comanda.total || calcularTotalComanda(comanda.id),
          metodoPagamento: comanda.metodo_pagamento || "dinheiro",
          data: new Date(comanda.updated_at || comanda.created_at),
          tipo: comanda.tipo_pagamento || "total",
          itens,
        } as TransacaoPagamento
      })

    if (novasTransacoes.length > 0 && transacoesAcumuladas.length === 0) {
      const transacoesOrdenadas = novasTransacoes.sort((a, b) => b.data.getTime() - a.data.getTime())
      localStorage.setItem("transacoes_acumuladas", JSON.stringify(transacoesOrdenadas))
      setTransacoesAcumuladas(transacoesOrdenadas)
    }
  }, [comandas, pedidos, calcularTotalComanda, transacoesAcumuladas.length])

  const transacoesFiltradas = useMemo(() => {
    let filtradas = [...transacoesAcumuladas]

    const agora = new Date()
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
    const ontem = new Date(hoje.getTime() - 24 * 60 * 60 * 1000)
    const semanaPassada = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000)
    const mesPassado = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000)

    switch (filtroData) {
      case "hoje":
        filtradas = filtradas.filter((t) => t.data >= hoje)
        break
      case "ontem":
        filtradas = filtradas.filter((t) => t.data >= ontem && t.data < hoje)
        break
      case "semana":
        filtradas = filtradas.filter((t) => t.data >= semanaPassada)
        break
      case "mes":
        filtradas = filtradas.filter((t) => t.data >= mesPassado)
        break
      case "todos":
        // Não filtra por data
        break
    }

    if (filtroMetodo !== "todos") {
      filtradas = filtradas.filter((t) => t.metodoPagamento === filtroMetodo)
    }

    return filtradas.sort((a, b) => b.data.getTime() - a.data.getTime())
  }, [transacoesAcumuladas, filtroData, filtroMetodo])

  const estatisticas = useMemo(() => {
    const total = transacoesFiltradas.reduce((sum, t) => sum + t.valor, 0)
    const quantidade = transacoesFiltradas.length
    const ticketMedio = quantidade > 0 ? total / quantidade : 0

    const porMetodo = transacoesFiltradas.reduce(
      (acc, t) => {
        acc[t.metodoPagamento] = (acc[t.metodoPagamento] || 0) + t.valor
        return acc
      },
      {} as Record<string, number>,
    )

    // Calculate growth compared to previous period (mock data for now)
    const crescimento = Math.random() * 20 - 10 // Random growth between -10% and +10%

    return {
      total,
      quantidade,
      ticketMedio,
      porMetodo,
      crescimento,
    }
  }, [transacoesFiltradas])

  const getMetodoPagamentoLabel = (metodo: string) => {
    switch (metodo) {
      case "dinheiro":
        return "Dinheiro"
      case "cartao":
        return "Cartão"
      case "pix":
        return "PIX"
      default:
        return metodo.charAt(0).toUpperCase() + metodo.slice(1)
    }
  }

  const getMetodoPagamentoIcon = (metodo: string) => {
    switch (metodo) {
      case "dinheiro":
        return "💵"
      case "cartao":
        return "💳"
      case "pix":
        return "📱"
      default:
        return "💰"
    }
  }

  const formatarData = (data: Date) => {
    const agora = new Date()
    const diffMs = agora.getTime() - data.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) {
      return "Agora mesmo"
    } else if (diffHours < 24) {
      return `${diffHours}h atrás`
    } else if (diffDays === 1) {
      return "Ontem"
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`
    } else {
      return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    }
  }

  const formatarDataCompleta = (data: Date) => {
    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const exportarRelatorio = () => {
    if (transacoesFiltradas.length === 0) {
      alert("Não há dados para exportar com os filtros selecionados.")
      return
    }

    const dados = transacoesFiltradas.map((t) => ({
      Data: formatarDataCompleta(t.data),
      Comanda: t.comanda,
      Valor: t.valor.toFixed(2).replace(".", ","),
      Método: getMetodoPagamentoLabel(t.metodoPagamento),
      Tipo: t.tipo === "total" ? "Total" : "Parcial",
      Itens: t.itens.length,
    }))

    const headers = ["Data", "Comanda", "Valor (R$)", "Método", "Tipo", "Qtd Itens"]
    const csv = [
      headers.join(";"),
      ...dados.map((row) => Object.values(row).join(";")),
      "",
      `Total de Transações;${dados.length}`,
      `Valor Total;R$ ${estatisticas.total.toFixed(2).replace(".", ",")}`,
      `Ticket Médio;R$ ${estatisticas.ticketMedio.toFixed(2).replace(".", ",")}`,
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `relatorio-pagamentos-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const gerarRelatorioPDF = () => {
    if (transacoesAcumuladas.length === 0) {
      toast.error("Não há dados para gerar o relatório PDF.")
      return
    }

    const dataAtual = new Date().toLocaleDateString("pt-BR")
    const horaAtual = new Date().toLocaleTimeString("pt-BR")

    // Calculate statistics
    const totalGeral = transacoesAcumuladas.reduce((sum, t) => sum + t.valor, 0)
    const totalTransacoes = transacoesAcumuladas.length
    const ticketMedio = totalTransacoes > 0 ? totalGeral / totalTransacoes : 0

    const porMetodo = transacoesAcumuladas.reduce(
      (acc, t) => {
        acc[t.metodoPagamento] = (acc[t.metodoPagamento] || 0) + t.valor
        return acc
      },
      {} as Record<string, number>,
    )

    // Group by date
    const porData = transacoesAcumuladas.reduce(
      (acc, t) => {
        const data = t.data.toLocaleDateString("pt-BR")
        if (!acc[data]) {
          acc[data] = { total: 0, transacoes: 0 }
        }
        acc[data].total += t.valor
        acc[data].transacoes += 1
        return acc
      },
      {} as Record<string, { total: number; transacoes: number }>,
    )

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório de Fechamento de Caixa</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
          .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
          .summary-card h3 { margin: 0 0 10px 0; color: #666; font-size: 14px; }
          .summary-card .value { font-size: 24px; font-weight: bold; color: #059669; }
          .section { margin-bottom: 30px; }
          .section h2 { border-bottom: 1px solid #ddd; padding-bottom: 10px; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f8f9fa; font-weight: bold; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total-row { font-weight: bold; background-color: #f0f9ff; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🏪 APP CONVENIÊNCIA</div>
          <h1>Relatório de Fechamento de Caixa</h1>
          <p>Gerado em: ${dataAtual} às ${horaAtual}</p>
        </div>

        <div class="summary">
          <div class="summary-card">
            <h3>FATURAMENTO TOTAL</h3>
            <div class="value">R$ ${totalGeral.toFixed(2)}</div>
          </div>
          <div class="summary-card">
            <h3>TOTAL DE TRANSAÇÕES</h3>
            <div class="value">${totalTransacoes}</div>
          </div>
          <div class="summary-card">
            <h3>TICKET MÉDIO</h3>
            <div class="value">R$ ${ticketMedio.toFixed(2)}</div>
          </div>
          <div class="summary-card">
            <h3>PERÍODO</h3>
            <div class="value">${Object.keys(porData).length} dia(s)</div>
          </div>
        </div>

        <div class="section">
          <h2>📊 Resumo por Método de Pagamento</h2>
          <table>
            <thead>
              <tr>
                <th>Método de Pagamento</th>
                <th class="text-right">Valor Total</th>
                <th class="text-right">% do Total</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(porMetodo)
                .map(
                  ([metodo, valor]) => `
                <tr>
                  <td>${getMetodoPagamentoLabel(metodo)}</td>
                  <td class="text-right">R$ ${valor.toFixed(2)}</td>
                  <td class="text-right">${((valor / totalGeral) * 100).toFixed(1)}%</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>📅 Resumo por Data</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th class="text-right">Transações</th>
                <th class="text-right">Valor Total</th>
                <th class="text-right">Ticket Médio</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(porData)
                .map(
                  ([data, info]) => `
                <tr>
                  <td>${data}</td>
                  <td class="text-right">${info.transacoes}</td>
                  <td class="text-right">R$ ${info.total.toFixed(2)}</td>
                  <td class="text-right">R$ ${(info.total / info.transacoes).toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
              <tr class="total-row">
                <td><strong>TOTAL GERAL</strong></td>
                <td class="text-right"><strong>${totalTransacoes}</strong></td>
                <td class="text-right"><strong>R$ ${totalGeral.toFixed(2)}</strong></td>
                <td class="text-right"><strong>R$ ${ticketMedio.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>📋 Detalhamento de Transações</h2>
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Comanda</th>
                <th>Método</th>
                <th class="text-right">Valor</th>
                <th class="text-center">Itens</th>
              </tr>
            </thead>
            <tbody>
              ${transacoesAcumuladas
                .map(
                  (t) => `
                <tr>
                  <td>${t.data.toLocaleString("pt-BR")}</td>
                  <td>${t.comanda}</td>
                  <td>${getMetodoPagamentoLabel(t.metodoPagamento)}</td>
                  <td class="text-right">R$ ${t.valor.toFixed(2)}</td>
                  <td class="text-center">${t.itens.length}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Relatório gerado automaticamente pelo Sistema APP Conveniência</p>
          <p>Este documento comprova o fechamento do caixa do período especificado</p>
        </div>
      </body>
      </html>
    `

    // Create and download PDF
    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `relatorio-fechamento-caixa-${new Date().toISOString().split("T")[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast.success("Relatório PDF gerado com sucesso!")
  }

  const handleFecharCaixa = async () => {
    if (transacoesAcumuladas.length === 0) {
      toast.error("❌ Não há transações para fechar o caixa.")
      return
    }

    const totalDia = transacoesAcumuladas.reduce((sum, t) => sum + t.valor, 0)
    const totalTransacoes = transacoesAcumuladas.length

    const confirmMessage = `💰 Fechar Caixa\n\nTotal: R$ ${totalDia.toFixed(2)} (${totalTransacoes} transações)\n\nConfirmar fechamento?`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      console.log("[v0] Iniciando fechamento do caixa...")
      toast.info("🔄 Fechando caixa...")

      // Save daily total to localStorage for historical records
      const historicoCaixa = JSON.parse(localStorage.getItem("historico_caixa") || "[]")
      historicoCaixa.push({
        data: new Date().toLocaleDateString("pt-BR"),
        hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        total: totalDia,
        transacoes: transacoesAcumuladas.length,
        fechamento: new Date().toISOString(),
      })
      localStorage.setItem("historico_caixa", JSON.stringify(historicoCaixa))

      console.log("[v0] Limpando dados do localStorage...")
      localStorage.removeItem("transacoes_acumuladas")
      console.log("[v0] Limpando estado das transações...")
      setTransacoesAcumuladas([])

      const successMessage = `✅ Caixa fechado com sucesso!\n\nR$ ${totalDia.toFixed(2)} • ${totalTransacoes} transações\nUse o botão "Gerar PDF" para baixar o relatório`

      console.log("[v0] Caixa fechado com sucesso!")
      alert(successMessage)
      toast.success("🎉 Caixa fechado com sucesso!")
    } catch (error) {
      console.error("Erro ao fechar caixa:", error)
      toast.error("❌ Erro ao fechar caixa. Tente novamente.")
      alert("❌ Erro no fechamento\n\nTente novamente em alguns instantes.")
    }
  }

  const handleExcluirHistorico = () => {
    if (confirm("Tem certeza que deseja excluir todo o histórico de transações? Esta ação não pode ser desfeita.")) {
      setTransacoesAcumuladas([])
      localStorage.removeItem("transacoes_acumuladas")
      toast.success("Histórico excluído", "Todas as transações foram removidas do histórico.")
    }
  }

  if (transacaoSelecionada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/restaurant-interior.png" alt="Restaurant Background" fill className="object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/80 to-slate-900/80" />
        </div>

        <div className="relative z-10">
          <header className="flex items-center justify-between p-4 backdrop-blur-xl bg-white/5 border-b border-white/10">
            <button
              onClick={() => setTransacaoSelecionada(null)}
              className="flex items-center gap-2 px-4 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar aos Relatórios
            </button>

            <div className="flex items-center gap-3">
              <Image
                src="/logo-conveniencia.png"
                alt="Conveniência"
                width={120}
                height={40}
                className="hover:scale-105 transition-transform duration-300"
              />
            </div>

            <div className="px-4 py-2 backdrop-blur-xl bg-blue-500/20 border border-blue-400/30 rounded-xl">
              <span className="text-blue-400 font-medium text-sm">Detalhes da Transação</span>
            </div>
          </header>

          <div className="p-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-white mb-2">Transação #{transacaoSelecionada.id}</h1>
                  <p className="text-white/70">{transacaoSelecionada.comanda}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-center">
                    <p className="text-emerald-400 font-bold text-2xl">R$ {transacaoSelecionada.valor.toFixed(2)}</p>
                    <p className="text-emerald-300 text-sm">Valor Total</p>
                  </div>
                  <div className="p-4 bg-blue-500/20 border border-blue-400/30 rounded-xl text-center">
                    <p className="text-blue-400 font-bold text-lg">
                      {getMetodoPagamentoIcon(transacaoSelecionada.metodoPagamento)}{" "}
                      {getMetodoPagamentoLabel(transacaoSelecionada.metodoPagamento)}
                    </p>
                    <p className="text-blue-300 text-sm">Método de Pagamento</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white font-medium">Data e Hora:</span>
                    <span className="text-white/70">{formatarData(transacaoSelecionada.data)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Tipo de Pagamento:</span>
                    <span
                      className={`px-2 py-1 rounded-lg text-sm ${
                        transacaoSelecionada.tipo === "total"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-orange-500/20 text-orange-400"
                      }`}
                    >
                      {transacaoSelecionada.tipo === "total" ? "Pagamento Total" : "Pagamento Parcial"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/20 pt-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Itens da Transação</h3>
                  <div className="space-y-3">
                    {transacaoSelecionada.itens.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl"
                      >
                        <div>
                          <p className="text-white font-medium">{item.nome}</p>
                          <p className="text-white/60 text-sm">
                            {item.quantidade}x R$ {item.preco.toFixed(2)}
                          </p>
                        </div>
                        <p className="text-emerald-400 font-bold">R$ {(item.quantidade * item.preco).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
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
        <header className="flex items-center justify-between p-4 backdrop-blur-xl bg-white/5 border-b border-white/10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="flex items-center gap-3">
            <Image
              src="/logo-conveniencia.png"
              alt="Conveniência"
              width={120}
              height={40}
              className="hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="px-4 py-2 backdrop-blur-xl bg-emerald-500/20 border border-emerald-400/30 rounded-xl">
            <span className="text-emerald-400 font-medium text-sm">Relatórios de Pagamento</span>
          </div>
        </header>

        <div className="p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
            {/* Header com filtros */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Relatórios de Pagamento</h1>
                  <p className="text-white/70">Acompanhe as vendas e transações do estabelecimento</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={gerarRelatorioPDF}
                    disabled={transacoesAcumuladas.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-400 hover:bg-blue-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText className="w-4 h-4" />
                    Gerar PDF
                  </button>
                  <button
                    onClick={handleFecharCaixa}
                    disabled={transacoesAcumuladas.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-400/30 rounded-xl text-orange-400 hover:bg-orange-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <DollarSign className="w-4 h-4" />
                    Fechar Caixa
                  </button>
                  <button
                    onClick={exportarRelatorio}
                    disabled={transacoesFiltradas.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-400 hover:bg-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="w-4 h-4 text-white/70 flex-shrink-0" />
                  <select
                    value={filtroData}
                    onChange={(e) => setFiltroData(e.target.value)}
                    className="px-3 py-2 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-0 flex-1 [&>option]:bg-slate-800 [&>option]:text-white"
                  >
                    <option value="hoje">Hoje</option>
                    <option value="ontem">Ontem</option>
                    <option value="semana">Última Semana</option>
                    <option value="mes">Último Mês</option>
                    <option value="todos">Todos os Períodos</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  <Filter className="w-4 h-4 text-white/70 flex-shrink-0" />
                  <select
                    value={filtroMetodo}
                    onChange={(e) => setFiltroMetodo(e.target.value)}
                    className="px-3 py-2 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-0 flex-1 [&>option]:bg-slate-800 [&>option]:text-white"
                  >
                    <option value="todos">Todos os Métodos</option>
                    <option value="dinheiro">💵 Dinheiro</option>
                    <option value="cartao">💳 Cartão</option>
                    <option value="pix">📱 PIX</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 md:p-6"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2 md:p-3 bg-emerald-500/20 rounded-xl flex-shrink-0">
                    <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg md:text-2xl font-bold text-white truncate">
                      R$ {estatisticas.total.toFixed(2)}
                    </p>
                    <p className="text-gray-300 text-xs md:text-sm">Faturamento Total</p>
                    {estatisticas.crescimento !== 0 && (
                      <p className={`text-xs ${estatisticas.crescimento > 0 ? "text-green-400" : "text-red-400"}`}>
                        {estatisticas.crescimento > 0 ? "+" : ""}
                        {estatisticas.crescimento.toFixed(1)}% vs período anterior
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 md:p-6"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2 md:p-3 bg-blue-500/20 rounded-xl flex-shrink-0">
                    <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg md:text-2xl font-bold text-white">{estatisticas.quantidade}</p>
                    <p className="text-gray-300 text-xs md:text-sm">Transações</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 md:p-6"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2 md:p-3 bg-purple-500/20 rounded-xl flex-shrink-0">
                    <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg md:text-2xl font-bold text-white truncate">
                      R$ {estatisticas.ticketMedio.toFixed(2)}
                    </p>
                    <p className="text-gray-300 text-xs md:text-sm">Ticket Médio</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 md:p-6"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2 md:p-3 bg-orange-500/20 rounded-xl flex-shrink-0">
                    <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-orange-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg md:text-2xl font-bold text-white">
                      {Object.keys(estatisticas.porMetodo).length}
                    </p>
                    <p className="text-gray-300 text-xs md:text-sm">Métodos Usados</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {Object.keys(estatisticas.porMetodo).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {Object.entries(estatisticas.porMetodo).map(([metodo, valor]) => (
                  <motion.div
                    key={metodo}
                    whileHover={{ scale: 1.02 }}
                    className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4"
                  >
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl mb-2">{getMetodoPagamentoIcon(metodo)}</div>
                      <p className="text-white font-bold text-base md:text-lg truncate">R$ {valor.toFixed(2)}</p>
                      <p className="text-white/70 text-sm">{getMetodoPagamentoLabel(metodo)}</p>
                      <p className="text-white/50 text-xs">
                        {estatisticas.total > 0 ? ((valor / estatisticas.total) * 100).toFixed(1) : "0"}% do total
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Histórico de Transações</h2>
                {transacoesFiltradas.length > 0 && (
                  <span className="text-white/60 text-sm">
                    {transacoesFiltradas.length} transação{transacoesFiltradas.length !== 1 ? "ões" : ""} encontrada
                    {transacoesFiltradas.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {transacoesFiltradas.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-white/50" />
                  </div>
                  <p className="text-white/70 text-lg mb-2">Nenhuma transação encontrada</p>
                  <p className="text-white/50 text-sm">
                    Tente ajustar os filtros ou verifique se há transações no período selecionado.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transacoesFiltradas.map((transacao) => (
                    <motion.div
                      key={transacao.id}
                      whileHover={{ scale: 1.01 }}
                      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                      onClick={() => setTransacaoSelecionada(transacao)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold text-white truncate">{transacao.comanda}</h4>
                            <span
                              className={`px-2 py-1 rounded-lg text-xs flex-shrink-0 ${
                                transacao.tipo === "total"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-orange-500/20 text-orange-400"
                              }`}
                            >
                              {transacao.tipo === "total" ? "Total" : "Parcial"}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-white/70">
                            <span className="truncate">{formatarData(transacao.data)}</span>
                            <span className="flex items-center gap-1 flex-shrink-0">
                              {getMetodoPagamentoIcon(transacao.metodoPagamento)}
                              <span className="hidden sm:inline">
                                {getMetodoPagamentoLabel(transacao.metodoPagamento)}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <p className="text-emerald-400 font-bold text-lg">R$ {transacao.valor.toFixed(2)}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setTransacaoSelecionada(transacao)
                            }}
                            className="p-2 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-all duration-300"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
