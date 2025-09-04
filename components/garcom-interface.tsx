"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { X, Plus, ShoppingCart, Users, Settings, ArrowLeft, Search } from "lucide-react"
import Image from "next/image"
import { usePedidos } from "@/contexts/pedidos-context"
import { useToast } from "./toast-notification"
import PagamentoInterface from "./pagamento-interface"

interface Produto {
  id: string
  nome: string
  preco: number
  categoria_id: string
  imagem_url?: string
  descricao?: string
  disponivel: boolean
  tempo_preparo: number
  ingredientes: string[]
  categoria?: string
}

interface GarcomInterfaceProps {
  onBack: () => void
}

export default function GarcomInterface({ onBack }: GarcomInterfaceProps) {
  const {
    products,
    comandas,
    pedidos,
    adicionarItensComanda,
    isLoading,
    refreshData,
    getPedidosByComanda,
    calcularTotalComanda,
    criarComanda: criarComandaContext,
  } = usePedidos()
  const toast = useToast()

  const [nomeComanda, setNomeComanda] = useState("")
  const [comandaSelecionada, setComandaSelecionada] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("geral")
  const [produtosSelecionados, setProdutosSelecionados] = useState<{ [key: string]: number }>({})
  const [observacoesProdutos, setObservacoesProdutos] = useState<{ [key: string]: string }>({})
  const [isLoadingFinalizarPedido, setIsLoading] = useState(false)
  const [telaAtual, setTelaAtual] = useState<"principal" | "novaComanda" | "produtos">("principal")
  const [comandaParaPagamento, setComandaParaPagamento] = useState<any>(null)
  const [mostrarPagamento, setMostrarPagamento] = useState(false)
  const [pedidosExistentes, setPedidosExistentes] = useState<any[]>([])

  const handleOrderReady = useCallback(
    (event: CustomEvent) => {
      const { mesaNome, itemName } = event.detail

      toast({
        title: "🍽️ Pedido Pronto!",
        description: `${itemName} da ${mesaNome} está pronto para entrega`,
        duration: 5000,
      })

      // Vibrate if supported
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([300, 100, 300, 100, 300])
      }
    },
    [toast],
  )

  const comandasAbertas = (comandas || []).filter((comanda) => comanda && comanda.status === "aberta")

  useEffect(() => {
    console.log("[v0] GarcomInterface - Data loaded:")
    console.log("[v0] Products:", products?.length || 0)
    console.log("[v0] Comandas:", comandas?.length || 0)
    console.log("[v0] Pedidos:", pedidos?.length || 0)
    console.log("[v0] IsLoading:", isLoading)
  }, [products, comandas, pedidos, isLoading])

  useEffect(() => {
    window.addEventListener("orderReady", handleOrderReady as EventListener)
    return () => window.removeEventListener("orderReady", handleOrderReady as EventListener)
  }, [handleOrderReady])

  const handleCriarNovaComanda = () => {
    if (!nomeComanda || !nomeComanda.trim()) {
      toast.error("Digite o nome da comanda!")
      return
    }
    setPedidosExistentes([])
    setTelaAtual("produtos")
  }

  const handleSelecionarProduto = (produto: Produto) => {
    console.log("[v0] Produto selecionado:", produto.nome)
    setProdutosSelecionados((prev) => {
      const novaQuantidade = (prev[produto.id] || 0) + 1
      return {
        ...prev,
        [produto.id]: novaQuantidade,
      }
    })
    toast.success("Produto selecionado!", `${produto.nome} adicionado à seleção`)
  }

  const handleRemoverSelecao = (produtoId: string) => {
    setProdutosSelecionados((prev) => {
      const novaQuantidade = (prev[produtoId] || 0) - 1
      if (novaQuantidade <= 0) {
        const { [produtoId]: removed, ...rest } = prev
        return rest
      }
      return {
        ...prev,
        [produtoId]: novaQuantidade,
      }
    })
  }

  const handleFinalizarPedido = async () => {
    console.log("[v0] handleFinalizarPedido chamada!")
    console.log("[v0] Nome da comanda:", nomeComanda)
    console.log("[v0] Produtos selecionados:", produtosSelecionados)
    console.log("[v0] Observações:", observacoesProdutos)

    if (!nomeComanda || !nomeComanda.trim()) {
      console.log("[v0] Erro: Nome da comanda não informado")
      toast.error("Digite o nome da comanda!")
      return
    }

    if (Object.keys(produtosSelecionados).length === 0) {
      console.log("[v0] Erro: Nenhum produto selecionado")
      toast.error("Adicione pelo menos um item ao pedido")
      return
    }

    setIsLoading(true)

    try {
      const itensParaAdicionar = Object.entries(produtosSelecionados).map(([produtoId, quantidade]) => ({
        produto_id: produtoId,
        quantidade: quantidade,
        observacoes: observacoesProdutos[produtoId] || null,
      }))

      console.log("[v0] Itens para adicionar com observações:", itensParaAdicionar)

      console.log("[v0] Criando nova comanda:", nomeComanda)
      const comandaId = await criarComandaContext(nomeComanda?.trim() || "")
      await adicionarItensComanda(comandaId, itensParaAdicionar)

      // Clear selections and observations
      setProdutosSelecionados({})
      setObservacoesProdutos({})
      setNomeComanda("")

      await refreshData()
      toast.success("Pedido realizado com sucesso!")
      setTelaAtual("principal")
    } catch (error) {
      console.error("[v0] Erro ao finalizar pedido:", error)
      toast.error("Erro ao realizar pedido. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const voltarParaInicio = () => {
    setTelaAtual("principal")
    setComandaSelecionada(null)
    setNomeComanda("")
    setProdutosSelecionados({})
    setObservacoesProdutos({})
    setPedidosExistentes([])
    onBack()
  }

  const categorias = [
    { id: "geral", nome: "🍽️ Geral" },
    { id: "bebidas", nome: "🥤 Bebidas" },
    { id: "porcoes", nome: "🍟 Porções" },
  ]

  const getCategoriaFromCategoriaId = (categoria_id: string) => {
    switch (categoria_id) {
      case "2b8538f0-9ffc-4982-bd15-b8fb49f67fa1":
        return "bebidas"
      case "3c9649f1-0aad-4093-ae26-c9ac50a78ab2":
        return "porcoes"
      default:
        return "geral"
    }
  }

  const getCategoriaFromProduct = (produto: Produto) => {
    if (produto.categoria_id) {
      return getCategoriaFromCategoriaId(produto.categoria_id)
    }

    const nome = produto.nome.toLowerCase()
    const descricao = produto.descricao?.toLowerCase() || ""

    if (
      nome.includes("refrigerante") ||
      nome.includes("suco") ||
      nome.includes("caipirinha") ||
      nome.includes("cerveja") ||
      nome.includes("água") ||
      nome.includes("drink") ||
      descricao.includes("bebida") ||
      descricao.includes("drink")
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
      nome.includes("pastéis") ||
      descricao.includes("porção") ||
      descricao.includes("petisco") ||
      descricao.includes("aperitivo")
    ) {
      return "porcoes"
    }

    return "geral"
  }

  const filteredProducts = (products || [])
    .filter((produto) => produto) // Just check if product exists
    .filter(
      (produto) =>
        (produto.nome && produto.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        produto.descricao?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .filter((produto) => {
      if (categoriaFiltro === "geral") return true
      return getCategoriaFromProduct(produto) === categoriaFiltro
    })

  const isPorcao = (produto: Produto) => {
    const nome = produto.nome?.toLowerCase() || ""
    const descricao = produto.descricao?.toLowerCase() || ""

    return (
      nome.includes("batata") ||
      nome.includes("frango") ||
      nome.includes("porção") ||
      nome.includes("petisco") ||
      nome.includes("aperitivo") ||
      nome.includes("mandioca") ||
      nome.includes("calabresa") ||
      nome.includes("linguiça") ||
      nome.includes("pastéis") ||
      descricao.includes("porção") ||
      descricao.includes("petisco") ||
      descricao.includes("aperitivo")
    )
  }

  const getOriginalComandaName = (numeroComanda: string) => {
    if (numeroComanda && numeroComanda.includes("-") && /\d+$/.test(numeroComanda)) {
      return numeroComanda.replace(/-\d+$/, "")
    }
    return numeroComanda
  }

  if (mostrarPagamento && comandaParaPagamento) {
    return <PagamentoInterface onBack={() => setMostrarPagamento(false)} mesaId={comandaParaPagamento.numero_comanda} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/restaurant-interior.png')] bg-cover bg-center opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-purple-900/90 to-slate-900/90" />

      <div className="relative z-10 flex items-center justify-between p-4 backdrop-blur-xl bg-white/10 border-b border-white/20">
        <button
          onClick={voltarParaInicio}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
          <span className="text-white font-medium">Voltar</span>
        </button>

        <div className="flex items-center gap-3">
          <Image
            src="/logo-conveniencia.png"
            alt="Conveniência"
            width={120}
            height={40}
            className="hover:scale-105 transition-transform duration-200"
          />
        </div>

        <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-lg">
          <span className="text-emerald-400 font-medium">Interface do Garçom</span>
        </div>
      </div>

      <div className="relative z-10 p-6">
        {telaAtual === "principal" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <ShoppingCart className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">{comandasAbertas.length}</p>
                    <p className="text-gray-300">Comandas Ativas</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-xl">
                    <Users className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">{comandasAbertas.length}</p>
                    <p className="text-gray-300">Comandas Abertas</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Settings className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">{products?.length || 0}</p>
                    <p className="text-gray-300">Produtos</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTelaAtual("novaComanda")}
                className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-400/30 rounded-2xl p-8 text-center hover:from-green-500/30 hover:to-emerald-600/30 transition-all duration-300 shadow-xl"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl group-hover:scale-110 transition-transform duration-200">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-2">Nova Comanda</h3>
                    <p className="text-gray-300">Criar uma nova comanda com nome personalizado</p>
                  </div>
                </div>
              </motion.button>
            </div>

            {comandasAbertas.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Comandas Abertas</h3>
                {comandasAbertas.map((comanda) => {
                  const pedidosDaComanda = getPedidosByComanda(comanda.id)
                  const totalComanda = calcularTotalComanda(comanda.id)
                  const ultimosItens = pedidosDaComanda
                    .slice(-3)
                    .map((p) => p.produto?.nome)
                    .filter(Boolean)
                    .join(", ")

                  return (
                    <motion.div
                      key={comanda.id}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-white font-semibold">{getOriginalComandaName(comanda.numero_comanda)}</h4>
                          <span className="text-red-400 text-sm font-medium bg-red-400/20 px-2 py-1 rounded-full">
                            ATIVA
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <p className="text-white">
                          Total: <span className="text-green-400 font-semibold">R$ {totalComanda.toFixed(2)}</span>
                        </p>
                        <p className="text-gray-300">{pedidosDaComanda.length} item pedidos</p>
                        {ultimosItens && <p className="text-gray-400 text-xs">Últimos itens: {ultimosItens}</p>}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => {
                            setComandaSelecionada(comanda)
                            setNomeComanda(getOriginalComandaName(comanda.numero_comanda))
                            const pedidosDaComanda = getPedidosByComanda(comanda.id)
                            setPedidosExistentes(pedidosDaComanda)
                            setTelaAtual("produtos")
                          }}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Editar Pedido
                        </button>
                        <button
                          onClick={() => {
                            setComandaParaPagamento(comanda)
                            setMostrarPagamento(true)
                          }}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Fechar Conta
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {telaAtual === "novaComanda" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Nova Comanda
                </h2>
                <button
                  onClick={() => setTelaAtual("principal")}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Nome da Comanda</label>
                  <input
                    type="text"
                    placeholder="Ex: Mesa 1, João Silva, Comanda 5..."
                    value={nomeComanda}
                    onChange={(e) => setNomeComanda(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setTelaAtual("principal")}
                    className="flex-1 px-4 py-3 bg-gray-500/20 text-white rounded-lg hover:bg-gray-500/30 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCriarNovaComanda}
                    disabled={!nomeComanda || !nomeComanda.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {telaAtual === "produtos" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  {getOriginalComandaName(nomeComanda)} - Adicionar Produtos
                </h2>
                <button
                  onClick={() => setTelaAtual("principal")}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <div className="mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                      <h3 className="text-lg font-semibold text-white">🛒 Produtos Disponíveis</h3>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1 sm:flex-none">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar produtos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-64"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">📂 Categorias:</h4>
                      <div className="flex flex-wrap gap-2">
                        {categorias.map((categoria) => (
                          <button
                            key={categoria.id}
                            onClick={() => setCategoriaFiltro(categoria.id)}
                            className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                              categoriaFiltro === categoria.id
                                ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-400"
                                : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
                            }`}
                          >
                            {categoria.nome}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredProducts.map((produto) => (
                        <motion.div
                          key={produto.id}
                          whileHover={{ scale: 1.02 }}
                          className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/10 transition-all duration-200"
                        >
                          <div className="flex flex-col h-full">
                            {produto.imagem_url && (
                              <div className="mb-3">
                                <Image
                                  src={produto.imagem_url || "/placeholder.svg"}
                                  alt={produto.nome}
                                  width={200}
                                  height={120}
                                  className="w-full h-24 object-cover rounded-lg"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none"
                                  }}
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold text-white mb-2">{produto.nome}</h4>
                              <p className="text-gray-300 text-sm mb-3 line-clamp-2">{produto.descricao}</p>
                              <p className="text-emerald-400 font-bold text-lg">R$ {produto.preco.toFixed(2)}</p>
                            </div>

                            <div className="mt-4 space-y-3">
                              {produtosSelecionados[produto.id] > 0 && (
                                <div className="flex items-center justify-between bg-white/10 rounded-lg p-2">
                                  <button
                                    onClick={() => handleRemoverSelecao(produto.id)}
                                    className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg flex items-center justify-center transition-colors"
                                  >
                                    -
                                  </button>
                                  <span className="text-white font-semibold">{produtosSelecionados[produto.id]}</span>
                                  <button
                                    onClick={() => handleSelecionarProduto(produto)}
                                    className="w-8 h-8 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg flex items-center justify-center transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              )}

                              {produtosSelecionados[produto.id] === 0 || !produtosSelecionados[produto.id] ? (
                                <button
                                  onClick={() => handleSelecionarProduto(produto)}
                                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                  <Plus className="w-4 h-4" />
                                  Adicionar
                                </button>
                              ) : null}

                              {produtosSelecionados[produto.id] > 0 && isPorcao(produto) && (
                                <div className="space-y-2">
                                  <label className="text-xs text-gray-400">Observações para a cozinha:</label>
                                  <textarea
                                    placeholder="Ex: sem cebola, bem passado..."
                                    value={observacoesProdutos[produto.id] || ""}
                                    onChange={(e) =>
                                      setObservacoesProdutos((prev) => ({
                                        ...prev,
                                        [produto.id]: e.target.value,
                                      }))
                                    }
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                                    rows={3}
                                  />
                                  <p className="text-xs text-gray-500">
                                    Esta observação aparecerá na cozinha junto com o pedido
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div className="sticky top-6 space-y-4">
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                      <h4 className="font-semibold text-white mb-3">📋 Resumo do Pedido</h4>
                      {pedidosExistentes.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                          <h5 className="text-blue-400 font-medium mb-2">🍽️ Itens já pedidos pelos clientes:</h5>
                          <div className="space-y-2">
                            {pedidosExistentes.map((pedido, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-white">
                                  {pedido.produto?.nome} x{pedido.quantidade}
                                </span>
                                <span className="text-green-400">
                                  R$ {(pedido.produto?.preco * pedido.quantidade).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t border-blue-400/20">
                            <div className="flex justify-between text-sm font-medium">
                              <span className="text-blue-400">Total já pedido:</span>
                              <span className="text-green-400">
                                R${" "}
                                {pedidosExistentes
                                  .reduce((total, pedido) => total + pedido.produto?.preco * pedido.quantidade, 0)
                                  .toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 text-sm">
                        <p className="text-gray-300">
                          Comanda: <span className="text-white font-medium">{getOriginalComandaName(nomeComanda)}</span>
                        </p>
                        <p className="text-gray-300">
                          Novos itens selecionados:{" "}
                          <span className="text-emerald-400 font-semibold">
                            {Object.values(produtosSelecionados).reduce((sum, qty) => sum + qty, 0)}
                          </span>
                        </p>
                        <p className="text-gray-300">
                          Total novos itens:{" "}
                          <span className="text-emerald-400 font-semibold">
                            R${" "}
                            {Object.entries(produtosSelecionados)
                              .reduce((total, [produtoId, quantidade]) => {
                                const produto = products.find((p) => p.id === produtoId)
                                return total + (produto?.preco || 0) * quantidade
                              }, 0)
                              .toFixed(2)}
                          </span>
                        </p>
                        {pedidosExistentes.length > 0 && (
                          <div className="pt-2 border-t border-white/20">
                            <p className="text-gray-300">
                              <strong>Total geral da mesa:</strong>{" "}
                              <span className="text-green-400 font-bold text-lg">
                                R${" "}
                                {(
                                  pedidosExistentes.reduce(
                                    (total, pedido) => total + pedido.produto?.preco * pedido.quantidade,
                                    0,
                                  ) +
                                  Object.entries(produtosSelecionados).reduce((total, [produtoId, quantidade]) => {
                                    const produto = products.find((p) => p.id === produtoId)
                                    return total + (produto?.preco || 0) * quantidade
                                  }, 0)
                                ).toFixed(2)}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => setTelaAtual("principal")}
                        className="w-full bg-gray-500/20 hover:bg-gray-500/30 text-white py-3 rounded-lg font-medium transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleFinalizarPedido}
                        disabled={Object.keys(produtosSelecionados).length === 0 || isLoadingFinalizarPedido}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoadingFinalizarPedido ? "Finalizando..." : "Finalizar Pedido"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
