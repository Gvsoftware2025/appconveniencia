"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { usePedidos } from "@/contexts/pedidos-context"
import { useInterface } from "@/contexts/interface-context"
import { CategoryPrintSystem } from "@/components/category-print-system"

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

export function useGlobalPrintMonitor() {
  const { comandas, pedidos, products } = usePedidos()
  const { activeInterface } = useInterface()
  const processedComandasRef = useRef<Set<string>>(new Set())
  const comandaPedidosCountRef = useRef<Map<string, number>>(new Map())
  const printedItemsRef = useRef<Map<string, Set<string>>>(new Map()) // comandaId -> Set of pedidoIds
  const isInitializedRef = useRef(false)
  const isExecutingPrintRef = useRef(false)
  const lastActiveInterfaceRef = useRef<string | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastExecutionRef = useRef<number>(0)
  const DEBOUNCE_DELAY = 2000 // 2 seconds debounce
  const MIN_EXECUTION_INTERVAL = 3000 // Minimum 3 seconds between executions

  const [pendingPrint, setPendingPrint] = useState<{
    nomeComanda: string
    pedidos: PrintData[]
    comandaId: string
  } | null>(null)

  const [showAutoPrintNotification, setShowAutoPrintNotification] = useState(false)
  const [autoPrintMessage, setAutoPrintMessage] = useState("")

  useEffect(() => {
    if (lastActiveInterfaceRef.current !== activeInterface) {
      console.log(
        `[v0] Global Print Monitor: Interface mudou de ${lastActiveInterfaceRef.current} para ${activeInterface}`,
      )

      // Clear any pending debounce timers
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }

      isInitializedRef.current = false
      processedComandasRef.current.clear()
      comandaPedidosCountRef.current.clear()
      lastActiveInterfaceRef.current = activeInterface
      isExecutingPrintRef.current = false
    }
  }, [activeInterface])

  const getPrintedComandas = (): Set<string> => {
    if (typeof window === "undefined") return new Set()
    try {
      const stored = localStorage.getItem("printed_comandas")
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  }

  const savePrintedComanda = (comandaId: string) => {
    if (typeof window === "undefined") return
    try {
      const printed = getPrintedComandas()
      printed.add(comandaId)
      localStorage.setItem("printed_comandas", JSON.stringify([...printed]))
      console.log("[v0] Global Print Monitor: Comanda marcada como impressa:", comandaId)

      window.dispatchEvent(
        new CustomEvent("comandaPrinted", {
          detail: { comandaId },
        }),
      )
    } catch (error) {
      console.error("[v0] Erro ao salvar comanda impressa:", error)
    }
  }

  const handlePrintReceipt = useCallback((nomeComanda: string, pedidosParaImprimir: PrintData[], comandaId: string) => {
    const now = Date.now()

    if (isExecutingPrintRef.current) {
      console.log("[v0] Global Print Monitor: Impressão já em execução, ignorando duplicata")
      return
    }

    if (now - lastExecutionRef.current < MIN_EXECUTION_INTERVAL) {
      console.log("[v0] Global Print Monitor: Aguardando intervalo mínimo entre execuções")
      return
    }

    isExecutingPrintRef.current = true
    lastExecutionRef.current = now
    console.log("[v0] Global Print Monitor: INICIANDO IMPRESSÃO AUTOMÁTICA POR CATEGORIA para:", nomeComanda)

    if (!pedidosParaImprimir || pedidosParaImprimir.length === 0) {
      console.log("[v0] Global Print Monitor: Nenhum pedido para imprimir")
      isExecutingPrintRef.current = false
      return
    }

    const printedItems = printedItemsRef.current.get(comandaId) || new Set()
    const newItemsOnly = pedidosParaImprimir.filter((pedido) => !printedItems.has(pedido.id))

    if (newItemsOnly.length === 0) {
      console.log("[v0] Global Print Monitor: Todos os itens já foram impressos")
      isExecutingPrintRef.current = false
      return
    }

    console.log(
      `[v0] Global Print Monitor: Imprimindo apenas ${newItemsOnly.length} novos itens de ${pedidosParaImprimir.length} total`,
    )

    try {
      const printContainer = document.createElement("div")
      document.body.appendChild(printContainer)

      const categoryPrintElement = document.createElement("div")
      printContainer.appendChild(categoryPrintElement)

      import("react").then(({ createElement }) => {
        import("react-dom/client").then(({ createRoot }) => {
          const root = createRoot(categoryPrintElement)
          root.render(
            createElement(CategoryPrintSystem, {
              nomeComanda,
              pedidos: newItemsOnly,
              onPrintComplete: () => {
                const currentPrintedItems = printedItemsRef.current.get(comandaId) || new Set()
                newItemsOnly.forEach((pedido) => currentPrintedItems.add(pedido.id))
                printedItemsRef.current.set(comandaId, currentPrintedItems)

                savePrintedComanda(comandaId)
                setTimeout(() => {
                  try {
                    if (document.body.contains(printContainer)) {
                      document.body.removeChild(printContainer)
                    }
                  } catch (error) {
                    console.error("[v0] Erro ao remover container de impressão:", error)
                  }
                  isExecutingPrintRef.current = false
                }, 3000)
              },
            }),
          )
        })
      })

      console.log("[v0] Global Print Monitor: ✅ PROCESSO DE IMPRESSÃO POR CATEGORIA INICIADO")
    } catch (error) {
      console.error("[v0] Global Print Monitor: ❌ ERRO NA IMPRESSÃO POR CATEGORIA:", error)
      isExecutingPrintRef.current = false
    }
  }, [])

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      if (!comandas || !pedidos || !products) {
        return
      }

      if (activeInterface !== "pagamento") {
        return
      }

      if (!isInitializedRef.current) {
        console.log("[v0] Global Print Monitor: Inicializando sistema...")
        comandas.forEach((comanda) => {
          processedComandasRef.current.add(comanda.id)
          const pedidosCount = pedidos.filter((p) => p.comanda_id === comanda.id).length
          comandaPedidosCountRef.current.set(comanda.id, pedidosCount)
          const existingPedidos = pedidos.filter((p) => p.comanda_id === comanda.id)
          const printedItems = new Set(existingPedidos.map((p) => p.id))
          printedItemsRef.current.set(comanda.id, printedItems)
        })
        isInitializedRef.current = true
        console.log("[v0] Global Print Monitor: Sistema inicializado com", comandas.length, "comandas existentes")
        return
      }

      if (isExecutingPrintRef.current) {
        return
      }

      const newComandas = comandas.filter((comanda) => !processedComandasRef.current.has(comanda.id))

      const comandasWithNewPedidos = comandas.filter((comanda) => {
        const currentPedidosCount = pedidos.filter((p) => p.comanda_id === comanda.id).length
        const previousCount = comandaPedidosCountRef.current.get(comanda.id) || 0
        return currentPedidosCount > previousCount && currentPedidosCount > 0
      })

      const comandasToProcess = [...newComandas, ...comandasWithNewPedidos]

      if (comandasToProcess.length > 0) {
        console.log("[v0] Global Print Monitor: 🔥 DETECTADAS COMANDAS PARA IMPRESSÃO:", comandasToProcess.length)

        const comanda = comandasToProcess[0]
        const pedidosComanda = pedidos.filter((pedido) => pedido.comanda_id === comanda.id)

        if (pedidosComanda.length > 0) {
          const pedidosComProdutos = pedidosComanda
            .map((pedido) => {
              const produto = products.find((p) => p.id === pedido.produto_id)
              return produto ? { ...pedido, produto } : null
            })
            .filter(Boolean) as PrintData[]

          if (pedidosComProdutos.length > 0) {
            console.log("[v0] Global Print Monitor: 🚀 AUTO-IMPRIMINDO COMANDA:", comanda.numero_comanda)
            setTimeout(() => {
              if (!isExecutingPrintRef.current) {
                handlePrintReceipt(comanda.numero_comanda, pedidosComProdutos, comanda.id)
              }
            }, 500)
          }
        }

        comandasToProcess.forEach((comanda) => {
          processedComandasRef.current.add(comanda.id)
          const pedidosCount = pedidos.filter((p) => p.comanda_id === comanda.id).length
          comandaPedidosCountRef.current.set(comanda.id, pedidosCount)
        })
      }
    }, DEBOUNCE_DELAY)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [comandas, pedidos, products, activeInterface, handlePrintReceipt])

  return {
    isMonitoring: activeInterface === "pagamento",
    pendingPrint,
    clearPendingPrint: () => setPendingPrint(null),
    handlePrintReceipt,
    getPrintedComandas,
    savePrintedComanda,
    showAutoPrintNotification,
    autoPrintMessage,
  }
}
