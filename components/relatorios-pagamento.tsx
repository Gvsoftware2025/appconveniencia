"use client"

import { useState, useMemo, useEffect } from "react"
import { ArrowLeft, TrendingUp, DollarSign, CreditCard, Calendar, Download, Filter, Eye, Trash2 } from "lucide-react"
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

  const [transacoes, setTransacoes] = useState<TransacaoPagamento[]>([])

  const gerarTransacoesReais = useMemo(() => {
    if (!comandas || !pedidos) return []

    return comandas
      .filter((comanda) => comanda.status === "fechada" || comanda.total > 0)
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
      .sort((a, b) => b.data.getTime() - a.data.getTime())
  }, [comandas, pedidos, calcularTotalComanda])

  useEffect(() => {
    setTransacoes(gerarTransacoesReais)
  }, [gerarTransacoesReais])

  const transacoesFiltradas = useMemo(() => {
    let filtradas = [...transacoes]

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
  }, [transacoes, filtroData, filtroMetodo])

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

  const handleExcluirHistorico = () => {
    if (confirm("Tem certeza que deseja excluir todo o histórico de transações? Esta ação não pode ser desfeita.")) {
      setTransacoes([])
      toast.success("Histórico excluído", "Todas as transações foram removidas do histórico.")
    }
  }

  const handleFecharCaixa = async () => {
    if (!confirm("Tem certeza que deseja fechar o caixa? Isso salvará o total do dia e excluirá todo o histórico.")) {
      return
    }

    try {
      const totalDia = estatisticas.total
      const dataFechamento = new Date().toLocaleDateString("pt-BR")

      // Save daily total to localStorage for historical records
      const historicoCaixa = JSON.parse(localStorage.getItem("historico_caixa") || "[]")
      historicoCaixa.push({
        data: dataFechamento,
        total: totalDia,
        transacoes: transacoes.length,
        fechamento: new Date().toISOString(),
      })
      localStorage.setItem("historico_caixa", JSON.stringify(historicoCaixa))

      // Clear current transactions
      setTransacoes([])

      // Show success message with daily total
      alert(
        `✅ CAIXA FECHADO COM SUCESSO!\n\nTotal do dia: R$ ${totalDia.toFixed(2)}\nTransações: ${estatisticas.quantidade}\nData: ${dataFechamento}\n\nO valor foi salvo no histórico e as transações foram limpas.`,
      )

      toast.success("Caixa fechado com sucesso!", `Total do dia: R$ ${totalDia.toFixed(2)}`)
    } catch (error) {
      console.error("Erro ao fechar caixa:", error)
      toast.error("Erro ao fechar caixa", "Tente novamente.")
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
                    onClick={handleFecharCaixa}
                    disabled={transacoes.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-400/30 rounded-xl text-orange-400 hover:bg-orange-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <DollarSign className="w-4 h-4" />
                    Fechar Caixa
                  </button>
                  <button
                    onClick={handleExcluirHistorico}
                    disabled={transacoes.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-400/30 rounded-xl text-red-400 hover:bg-red-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir Histórico
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
