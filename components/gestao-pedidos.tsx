"use client"

import { useState, useEffect } from "react"
import { usePedidos } from "@/contexts/pedidos-context"
import { ArrowLeft, BarChart3, Clock, Users, Settings, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { PrintNotification } from "@/components/print-notification"
import { usePrintStatus } from "@/hooks/use-print-status"

interface GestaoPedidosProps {
  onBack: () => void
  onPasswordSettings?: () => void
  initialComandaId?: string
}

export default function GestaoPedidos({ onBack, onPasswordSettings, initialComandaId }: GestaoPedidosProps) {
  const { pedidos, comandas, getPedidosByComanda, calcularTotalComanda, refreshData } = usePedidos()
  const { markAsPrinted } = usePrintStatus()
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [expandedComandas, setExpandedComandas] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (initialComandaId) {
      console.log("[v0] Gestão: Auto-expanding comanda:", initialComandaId)
      setExpandedComandas(new Set([initialComandaId]))
    }
  }, [initialComandaId])

  useEffect(() => {
    const handleFocus = () => {
      console.log("[v0] Window focused, refreshing gestao data...")
      refreshData()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("[v0] Tab became visible, refreshing gestao data...")
        refreshData()
      }
    }

    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [refreshData])

  const handleAutoPrint = (comanda: any) => {
    console.log("[v0] Gestão: Marcando comanda como impressa:", comanda.numero_comanda)
    markAsPrinted(comanda.id)
  }

  const toggleComandaExpanded = (comandaId: string) => {
    console.log("[v0] Gestão: Toggling comanda expansion:", comandaId)
    setExpandedComandas((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(comandaId)) {
        newSet.delete(comandaId)
      } else {
        newSet.add(comandaId)
      }
      return newSet
    })
  }

  const totalComandas = (comandas || []).length
  const comandasAtivas = (comandas || []).filter((c) => c.status === "aberta").length
  const comandasComPedidos = (comandas || []).filter((c) => {
    const pedidosDaComanda = getPedidosByComanda(c.id)
    return pedidosDaComanda.length > 0
  }).length

  const getComandaStatus = (comandaId: string) => {
    const pedidosDaComanda = getPedidosByComanda(comandaId)
    if (pedidosDaComanda.length === 0) return "sem_pedidos"

    const statusCounts = pedidosDaComanda.reduce(
      (acc, pedido) => {
        const status = pedido.status || "preparando"
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    if (statusCounts.entregue === pedidosDaComanda.length) return "entregue"
    if (statusCounts.pronto > 0) return "pronto"
    if (statusCounts.preparando > 0) return "preparando"
    return "preparando"
  }

  const comandasFiltradas =
    filtroStatus === "todos"
      ? comandas || []
      : (comandas || []).filter((c) => {
          const status = getComandaStatus(c.id)
          return status === filtroStatus
        })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparando":
        return "text-blue-400 bg-blue-500/20 border-blue-400/30"
      case "pronto":
        return "text-green-400 bg-green-500/20 border-green-400/30"
      case "entregue":
        return "text-purple-400 bg-purple-500/20 border-purple-400/30"
      case "sem_pedidos":
        return "text-gray-400 bg-gray-500/20 border-gray-400/30"
      default:
        return "text-white/60 bg-white/10 border-white/20"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "preparando":
        return "Preparando"
      case "pronto":
        return "Pronto"
      case "entregue":
        return "Entregue"
      case "sem_pedidos":
        return "Sem Pedidos"
      default:
        return "Indefinido"
    }
  }

  if (!pedidos || !comandas) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando dados...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <PrintNotification
        comandas={comandasAtivas ? (comandas || []).filter((c) => c.status === "aberta") : []}
        onPrintComanda={handleAutoPrint}
      />

      <div className="absolute inset-0">
        <Image src="/restaurant-background.png" alt="Restaurant Background" fill className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/80 to-slate-900/80" />
      </div>

      <div className="relative z-10">
        <header className="flex items-center justify-between p-4 backdrop-blur-xl bg-white/5 border-b border-white/10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 backdrop-blur-xl bg-slate-700/60 border border-white/20 rounded-xl text-white hover:bg-slate-700/80 transition-all duration-300"
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

          <div className="flex items-center gap-3">
            {onPasswordSettings && (
              <button
                onClick={onPasswordSettings}
                className="flex items-center gap-2 px-4 py-2 backdrop-blur-xl bg-slate-700/60 border border-white/20 rounded-xl text-white hover:bg-slate-700/80 transition-all duration-300"
              >
                <Settings className="w-4 h-4" />
                Configurar Senha
              </button>
            )}
            <div className="px-4 py-2 backdrop-blur-xl bg-blue-500/20 border border-blue-400/30 rounded-xl">
              <span className="text-blue-400 font-medium text-sm">Gestão de Pedidos</span>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{totalComandas}</p>
                  <p className="text-white/60 text-sm">Total de Comandas</p>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{comandasAtivas}</p>
                  <p className="text-white/60 text-sm">Comandas Ativas</p>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{comandasComPedidos}</p>
                  <p className="text-white/60 text-sm">Comandas com Pedidos</p>
                </div>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Filtrar Comandas</h2>
            <div className="flex flex-wrap gap-3">
              {[
                { id: "todos", label: "Todos" },
                { id: "preparando", label: "Em Preparo" },
                { id: "pronto", label: "Prontos" },
                { id: "entregue", label: "Entregues" },
                { id: "sem_pedidos", label: "Sem Pedidos" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFiltroStatus(id)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    filtroStatus === id
                      ? "bg-emerald-500/20 border border-emerald-400/50 text-emerald-400"
                      : "backdrop-blur-xl bg-white/5 border border-white/20 text-white hover:bg-white/10"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Lista de Comandas</h2>

            <div className="space-y-4">
              {comandasFiltradas.map((comanda) => {
                const pedidosDaComanda = getPedidosByComanda(comanda.id)
                const statusComanda = getComandaStatus(comanda.id)
                const totalComanda = calcularTotalComanda(comanda.id)
                const isExpanded = expandedComandas.has(comanda.id)

                return (
                  <div
                    key={comanda.id}
                    className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleComandaExpanded(comanda.id)}
                      className="w-full p-4 hover:bg-white/5 transition-colors duration-200"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-white font-bold">Comanda: {comanda.numero_comanda}</span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(statusComanda)}`}
                            >
                              {getStatusLabel(statusComanda)}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-white/60" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-white/60" />
                            )}
                          </div>
                          <div className="text-white/80 text-sm">
                            {pedidosDaComanda.length > 0 ? (
                              pedidosDaComanda.slice(0, 3).map((pedido, index) => (
                                <span key={pedido.id}>
                                  {pedido.quantidade}x {pedido.produto?.nome || "Produto não encontrado"}
                                  {index < Math.min(2, pedidosDaComanda.length - 1) ? ", " : ""}
                                </span>
                              ))
                            ) : (
                              <span className="text-white/60">Nenhum item pedido</span>
                            )}
                            {pedidosDaComanda.length > 3 && !isExpanded && (
                              <span className="text-white/60"> ... e mais {pedidosDaComanda.length - 3} itens</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-bold text-lg">R$ {totalComanda.toFixed(2)}</p>
                          <p className="text-white/60 text-sm">{new Date(comanda.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </button>

                    {isExpanded && pedidosDaComanda.length > 0 && (
                      <div className="border-t border-white/10 p-4 bg-white/5">
                        <h3 className="text-white font-semibold mb-3">Detalhes dos Pedidos:</h3>
                        <div className="space-y-2">
                          {pedidosDaComanda.map((pedido) => (
                            <div
                              key={pedido.id}
                              className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="text-white font-medium">
                                  {pedido.quantidade}x {pedido.produto?.nome || "Produto não encontrado"}
                                </p>
                                {pedido.observacoes && (
                                  <p className="text-white/60 text-sm mt-1">Obs: {pedido.observacoes}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-emerald-400 font-semibold">
                                  R$ {((pedido.produto?.preco || 0) * pedido.quantidade).toFixed(2)}
                                </p>
                                <span
                                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium border mt-1 ${getStatusColor(pedido.status || "preparando")}`}
                                >
                                  {getStatusLabel(pedido.status || "preparando")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                          <span className="text-white font-semibold">Total da Comanda:</span>
                          <span className="text-emerald-400 font-bold text-xl">R$ {totalComanda.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {comandasFiltradas.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-white/60 text-lg">Nenhuma comanda encontrada</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
