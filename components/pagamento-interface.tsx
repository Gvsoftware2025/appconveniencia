"use client"

import { useState, useEffect, useMemo } from "react"
import { ArrowLeft, CreditCard, Banknote, Smartphone, Check, Users, Minus, Plus, Calculator } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import { usePedidos } from "@/contexts/pedidos-context"

interface PagamentoInterfaceProps {
  onBack: () => void
  mesaId?: string // Changed to string to accept comanda name
}

interface ItemPagamento {
  pedidoId: string
  produtoNome: string
  precoUnitario: number
  quantidadeTotal: number
  quantidadePaga: number
  quantidadeRestante: number
}

interface DivisaoConta {
  numeroPessoas: number
  valorPorPessoa: number
  itensIndividuais: ItemPagamento[]
}

export default function PagamentoInterface({ onBack, mesaId }: PagamentoInterfaceProps) {
  const { comandas, pedidos, finalizarComanda, getPedidosByComanda, calcularTotalComanda } = usePedidos()

  const [metodoPagamento, setMetodoPagamento] = useState("")
  const [processando, setProcessando] = useState(false)
  const [contaFechada, setContaFechada] = useState(false)
  const [comandaSelecionada, setComandaSelecionada] = useState<any>(null)
  const [incluirTaxaServico, setIncluirTaxaServico] = useState(false)
  const [valorPago, setValorPago] = useState("")
  const [mostrarTroco, setMostrarTroco] = useState(false)
  const [modoPagamento, setModoPagamento] = useState<"total" | "parcial" | "dividir" | "itens">("total")
  const [itensPagamento, setItensPagamento] = useState<ItemPagamento[]>([])
  const [valorPagamentoParcial, setValorPagamentoParcial] = useState("")
  const [itensSelecionados, setItensSelecionados] = useState<{ [key: string]: number }>({})
  const [divisaoConta, setDivisaoConta] = useState<DivisaoConta>({
    numeroPessoas: 2,
    valorPorPessoa: 0,
    itensIndividuais: [],
  })
  const [itensPagos, setItensPagos] = useState<ItemPagamento[]>([])
  const [subModoParcial, setSubModoParcial] = useState<"valor" | "itens">("valor")

  const comandasAbertas = useMemo(() => {
    console.log("[v0] Todas as comandas:", comandas)
    const abertas = (comandas || []).filter((comanda) => {
      console.log("[v0] Comanda:", comanda?.numero_comanda, "Status:", comanda?.status)
      return comanda && comanda.status === "aberta"
    })
    console.log("[v0] Comandas abertas filtradas:", abertas)
    return abertas
  }, [comandas])

  const getOriginalComandaName = (numeroComanda: string) => {
    if (!numeroComanda) return "Comanda"
    // Remove timestamp suffix (everything after last dash followed by numbers)
    return numeroComanda.replace(/-\d+$/, "")
  }

  useEffect(() => {
    if (mesaId && comandas) {
      const comanda = comandas.find((c) => c.numero_comanda === mesaId || c.id === mesaId)
      if (comanda) {
        setComandaSelecionada(comanda)
      }
    }
  }, [mesaId, comandas])

  const pedidosDaComandaSelecionada = useMemo(() => {
    if (!comandaSelecionada) return []
    return getPedidosByComanda(comandaSelecionada.id)
  }, [comandaSelecionada, getPedidosByComanda])

  const valorTotal = useMemo(() => {
    if (!comandaSelecionada) return 0
    const totalBruto = calcularTotalComanda(comandaSelecionada.id)
    const totalPago = itensPagos.reduce((total, item) => total + item.quantidadePaga * item.precoUnitario, 0)
    return totalBruto - totalPago
  }, [comandaSelecionada, calcularTotalComanda, itensPagos])

  const valorOriginalComanda = useMemo(() => {
    if (!comandaSelecionada) return 0
    return calcularTotalComanda(comandaSelecionada.id)
  }, [comandaSelecionada, calcularTotalComanda])

  const valorJaPago = useMemo(() => {
    return itensPagos.reduce((total, item) => total + item.quantidadePaga * item.precoUnitario, 0)
  }, [itensPagos])

  const taxaServico = useMemo(() => {
    return incluirTaxaServico ? valorTotal * 0.1 : 0
  }, [incluirTaxaServico, valorTotal])

  const totalFinal = useMemo(() => {
    return valorTotal + taxaServico
  }, [valorTotal, taxaServico])

  const calcularTotalParcial = () => {
    const subtotal = itensPagamento.reduce((total, item) => total + item.quantidadePaga * item.precoUnitario, 0)
    const taxa = incluirTaxaServico ? subtotal * 0.1 : 0
    return subtotal + taxa
  }

  const calcularDivisaoConta = () => {
    const total = modoPagamento === "parcial" ? calcularTotalParcial() : totalFinal
    return total / divisaoConta.numeroPessoas
  }

  const calcularTroco = () => {
    const valorPagoNum = Number.parseFloat(valorPago) || 0
    const total =
      modoPagamento === "dividir"
        ? calcularDivisaoConta()
        : modoPagamento === "parcial"
          ? subModoParcial === "valor"
            ? valorPagamentoParcial && Number.parseFloat(valorPagamentoParcial) > 0
              ? Number.parseFloat(valorPagamentoParcial) +
                (incluirTaxaServico ? Number.parseFloat(valorPagamentoParcial) * 0.1 : 0)
              : 0
            : calcularTotalItensSelecionados() + (incluirTaxaServico ? calcularTotalItensSelecionados() * 0.1 : 0)
          : totalFinal
    return valorPagoNum - total
  }

  const calcularRestanteParcial = () => {
    const valorPagoNum = Number.parseFloat(valorPagamentoParcial) || 0
    const totalComanda = valorTotal + (incluirTaxaServico ? valorTotal * 0.1 : 0)
    return Math.max(0, totalComanda - valorPagoNum)
  }

  const handleQuantidadeChange = (pedidoId: string, novaQuantidade: number) => {
    setItensPagamento((prev) =>
      prev.map((item) => {
        if (item.pedidoId === pedidoId) {
          const quantidadePaga = Math.max(0, Math.min(novaQuantidade, item.quantidadeTotal))
          return {
            ...item,
            quantidadePaga,
            quantidadeRestante: item.quantidadeTotal - quantidadePaga,
          }
        }
        return item
      }),
    )
  }

  const handleComandaChange = (comanda: any) => {
    setComandaSelecionada(comanda)
    setModoPagamento("total")
    setMetodoPagamento("")
    setValorPago("")
    setValorPagamentoParcial("")
    setMostrarTroco(false)
    setItensPagos([])
    setItensPagamento([])
    setItensSelecionados({})
  }

  const handleFecharConta = async () => {
    if (!metodoPagamento || !comandaSelecionada) return

    if (metodoPagamento === "dinheiro") {
      const troco = calcularTroco()
      console.log(
        "[v0] Valor pago:",
        valorPago,
        "Total:",
        modoPagamento === "parcial" ? calcularTotalParcial() : totalFinal,
        "Troco:",
        troco,
      )
      if (troco < 0) {
        alert(`Valor insuficiente! Falta R$ ${Math.abs(troco).toFixed(2)}`)
        return
      }
    }

    setProcessando(true)

    try {
      if (modoPagamento === "total") {
        await finalizarComanda(comandaSelecionada.id)
      } else if (modoPagamento === "parcial") {
        const valorPagoNum = Number.parseFloat(valorPagamentoParcial) || 0
        if (valorPagoNum > 0) {
          const novoItemPago: ItemPagamento = {
            pedidoId: `pagamento-${Date.now()}`,
            produtoNome: "Pagamento Parcial",
            precoUnitario: valorPagoNum,
            quantidadeTotal: 1,
            quantidadePaga: 1,
            quantidadeRestante: 0,
          }

          setItensPagos((prev) => [...prev, novoItemPago])
        }

        setMetodoPagamento("")
        setValorPago("")
        setValorPagamentoParcial("")
        setMostrarTroco(false)
        setProcessando(false)
        return
      } else if (modoPagamento === "itens") {
        const itensSelecionadosArray = Object.keys(itensSelecionados).map((key) => ({
          pedidoId: key,
          produtoNome: pedidos.find((p) => p.id === key)?.produto?.nome || "Produto não encontrado",
          precoUnitario: pedidos.find((p) => p.id === key)?.preco_unitario || 0,
          quantidadeTotal: itensSelecionados[key],
          quantidadePaga: itensSelecionados[key],
          quantidadeRestante: 0,
        }))

        setItensPagos((prev) => [...prev, ...itensSelecionadosArray])
        setMetodoPagamento("")
        setValorPago("")
        setValorPagamentoParcial("")
        setMostrarTroco(false)
        setProcessando(false)
        return
      }

      setContaFechada(true)
      setProcessando(false)

      setTimeout(() => {
        setComandaSelecionada(null)
        setMetodoPagamento("")
        setValorPago("")
        setMostrarTroco(false)
        setContaFechada(false)
        setModoPagamento("total")
        setItensPagamento([])
        setDivisaoConta({ numeroPessoas: 2, valorPorPessoa: 0, itensIndividuais: [] })
        setItensPagos([])
        setItensSelecionados({})
        // onBack() removed - user stays in payment interface
      }, 2000)
    } catch (error) {
      console.error("[v0] Erro ao fechar conta:", error)
      setProcessando(false)
      alert("Erro ao fechar conta. Tente novamente.")
    }
  }

  const handleMetodoPagamento = (metodo: string) => {
    setMetodoPagamento(metodo)
    if (metodo === "dinheiro") {
      setMostrarTroco(true)
    } else {
      setMostrarTroco(false)
      setValorPago("")
    }
  }

  const handleItemSelection = (pedidoId: string, quantidade: number) => {
    setItensSelecionados((prev) => ({
      ...prev,
      [pedidoId]: Math.max(0, quantidade),
    }))
  }

  const calcularTotalItensSelecionados = () => {
    return pedidosDaComandaSelecionada.reduce((total, pedido) => {
      const quantidadeSelecionada = itensSelecionados[pedido.id] || 0
      return total + quantidadeSelecionada * (pedido.preco_unitario || 0)
    }, 0)
  }

  useEffect(() => {
    if (comandaSelecionada && pedidosDaComandaSelecionada.length > 0) {
      const novosItens = pedidosDaComandaSelecionada
        .map((pedido) => {
          const itemJaPago = itensPagos.find((pago) => pago.pedidoId === pedido.id)
          const quantidadeJaPaga = itemJaPago ? itemJaPago.quantidadePaga : 0
          const quantidadeRestante = pedido.quantidade - quantidadeJaPaga

          console.log(
            "[v0] Pedido:",
            pedido.produto?.nome,
            "Total:",
            pedido.quantidade,
            "Pago:",
            quantidadeJaPaga,
            "Restante:",
            quantidadeRestante,
          )

          return {
            pedidoId: pedido.id,
            produtoNome: pedido.produto?.nome || "Produto não encontrado",
            precoUnitario: pedido.preco_unitario || 0,
            quantidadeTotal: quantidadeRestante,
            quantidadePaga: 0,
            quantidadeRestante: quantidadeRestante,
          }
        })
        .filter((item) => item.quantidadeTotal > 0)

      console.log("[v0] Novos itens para pagamento:", novosItens)
      setItensPagamento(novosItens)
    }
  }, [comandaSelecionada, pedidosDaComandaSelecionada.length, itensPagos])

  if (contaFechada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/restaurant-interior.png" alt="Restaurant Background" fill className="object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/80 to-slate-900/80" />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 text-center max-w-md w-full"
          >
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Conta Fechada!</h2>
            <p className="text-white/80 mb-4">
              {getOriginalComandaName(comandaSelecionada?.numero_comanda)} finalizada com sucesso
            </p>
            <p className="text-sm text-white/60">Voltando ao painel...</p>
          </motion.div>
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
            onClick={comandaSelecionada ? () => setComandaSelecionada(null) : onBack}
            className="flex items-center gap-2 px-4 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            {comandaSelecionada ? "Voltar às Comandas" : "Voltar"}
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
            <span className="text-emerald-400 font-medium text-sm">Sistema de Pagamento</span>
          </div>
        </header>

        <div className="p-6">
          {!comandaSelecionada ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">Sistema de Pagamento</h1>
                <p className="text-white/70">Selecione uma comanda para fechar a conta</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500/20 rounded-xl">
                      <Users className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">{comandasAbertas.length}</p>
                      <p className="text-gray-300">Comandas Abertas</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-xl">
                      <CreditCard className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">
                        R$ {calcularTotalComanda(comandasAbertas[0].id).toFixed(2)}
                      </p>
                      <p className="text-gray-300">Valor Total</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">
                        {Math.round(pedidos.length / comandasAbertas.length)}
                      </p>
                      <p className="text-gray-300">Itens por Comanda</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Comandas Abertas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comandasAbertas.map((comanda) => {
                    const pedidosDaComanda = getPedidosByComanda(comanda.id)
                    const totalComanda = calcularTotalComanda(comanda.id)

                    return (
                      <motion.button
                        key={comanda.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleComandaChange(comanda)}
                        className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all duration-300 text-left"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-white">{getOriginalComandaName(comanda.numero_comanda)}</h4>
                          <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-sm">ATIVA</span>
                        </div>
                        <p className="text-emerald-400 font-bold text-lg mb-2">R$ {totalComanda.toFixed(2)}</p>
                        <p className="text-white/60 text-sm">{pedidosDaComanda.length} itens</p>
                        <p className="text-white/60 text-sm">Clique para fechar conta</p>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl mx-auto">
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 mb-6">
                <h1 className="text-2xl font-bold text-white mb-4">
                  Fechar Conta - {getOriginalComandaName(comandaSelecionada.numero_comanda)}
                </h1>

                <div className="mb-6">
                  <label className="block text-white font-medium mb-3">Tipo de Pagamento</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { id: "total", label: "Conta Total", icon: CreditCard },
                      { id: "parcial", label: "Pagamento Parcial", icon: Calculator },
                      { id: "dividir", label: "Dividir Conta", icon: Users },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setModoPagamento(id as any)}
                        className={`p-3 backdrop-blur-xl border rounded-xl transition-all duration-300 flex flex-col items-center gap-2 text-sm ${
                          modoPagamento === id
                            ? "bg-blue-500/20 border-blue-400/50 text-blue-400"
                            : "bg-white/5 border-white/20 text-white hover:bg-white/10"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {modoPagamento === "parcial" && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Pagamento Parcial</h3>

                    <div className="mb-4 p-4 backdrop-blur-xl bg-purple-500/10 border border-purple-400/30 rounded-xl">
                      <div className="text-center">
                        <p className="text-purple-400 font-bold text-2xl">R$ {valorOriginalComanda.toFixed(2)}</p>
                        <p className="text-purple-300 text-sm">Valor Total da Compra</p>
                        {incluirTaxaServico && (
                          <p className="text-purple-300/70 text-xs mt-1">(Inclui taxa de serviço de 10%)</p>
                        )}
                      </div>
                    </div>

                    {valorJaPago > 0 && (
                      <div className="mb-4 grid grid-cols-2 gap-3">
                        <div className="p-3 bg-green-500/20 border border-green-400/30 rounded-lg text-center">
                          <p className="text-green-400 font-bold text-lg">R$ {valorJaPago.toFixed(2)}</p>
                          <p className="text-green-300 text-sm">Já Pago</p>
                        </div>
                        <div className="p-3 bg-orange-500/20 border border-orange-400/30 rounded-lg text-center">
                          <p className="text-orange-400 font-bold text-lg">R$ {valorTotal.toFixed(2)}</p>
                          <p className="text-orange-300 text-sm">Restante</p>
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <div className="flex gap-2 mb-4">
                        <button
                          onClick={() => setSubModoParcial("valor")}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            subModoParcial === "valor"
                              ? "bg-blue-500/20 border border-blue-400/50 text-blue-400"
                              : "bg-white/5 border border-white/20 text-white hover:bg-white/10"
                          }`}
                        >
                          Por Valor
                        </button>
                        <button
                          onClick={() => setSubModoParcial("itens")}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            subModoParcial === "itens"
                              ? "bg-blue-500/20 border border-blue-400/50 text-blue-400"
                              : "bg-white/5 border border-white/20 text-white hover:bg-white/10"
                          }`}
                        >
                          Por Itens
                        </button>
                      </div>

                      {subModoParcial === "valor" && (
                        <div className="p-4 backdrop-blur-xl bg-blue-500/10 border border-blue-400/30 rounded-xl">
                          <label className="block text-white font-medium mb-3">Valor que o cliente pagou</label>
                          <input
                            type="number"
                            step="0.01"
                            value={valorPagamentoParcial}
                            onChange={(e) => setValorPagamentoParcial(e.target.value || "")}
                            placeholder="Ex: 50.00"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg"
                          />

                          {valorPagamentoParcial && Number.parseFloat(valorPagamentoParcial) > 0 && (
                            <div className="mt-3 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-green-500/20 border border-green-400/30 rounded-lg text-center">
                                  <p className="text-green-400 font-bold text-lg">R$ {valorPagamentoParcial}</p>
                                  <p className="text-green-300 text-sm">Valor Pago</p>
                                </div>
                                <div className="p-3 bg-orange-500/20 border border-orange-400/30 rounded-lg text-center">
                                  <p className="text-orange-400 font-bold text-lg">
                                    R$ {calcularRestanteParcial().toFixed(2)}
                                  </p>
                                  <p className="text-orange-300 text-sm">Valor Restante</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {subModoParcial === "itens" && (
                        <div>
                          <h4 className="text-white font-medium mb-3">Selecionar Itens para Pagamento</h4>
                          <div className="space-y-3">
                            {pedidosDaComandaSelecionada
                              .filter((pedido) => {
                                const itemPago = itensPagos.find(
                                  (item) => item.produtoNome === (pedido.produto?.nome || "Produto não encontrado"),
                                )
                                return !itemPago || itemPago.quantidadePaga < pedido.quantidade
                              })
                              .map((pedido) => {
                                const itemPago = itensPagos.find(
                                  (item) => item.produtoNome === (pedido.produto?.nome || "Produto não encontrado"),
                                )
                                const quantidadeDisponivel = pedido.quantidade - (itemPago?.quantidadePaga || 0)
                                const quantidadeSelecionada = itensSelecionados[pedido.id] || 0
                                const subtotalItem = quantidadeSelecionada * (pedido.preco_unitario || 0)

                                return (
                                  <div
                                    key={pedido.id}
                                    className="p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl"
                                  >
                                    <div className="flex justify-between items-start mb-3">
                                      <div>
                                        <p className="text-white font-medium">
                                          {pedido.produto?.nome || "Produto não encontrado"}
                                        </p>
                                        <p className="text-white/60 text-sm">
                                          R$ {(pedido.preco_unitario || 0).toFixed(2)} cada • {quantidadeDisponivel}{" "}
                                          disponível
                                        </p>
                                        {pedido.observacoes && (
                                          <p className="text-yellow-400 text-sm">Obs: {pedido.observacoes}</p>
                                        )}
                                      </div>
                                      <p className="text-emerald-400 font-bold">R$ {subtotalItem.toFixed(2)}</p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <button
                                          onClick={() => handleItemSelection(pedido.id, quantidadeSelecionada - 1)}
                                          disabled={quantidadeSelecionada <= 0}
                                          className="w-8 h-8 bg-red-500/20 border border-red-400/50 rounded text-red-400 flex items-center justify-center hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="text-white font-medium min-w-[30px] text-center">
                                          {quantidadeSelecionada}
                                        </span>
                                        <button
                                          onClick={() => handleItemSelection(pedido.id, quantidadeSelecionada + 1)}
                                          disabled={quantidadeSelecionada >= quantidadeDisponivel}
                                          className="w-8 h-8 bg-emerald-500/20 border border-emerald-400/50 rounded text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          <Plus className="w-4 h-4" />
                                        </button>
                                      </div>

                                      <button
                                        onClick={() => handleItemSelection(pedido.id, quantidadeDisponivel)}
                                        className="px-3 py-1 bg-blue-500/20 border border-blue-400/50 rounded text-blue-400 text-sm hover:bg-blue-500/30"
                                      >
                                        Selecionar Todos
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                          </div>

                          {Object.keys(itensSelecionados).some((key) => itensSelecionados[key] > 0) && (
                            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
                              <p className="text-white text-center">
                                <span className="text-blue-400 font-bold text-xl">
                                  R$ {calcularTotalItensSelecionados().toFixed(2)}
                                </span>
                                <br />
                                <span className="text-white/70 text-sm">Total dos itens selecionados</span>
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {modoPagamento === "dividir" && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Dividir Conta</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <label className="text-white">Número de pessoas:</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setDivisaoConta((prev) => ({
                              ...prev,
                              numeroPessoas: Math.max(2, prev.numeroPessoas - 1),
                            }))
                          }
                          className="w-8 h-8 bg-red-500/20 border border-red-400/50 rounded text-red-400 flex items-center justify-center hover:bg-red-500/30"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-white font-medium min-w-[30px] text-center">
                          {divisaoConta.numeroPessoas}
                        </span>
                        <button
                          onClick={() =>
                            setDivisaoConta((prev) => ({
                              ...prev,
                              numeroPessoas: prev.numeroPessoas + 1,
                            }))
                          }
                          className="w-8 h-8 bg-emerald-500/20 border border-emerald-400/50 rounded text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
                      <p className="text-white text-center">
                        <span className="text-blue-400 font-bold text-xl">R$ {calcularDivisaoConta().toFixed(2)}</span>
                        <br />
                        <span className="text-white/70 text-sm">por pessoa</span>
                      </p>
                    </div>
                  </div>
                )}

                {modoPagamento === "total" && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Itens do Pedido</h3>
                    <div className="space-y-3">
                      {pedidosDaComandaSelecionada
                        .filter((pedido) => {
                          const itemPago = itensPagos.find(
                            (item) => item.produtoNome === (pedido.produto?.nome || "Produto não encontrado"),
                          )
                          return !itemPago || itemPago.quantidadePaga < pedido.quantidade
                        })
                        .map((pedido) => {
                          const itemPago = itensPagos.find(
                            (item) => item.produtoNome === (pedido.produto?.nome || "Produto não encontrado"),
                          )
                          const quantidadeRestante = pedido.quantidade - (itemPago?.quantidadePaga || 0)
                          const subtotalRestante = quantidadeRestante * (pedido.preco_unitario || 0)

                          return (
                            <div
                              key={pedido.id}
                              className="flex justify-between items-center p-3 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl"
                            >
                              <div>
                                <p className="text-white font-medium">
                                  {pedido.produto?.nome || "Produto não encontrado"} x{quantidadeRestante}
                                </p>
                                <p className="text-white/60 text-sm">
                                  R$ {(pedido.preco_unitario || 0).toFixed(2)} cada
                                </p>
                                {pedido.observacoes && (
                                  <p className="text-yellow-400 text-sm">Obs: {pedido.observacoes}</p>
                                )}
                              </div>
                              <p className="text-emerald-400 font-bold">R$ {subtotalRestante.toFixed(2)}</p>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {itensPagos.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-green-400 mb-3">Itens Já Pagos</h3>
                    <div className="space-y-2">
                      {itensPagos.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 bg-green-500/10 border border-green-400/30 rounded-lg"
                        >
                          <span className="text-green-400 text-sm">
                            {item.produtoNome} x{item.quantidadePaga}
                          </span>
                          <span className="text-green-400 font-medium text-sm">
                            R$ {(item.quantidadePaga * item.precoUnitario).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-white/20 pt-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white">Subtotal:</span>
                    <span className="text-white">
                      R${" "}
                      {(modoPagamento === "parcial"
                        ? subModoParcial === "valor"
                          ? valorPagamentoParcial && Number.parseFloat(valorPagamentoParcial) > 0
                            ? Number.parseFloat(valorPagamentoParcial)
                            : 0
                          : calcularTotalItensSelecionados()
                        : valorTotal
                      ).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="taxa-servico"
                        checked={incluirTaxaServico}
                        onChange={(e) => setIncluirTaxaServico(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 bg-white/10 border-white/20 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor="taxa-servico" className="text-white/70 text-sm cursor-pointer">
                        Taxa de serviço (10%)
                      </label>
                    </div>
                    <span className="text-white/70 text-sm">
                      R${" "}
                      {(modoPagamento === "parcial"
                        ? incluirTaxaServico
                          ? subModoParcial === "valor"
                            ? valorPagamentoParcial && Number.parseFloat(valorPagamentoParcial) > 0
                              ? Number.parseFloat(valorPagamentoParcial) * 0.1
                              : 0
                            : calcularTotalItensSelecionados() * 0.1
                          : 0
                        : taxaServico
                      ).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-white">
                      {modoPagamento === "dividir" ? "Total por pessoa:" : "Total:"}
                    </span>
                    <span className="text-2xl font-bold text-emerald-400">
                      R${" "}
                      {(modoPagamento === "dividir"
                        ? calcularDivisaoConta()
                        : modoPagamento === "parcial"
                          ? subModoParcial === "valor"
                            ? valorPagamentoParcial && Number.parseFloat(valorPagamentoParcial) > 0
                              ? Number.parseFloat(valorPagamentoParcial) +
                                (incluirTaxaServico ? Number.parseFloat(valorPagamentoParcial) * 0.1 : 0)
                              : 0
                            : calcularTotalItensSelecionados() +
                              (incluirTaxaServico ? calcularTotalItensSelecionados() * 0.1 : 0)
                          : totalFinal
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-white font-medium mb-3">Método de Pagamento</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { id: "dinheiro", label: "Dinheiro", icon: Banknote },
                      { id: "cartao", label: "Cartão", icon: CreditCard },
                      { id: "pix", label: "PIX", icon: Smartphone },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => handleMetodoPagamento(id)}
                        className={`p-4 backdrop-blur-xl border rounded-xl transition-all duration-300 flex flex-col items-center gap-2 ${metodoPagamento === id ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-400" : "bg-white/5 border-white/20 text-white hover:bg-white/10"}`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {mostrarTroco && metodoPagamento === "dinheiro" && (
                  <div className="mb-6">
                    <label className="block text-white font-medium mb-3">Valor Recebido</label>
                    <input
                      type="number"
                      step="0.01"
                      value={valorPago}
                      onChange={(e) => setValorPago(e.target.value || "")}
                      placeholder={`Mínimo: R$ ${(
                        modoPagamento === "dividir"
                          ? calcularDivisaoConta()
                          : modoPagamento === "parcial"
                            ? subModoParcial === "valor"
                              ? valorPagamentoParcial && Number.parseFloat(valorPagamentoParcial) > 0
                                ? Number.parseFloat(valorPagamentoParcial) +
                                  (incluirTaxaServico ? Number.parseFloat(valorPagamentoParcial) * 0.1 : 0)
                                : 0
                              : calcularTotalItensSelecionados() +
                                (incluirTaxaServico ? calcularTotalItensSelecionados() * 0.1 : 0)
                            : totalFinal
                      ).toFixed(2)}`}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg"
                    />
                    {valorPago && Number.parseFloat(valorPago) > 0 && (
                      <div
                        className={`mt-3 p-3 rounded-xl text-center font-medium ${
                          calcularTroco() > 0
                            ? "bg-yellow-500/20 border border-yellow-400/30 text-yellow-400"
                            : calcularTroco() === 0
                              ? "bg-green-500/20 border border-green-400/30 text-green-400"
                              : "bg-red-500/20 border border-red-400/30 text-red-400"
                        }`}
                      >
                        {calcularTroco() > 0
                          ? `💰 Troco: R$ ${calcularTroco().toFixed(2)}`
                          : calcularTroco() === 0
                            ? "✅ Valor exato - Sem troco"
                            : `❌ Falta: R$ ${Math.abs(calcularTroco()).toFixed(2)}`}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleFecharConta}
                  disabled={
                    !metodoPagamento ||
                    processando ||
                    (metodoPagamento === "dinheiro" && calcularTroco() < 0) ||
                    (modoPagamento === "parcial" &&
                      subModoParcial === "itens" &&
                      calcularTotalItensSelecionados() === 0)
                  }
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processando ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processando...
                    </>
                  ) : modoPagamento === "parcial" ? (
                    "Pagar Conta"
                  ) : (
                    "Fechar Conta"
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
