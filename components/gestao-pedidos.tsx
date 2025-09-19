"use client"
import { usePedidos } from "@/contexts/pedidos-context"
import { ArrowLeft, BarChart3, Clock, Settings } from "lucide-react"
import Image from "next/image"

interface GestaoPedidosProps {
  onBack: () => void
  onPasswordSettings?: () => void
}

export default function GestaoPedidos({ onBack, onPasswordSettings }: GestaoPedidosProps) {
  const { pedidos, comandas, getPedidosByComanda, calcularTotalComanda } = usePedidos()
  const totalComandas = (comandas || []).length
  const comandasAtivas = (comandas || []).filter((c) => c.status === "aberta").length
  const todasComandas = comandas || []

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

  if (!pedidos || !comandas) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando dados...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Lista de Comandas</h2>

            <div className="space-y-4">
              {todasComandas.map((comanda) => {
                const pedidosDaComanda = getPedidosByComanda(comanda.id)
                const totalComanda = calcularTotalComanda(comanda.id)

                return (
                  <div key={comanda.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white font-bold">Comanda: {comanda.numero_comanda}</span>
                        </div>
                        <div className="text-white/80 text-sm">
                          {pedidosDaComanda.length > 0 ? (
                            pedidosDaComanda.map((pedido, index) => (
                              <span key={pedido.id}>
                                {pedido.quantidade}x {pedido.produto?.nome || "Produto não encontrado"}
                                {index < pedidosDaComanda.length - 1 ? ", " : ""}
                              </span>
                            ))
                          ) : (
                            <span className="text-white/60">Nenhum item pedido</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold text-lg">R$ {totalComanda.toFixed(2)}</p>
                        <p className="text-white/60 text-sm">{new Date(comanda.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )
              })}

              {todasComandas.length === 0 && (
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
