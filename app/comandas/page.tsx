"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Eye, CreditCard, Users, Clock } from "lucide-react"
import { usePedidos } from "@/contexts/pedidos-context"
import Image from "next/image"
import { useInterface } from "@/contexts/interface-context"

export default function ComandasPage() {
  const router = useRouter()
  const { comandas, getPedidosByComanda, calcularTotalComanda, pedidos, products } = usePedidos()
  const [filtro, setFiltro] = useState<"todas" | "abertas" | "fechadas">("abertas")
  const { setActiveInterface } = useInterface()

  useEffect(() => {
    setActiveInterface("comandas")
    return () => setActiveInterface(null)
  }, [setActiveInterface])

  const comandasFiltradas = comandas.filter((comanda) => {
    if (filtro === "todas") return true
    return comanda.status === filtro.slice(0, -1)
  })

  const comandasAbertas = comandas.filter((comanda) => comanda.status === "aberta")

  const getOriginalComandaName = (numeroComanda: string) => {
    if (!numeroComanda) return "Comanda"
    return numeroComanda.replace(/-\d+$/, "")
  }

  const formatarTempo = (dataHora: string) => {
    const data = new Date(dataHora)
    const agora = new Date()
    const diffMs = agora.getTime() - data.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 60) return `${diffMins}min atrás`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h atrás`
    return `${Math.floor(diffMins / 1440)}d atrás`
  }

  const handleAutoPrint = (comanda: any) => {
    const pedidosComanda = pedidos?.filter((pedido) => pedido.comanda_id === comanda.id) || []

    if (pedidosComanda.length > 0) {
      const pedidosParaImprimir = pedidosComanda.map((pedido) => {
        const produto = products.find((p) => p.id === pedido.produto_id)
        return {
          ...pedido,
          produto: produto || {
            id: pedido.produto_id,
            nome: "Produto não encontrado",
            preco: pedido.preco_unitario || 0,
            categoria_id: "",
          },
        }
      })
    }
  }

  const handleVerDetalhes = (comandaId: string) => {
    console.log("[v0] Comandas: Ver detalhes clicked for comanda:", comandaId)
    router.push(`/gestao?comanda=${comandaId}`)
  }

  const handleFecharConta = (numeroComanda: string) => {
    console.log("[v0] Comandas: Fechar conta clicked for comanda:", numeroComanda)
    router.push(`/pagamento?mesa=${numeroComanda}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      <div className="relative z-10">
        <header className="flex items-center justify-between p-4 backdrop-blur-xl bg-white/5 border-b border-white/10">
          <button
            onClick={() => router.push("/")}
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
            <span className="text-blue-400 font-medium text-sm">Comandas</span>
          </div>
        </header>

        <div className="p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Comandas</h1>
                  <p className="text-gray-300">Visualize e gerencie todas as comandas do estabelecimento</p>
                </div>

                <div className="flex gap-2">
                  {[
                    { id: "abertas", label: "Abertas", count: comandas.filter((c) => c.status === "aberta").length },
                    {
                      id: "fechadas",
                      label: "Fechadas",
                      count: comandas.filter((c) => c.status === "fechada").length,
                    },
                    { id: "todas", label: "Todas", count: comandas.length },
                  ].map(({ id, label, count }) => (
                    <button
                      key={id}
                      onClick={() => setFiltro(id as any)}
                      className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                        filtro === id
                          ? "bg-blue-500/30 border-2 border-blue-400/50 text-blue-400"
                          : "bg-white/5 border border-white/20 text-white hover:bg-white/10"
                      }`}
                    >
                      {label} ({count})
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="backdrop-blur-xl bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-6 text-center"
                >
                  <div className="flex items-center justify-center gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-xl">
                      <Users className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">
                        {comandas.filter((c) => c.status === "aberta").length}
                      </p>
                      <p className="text-emerald-300">Comandas Abertas</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="backdrop-blur-xl bg-blue-500/10 border border-blue-400/30 rounded-xl p-6 text-center"
                >
                  <div className="flex items-center justify-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <CreditCard className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">
                        R${" "}
                        {comandas
                          .filter((c) => c.status === "aberta")
                          .reduce((total, c) => total + calcularTotalComanda(c.id), 0)
                          .toFixed(2)}
                      </p>
                      <p className="text-blue-300">Total em Aberto</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="backdrop-blur-xl bg-purple-500/10 border border-purple-400/30 rounded-xl p-6 text-center"
                >
                  <div className="flex items-center justify-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                      <Clock className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">{comandas.length}</p>
                      <p className="text-purple-300">Total de Comandas</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">
                {filtro === "abertas"
                  ? "Comandas Abertas"
                  : filtro === "fechadas"
                    ? "Comandas Fechadas"
                    : "Todas as Comandas"}
              </h2>

              {comandasFiltradas.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/60 text-lg">Nenhuma comanda encontrada</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comandasFiltradas.map((comanda) => {
                    const pedidosDaComanda = getPedidosByComanda(comanda.id)
                    const totalComanda = calcularTotalComanda(comanda.id)
                    const isAberta = comanda.status === "aberta"

                    return (
                      <motion.div
                        key={comanda.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        className={`backdrop-blur-xl border rounded-xl p-5 transition-all duration-300 ${
                          isAberta
                            ? "bg-white/10 border-white/20 hover:bg-white/15"
                            : "bg-gray-800/30 border-gray-700/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-white text-lg">
                            {getOriginalComandaName(comanda.numero_comanda)}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-medium ${
                              isAberta
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-400/30"
                                : "bg-gray-600/20 text-gray-400 border border-gray-600/30"
                            }`}
                          >
                            {isAberta ? "ABERTA" : "FECHADA"}
                          </span>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-white/60 text-sm">Total:</span>
                            <span className="text-emerald-400 font-bold text-lg">R$ {totalComanda.toFixed(2)}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-white/60 text-sm">Itens:</span>
                            <span className="text-white font-medium">{pedidosDaComanda.length}</span>
                          </div>

                          {comanda.data_hora && (
                            <div className="flex items-center justify-between">
                              <span className="text-white/60 text-sm">Aberta há:</span>
                              <span className="text-white/80 text-sm">{formatarTempo(comanda.data_hora)}</span>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-white/10 pt-4 space-y-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVerDetalhes(comanda.id)
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-all duration-300 font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Detalhes
                          </button>

                          {isAberta && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleFecharConta(comanda.numero_comanda)
                              }}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-all duration-300 font-medium"
                            >
                              <CreditCard className="w-4 h-4" />
                              Fechar Conta
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
