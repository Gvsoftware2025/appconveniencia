"use client"

import { useState } from "react"
import { usePedidos } from "@/contexts/pedidos-context"
import { ArrowLeft, BarChart3, Clock, DollarSign, Users } from "lucide-react"
import Image from "next/image"

interface GestaoPedidosProps {
  onBack: () => void
}

export default function GestaoPedidos({ onBack }: GestaoPedidosProps) {
  const { pedidos, mesas } = usePedidos()
  const [filtroStatus, setFiltroStatus] = useState("todos")

  const totalPedidos = (pedidos || []).length
  const pedidosAtivos = (pedidos || []).filter((p) => p.status !== "fechado").length
  const mesasOcupadas = (mesas || []).filter((m) => m.status === "ocupada").length
  const faturamentoTotal = (pedidos || []).reduce((total, pedido) => {
    const pedidoTotal = typeof pedido.total === "number" ? pedido.total : 0
    return total + pedidoTotal
  }, 0)

  const pedidosFiltrados =
    filtroStatus === "todos" ? pedidos || [] : (pedidos || []).filter((p) => p.status === filtroStatus)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-400/30"
      case "preparo":
        return "text-blue-400 bg-blue-500/20 border-blue-400/30"
      case "pronto":
        return "text-green-400 bg-green-500/20 border-green-400/30"
      case "entregue":
        return "text-purple-400 bg-purple-500/20 border-purple-400/30"
      case "fechado":
        return "text-gray-400 bg-gray-500/20 border-gray-400/30"
      default:
        return "text-white/60 bg-white/10 border-white/20"
    }
  }

  if (!pedidos || !mesas) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando dados...</div>
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

          <div className="px-4 py-2 backdrop-blur-xl bg-blue-500/20 border border-blue-400/30 rounded-xl">
            <span className="text-blue-400 font-medium text-sm">Gestão de Pedidos</span>
          </div>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{totalPedidos}</p>
                  <p className="text-white/60 text-sm">Total de Pedidos</p>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{pedidosAtivos}</p>
                  <p className="text-white/60 text-sm">Pedidos Ativos</p>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{mesasOcupadas}</p>
                  <p className="text-white/60 text-sm">Mesas Ocupadas</p>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="text-2xl font-bold text-white">R$ {(faturamentoTotal || 0).toFixed(2)}</p>
                  <p className="text-white/60 text-sm">Faturamento</p>
                </div>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Filtrar Pedidos</h2>
            <div className="flex flex-wrap gap-3">
              {[
                { id: "todos", label: "Todos" },
                { id: "pendente", label: "Pendentes" },
                { id: "preparo", label: "Em Preparo" },
                { id: "pronto", label: "Prontos" },
                { id: "entregue", label: "Entregues" },
                { id: "fechado", label: "Fechados" },
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
            <h2 className="text-xl font-bold text-white mb-4">Lista de Pedidos</h2>

            <div className="space-y-4">
              {pedidosFiltrados.map((pedido) => (
                <div key={pedido.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-white font-bold">Pedido #{pedido.id}</span>
                        <span className="text-white/60">Mesa {pedido.mesaId}</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(pedido.status)}`}
                        >
                          {pedido.status
                            ? pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1)
                            : "Indefinido"}
                        </span>
                      </div>
                      <div className="text-white/80 text-sm">
                        {(pedido.itens || []).map((item, index) => (
                          <span key={index}>
                            {item.quantidade}x {item.nome}
                            {index < (pedido.itens || []).length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold text-lg">R$ {(pedido.total || 0).toFixed(2)}</p>
                      <p className="text-white/60 text-sm">{new Date(pedido.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ))}

              {pedidosFiltrados.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-white/60 text-lg">Nenhum pedido encontrado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
