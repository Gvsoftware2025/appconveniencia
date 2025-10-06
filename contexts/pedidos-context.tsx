"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

const generateUUID = () => {
  if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  // Fallback UUID generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

interface Product {
  id: string
  nome: string
  preco: number
  categoria_id: string
  imagem_url?: string
  descricao?: string
  disponivel: boolean
  tempo_preparo: number
  ingredientes: string[]
}

interface Mesa {
  id: string
  numero: number
  capacidade: number
  status: "livre" | "ocupada" | "reservada" | "limpeza"
  localizacao?: string
}

interface Comanda {
  id: string
  numero_comanda: string
  tipo: "individual" | "unificada" | "separada"
  status: "aberta" | "fechada" | "cancelada"
  garcom_id?: string
  total: number
  desconto: number
  taxa_servico: number
  observacoes?: string
  created_at: string
  updated_at: string
}

interface Pedido {
  id: string
  comanda_id: string
  produto_id: string
  quantidade: number
  preco_unitario: number
  subtotal: number
  status: "preparando" | "pronto" | "entregue" | "cancelado"
  observacoes?: string
  tempo_pedido: string
  produto?: Product
}

interface PedidosContextType {
  products: Product[]
  mesas: Mesa[]
  comandas: Comanda[]
  pedidos: Pedido[]
  isLoading: boolean
  // Product functions
  addProduct: (product: Omit<Product, "id">) => Promise<void>
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
  // Mesa functions - kept for backward compatibility
  adicionarMesa: (mesa: Omit<Mesa, "id">) => Promise<void>
  updateMesa: (mesaId: string, updates: Partial<Mesa>) => Promise<void>
  deleteMesa: (mesaId: string) => Promise<void>
  criarComanda: (nomeComanda: string) => Promise<string>
  updateComanda: (comandaId: string, updates: Partial<Comanda>) => Promise<void>
  updateComandaTotal: (comandaId: string, novoTotal: number) => Promise<void>
  finalizarComanda: (comandaId: string) => Promise<void>
  excluirComanda: (comandaId: string) => Promise<void>
  adicionarItensComanda: (
    comandaId: string,
    itens: Array<{ produto_id: string; quantidade: number; observacoes?: string }>,
  ) => Promise<void>
  getPedidosByComanda: (comandaId: string) => Pedido[]
  calcularTotalComanda: (comandaId: string) => number
  // Pedido functions
  addPedido: (pedido: Omit<Pedido, "id" | "tempo_pedido">) => Promise<void>
  updatePedidoStatus: (pedidoId: string, status: Pedido["status"]) => Promise<void>
  removerItemPedido: (pedidoId: string) => Promise<void>
  refreshData: () => Promise<void>
  // Legacy compatibility
  orders: Pedido[]
  adicionarPedido: (pedido: any) => Promise<void>
  atualizarStatus: (id: string, status: string) => Promise<void>
  // Deprecated functions - kept for compatibility but will be removed
  addComanda: (comanda: any) => Promise<string>
  getComandasByMesa: (mesaId: string) => Comanda[]
  getPedidosByMesa: (mesaId: string) => Pedido[]
}

const PedidosContext = createContext<PedidosContextType | undefined>(undefined)

export function PedidosProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [comandas, setComandas] = useState<Comanda[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [lastSuccessfulRefresh, setLastSuccessfulRefresh] = useState<number>(Date.now())

  const supabase = createClient()

  const notifyOtherTabs = (action: string, data?: any) => {
    const message = {
      type: "PEDIDOS_UPDATE",
      action,
      data,
      timestamp: Date.now(),
    }

    // Use localStorage to communicate between tabs
    localStorage.setItem("pedidos_sync_message", JSON.stringify(message))
    localStorage.removeItem("pedidos_sync_message") // Trigger storage event

    // Also use BroadcastChannel if available
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("pedidos_sync")
      channel.postMessage(message)
      channel.close()
    }

    // Additional custom event for immediate local updates
    window.dispatchEvent(
      new CustomEvent("pedidos_updated", {
        detail: { action, data, timestamp: Date.now() },
      }),
    )
  }

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pedidos_sync_message" && e.newValue) {
        try {
          const message = JSON.parse(e.newValue)
          if (message.type === "PEDIDOS_UPDATE") {
            console.log("[v0] Received cross-tab sync message:", message.action)
            // Force refresh when other tabs make changes
            setTimeout(() => refreshData(), 500)
          }
        } catch (error) {
          console.error("[v0] Error parsing sync message:", error)
        }
      }
    }

    const handleBroadcastMessage = (event: MessageEvent) => {
      if (event.data.type === "PEDIDOS_UPDATE") {
        console.log("[v0] Received broadcast sync message:", event.data.action)
        setTimeout(() => refreshData(), 500)
      }
    }

    window.addEventListener("storage", handleStorageChange)

    let channel: BroadcastChannel | null = null
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("pedidos_sync")
      channel.addEventListener("message", handleBroadcastMessage)
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      if (channel) {
        channel.removeEventListener("message", handleBroadcastMessage)
        channel.close()
      }
    }
  }, [])

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`${operation} timeout after ${timeoutMs}ms`)), timeoutMs)
    })

    try {
      return await Promise.race([promise, timeoutPromise])
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        console.warn(`[v0] ${operation} timed out, but continuing with existing data`)
        throw error
      }
      throw error
    }
  }

  const refreshData = async () => {
    if (isRefreshing) {
      return
    }

    if (retryCount >= 5) {
      console.warn("[v0] Too many consecutive failures, skipping refresh")
      return
    }

    try {
      setIsRefreshing(true)

      const comandasPromise = supabase.from("comandas").select("*").eq("status", "aberta")
      const pedidosPromise = supabase
        .from("pedidos")
        .select(`*,
          produtos(*)
        `)
        .or("status.is.null,status.neq.entregue")

      const [comandasResult, pedidosResult] = await Promise.all([
        withTimeout(comandasPromise, 90000, "Comandas refresh"),
        withTimeout(pedidosPromise, 90000, "Pedidos refresh"),
      ])

      const { data: comandasData, error: comandasError } = comandasResult as any
      const { data: pedidosData, error: pedidosError } = pedidosResult as any

      if (comandasError) throw comandasError
      if (pedidosError) throw pedidosError

      const comandasFormatted = comandasData || []

      // Transform pedidos data
      const pedidosFormatted = pedidosData.map((pedido) => ({
        ...pedido,
        produto: pedido.produtos,
      }))

      const comandasChanged = JSON.stringify(comandasFormatted) !== JSON.stringify(comandas)
      const pedidosChanged = JSON.stringify(pedidosFormatted) !== JSON.stringify(pedidos)

      if (comandasChanged) {
        console.log("[v0] Comandas updated:", comandasFormatted.length)
        setComandas(comandasFormatted || [])
      }

      if (pedidosChanged) {
        console.log("[v0] Pedidos updated:", pedidosFormatted.length)
        setPedidos(pedidosFormatted || [])
      }

      setRetryCount(0)
      setLastSuccessfulRefresh(Date.now())
    } catch (error) {
      console.error("[v0] Error refreshing data:", error)

      const newRetryCount = retryCount + 1
      setRetryCount(newRetryCount)

      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          console.warn(`[v0] Refresh timeout (attempt ${newRetryCount}/5), will retry with longer interval`)
        } else if (error.message.includes("fetch") || error.message.includes("network")) {
          console.warn(`[v0] Network issue detected (attempt ${newRetryCount}/5), will retry`)
        }
      }

      if (newRetryCount >= 3) {
        console.warn("[v0] Multiple refresh failures, extending retry interval")
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        const mesasPromise = supabase.from("mesas").select("*")
        const productsPromise = supabase.from("produtos").select("*")
        const comandasPromise = supabase.from("comandas").select("*").eq("status", "aberta")
        const pedidosPromise = supabase
          .from("pedidos")
          .select(`*,
            produtos(*)
          `)
          .or("status.is.null,status.neq.entregue")

        const [mesasResult, productsResult, comandasResult, pedidosResult] = await Promise.all([
          withTimeout(mesasPromise, 45000, "Mesas load"),
          withTimeout(productsPromise, 45000, "Products load"),
          withTimeout(comandasPromise, 45000, "Comandas load"),
          withTimeout(pedidosPromise, 45000, "Pedidos load"),
        ])

        const { data: mesasData, error: mesasError } = mesasResult as any
        const { data: productsData, error: productsError } = productsResult as any
        const { data: comandasData, error: comandasError } = comandasResult as any
        const { data: pedidosData, error: pedidosError } = pedidosResult as any

        if (mesasError) {
          console.error("[v0] Erro ao carregar mesas:", mesasError)
          throw mesasError
        }

        if (productsError) {
          console.error("[v0] Erro ao carregar produtos:", productsError)
          throw productsError
        }

        if (comandasError) {
          console.error("[v0] Erro ao carregar comandas:", comandasError)
          throw comandasError
        }

        if (pedidosError) {
          console.error("[v0] Erro ao carregar pedidos:", pedidosError)
          throw pedidosError
        }

        // Transform pedidos data
        const pedidosFormatted = pedidosData.map((pedido) => ({
          ...pedido,
          produto: pedido.produtos,
        }))

        setMesas(mesasData || [])
        setProducts(productsData || [])
        setComandas(comandasData || [])
        setPedidos(pedidosFormatted || [])
        setLastSuccessfulRefresh(Date.now())

        console.log("[v0] Dados carregados do banco de dados com sucesso!")
        console.log("[v0] Mesas:", mesasData?.length || 0)
        console.log("[v0] Produtos:", productsData?.length || 0)
        console.log("[v0] Comandas:", comandasData?.length || 0)
        console.log("[v0] Pedidos:", pedidosFormatted?.length || 0)
      } catch (error) {
        console.error("[v0] Erro ao carregar dados:", error)
        setProducts([])
        setMesas([])
        setComandas([])
        setPedidos([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    const refreshInterval = setInterval(
      () => {
        if (!isRefreshing) {
          const timeSinceLastSuccess = Date.now() - lastSuccessfulRefresh
          const maxInterval = 10 * 60 * 1000 // 10 minutes max

          // Skip refresh if it's been too long since last success (likely connection issues)
          if (timeSinceLastSuccess > maxInterval) {
            console.warn("[v0] Skipping refresh due to prolonged connection issues")
            return
          }

          refreshData()
        }
      },
      2000, // Reduced from 3 seconds to 2 seconds for faster sync
    )

    return () => clearInterval(refreshInterval)
  }, []) // Add dependencies for developer mode

  const addProduct = async (productData: Omit<Product, "id">) => {
    try {
      await ensureCategoryExists(productData.categoria_id)

      const { data, error } = await supabase.from("produtos").insert([productData]).select()

      if (error) throw error

      // Get the first item from the array response
      const newProduct = Array.isArray(data) ? data[0] : data
      if (newProduct) {
        setProducts((prev) => [...prev, newProduct])
      }
    } catch (error) {
      console.error("[v0] Erro ao adicionar produto:", error)
      throw error
    }
  }

  const ensureCategoryExists = async (categoriaId: string) => {
    try {
      // Check if category already exists
      const { data: existingCategory, error: checkError } = await supabase
        .from("categorias")
        .select("id")
        .eq("id", categoriaId)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is "not found" error, which is expected if category doesn't exist
        throw checkError
      }

      if (existingCategory) {
        // Category already exists, nothing to do
        return
      }

      // Category doesn't exist, create it
      let categoryName = "Categoria"
      if (categoriaId === "2b8538f0-9ffc-4982-bd15-b8fb49f67fa1") {
        categoryName = "Bebidas"
      } else if (categoriaId === "3c9649f1-0aad-4093-ae26-c9ac50a78ab2") {
        categoryName = "Porções"
      }

      const { error: insertError } = await supabase.from("categorias").insert([
        {
          id: categoriaId,
          nome: categoryName,
          descricao: `Categoria ${categoryName}`,
          ativo: true,
          created_at: new Date().toISOString(),
        },
      ])

      if (insertError) {
        console.error("[v0] Erro ao criar categoria:", insertError)
        throw insertError
      }

      console.log(`[v0] Categoria '${categoryName}' criada automaticamente`)
    } catch (error) {
      console.error("[v0] Erro ao verificar/criar categoria:", error)
      throw error
    }
  }

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    try {
      console.log("[v0] Iniciando salvamento do produto...")
      console.log("[v0] Dados do formulário:", updates)
      console.log("[v0] Produto em edição:", productId)

      console.log("[v0] Tentando função bypass para atualizar produto...")
      const { data: bypassData, error: bypassError } = await supabase.rpc("update_produto_bypass", {
        produto_id: productId,
        produto_data: updates,
      })

      console.log("[v0] Resultado função bypass:", { data: bypassData, error: bypassError })

      if (!bypassError && bypassData && bypassData.length > 0) {
        const updatedProduct = bypassData[0]
        console.log("[v0] Produto atualizado com sucesso via função bypass:", updatedProduct)
        setProducts((prev) => prev.map((p) => (p.id === productId ? updatedProduct : p)))
        console.log("[v0] Produto salvo com sucesso!")
        return
      }

      console.log("[v0] Função bypass não disponível, tentando atualização direta...")
      const { data: directData, error: directError } = await supabase
        .from("produtos")
        .update(updates)
        .eq("id", productId)
        .select()

      console.log("[v0] Resultado atualização direta:", { data: directData, error: directError })

      if (directError) {
        console.error("[v0] Erro na atualização direta:", directError)
        throw new Error(`Erro ao atualizar produto: ${directError.message}`)
      }

      if (directData && directData.length > 0) {
        const updatedProduct = directData[0]
        console.log("[v0] Produto atualizado com sucesso via consulta direta:", updatedProduct)
        setProducts((prev) => prev.map((p) => (p.id === productId ? updatedProduct : p)))
        console.log("[v0] Produto salvo com sucesso!")
        return
      }

      if (directData && directData.length === 0) {
        console.warn("[v0] Atualização bloqueada por políticas RLS - produto não foi salvo")
        throw new Error("Não foi possível salvar as alterações. Verifique as permissões do banco de dados.")
      }
    } catch (error) {
      console.error("[v0] Erro ao atualizar produto:", error)
      throw error
    }
  }

  const deleteProduct = async (productId: string) => {
    const { error } = await supabase.from("produtos").update({ disponivel: false }).eq("id", productId)

    if (error) throw error
    setProducts((prev) => prev.filter((p) => p.id !== productId))
  }

  const adicionarMesa = async (mesaData: Omit<Mesa, "id">) => {
    try {
      console.log("[v0] Adicionando nova mesa:", mesaData)

      const { data, error } = await supabase.from("mesas").insert([mesaData]).select().single()

      if (error) {
        console.error("[v0] Erro ao adicionar mesa:", error)
        throw error
      }

      console.log("[v0] Mesa adicionada com sucesso:", data)
      setMesas((prev) => [...prev, data])
    } catch (error) {
      console.error("[v0] Erro ao adicionar mesa:", error)
      throw error
    }
  }

  const updateMesa = async (mesaId: string, updates: Partial<Mesa>) => {
    const { data, error } = await supabase.from("mesas").update(updates).eq("id", mesaId).select().single()

    if (error) throw error
    setMesas((prev) => prev.map((m) => (m.id === mesaId ? data : m)))
  }

  const deleteMesa = async (mesaId: string) => {
    try {
      console.log("[v0] Excluindo mesa:", mesaId)

      const { error } = await supabase.from("mesas").delete().eq("id", mesaId)

      if (error) {
        console.error("[v0] Erro ao excluir mesa:", error)
        throw error
      }

      console.log("[v0] Mesa excluída com sucesso")
      setMesas((prev) => prev.filter((m) => m.id !== mesaId))
    } catch (error) {
      console.error("[v0] Erro ao excluir mesa:", error)
      throw error
    }
  }

  const criarComanda = async (nomeComanda: string): Promise<string> => {
    try {
      const numeroComanda = nomeComanda?.trim() || `CMD${Date.now()}`

      const { data, error } = await supabase
        .from("comandas")
        .insert([
          {
            numero_comanda: numeroComanda,
            tipo: "individual",
            status: "aberta",
            total: 0,
            desconto: 0,
            taxa_servico: 0,
          },
        ])
        .select()
        .single()

      if (error) {
        if (error.code === "23505") {
          const uniqueNumeroComanda = `${numeroComanda}-${Date.now()}`
          const { data: retryData, error: retryError } = await supabase
            .from("comandas")
            .insert([
              {
                numero_comanda: uniqueNumeroComanda,
                tipo: "individual",
                status: "aberta",
                total: 0,
                desconto: 0,
                taxa_servico: 0,
              },
            ])
            .select()
            .single()

          if (retryError) throw retryError

          setComandas((prev) => [...prev, retryData])
          console.log("[v0] Comanda criada com sucesso (com timestamp):", retryData)

          notifyOtherTabs("COMANDA_CREATED", retryData)

          return retryData.id
        }
        throw error
      }

      setComandas((prev) => [...prev, data])
      console.log("[v0] Comanda criada com sucesso:", data)

      notifyOtherTabs("COMANDA_CREATED", data)

      return data.id
    } catch (error) {
      console.error("[v0] Erro ao criar comanda:", error)
      throw error
    }
  }

  const updateComanda = async (comandaId: string, updates: Partial<Comanda>) => {
    const { data, error } = await supabase.from("comandas").update(updates).eq("id", comandaId).select().single()

    if (error) throw error
    setComandas((prev) => prev.map((c) => (c.id === comandaId ? { ...c, ...data } : c)))
  }

  const updateComandaTotal = async (comandaId: string, novoTotal: number) => {
    try {
      console.log(`[v0] Atualizando total da comanda ${comandaId} para R$ ${novoTotal.toFixed(2)}`)

      const { data, error } = await supabase
        .from("comandas")
        .update({ total: novoTotal })
        .eq("id", comandaId)
        .select()
        .single()

      if (error) throw error

      // Update local state
      setComandas((prev) => prev.map((c) => (c.id === comandaId ? { ...c, total: novoTotal } : c)))

      console.log(`[v0] Total da comanda atualizado com sucesso para R$ ${novoTotal.toFixed(2)}`)
    } catch (error) {
      console.error("[v0] Erro ao atualizar total da comanda:", error)
      throw error
    }
  }

  const finalizarComanda = async (comandaId: string) => {
    try {
      const { error: comandaError } = await supabase.from("comandas").update({ status: "fechada" }).eq("id", comandaId)

      if (comandaError) throw comandaError

      const { error: pedidosError } = await supabase
        .from("pedidos")
        .update({ status: "entregue" })
        .eq("comanda_id", comandaId)

      if (pedidosError) throw pedidosError

      // Remove from local state (only open comandas are loaded)
      setComandas((prev) => prev.filter((c) => c.id !== comandaId))
      setPedidos((prev) => prev.filter((p) => p.comanda_id !== comandaId))

      notifyOtherTabs("COMANDA_FINALIZED", { comandaId })

      console.log("[v0] Comanda finalizada com sucesso")
    } catch (error) {
      console.error("[v0] Erro ao finalizar comanda:", error)
      throw error
    }
  }

  const excluirComanda = async (comandaId: string) => {
    try {
      console.log("[v0] Excluindo comanda:", comandaId)

      // Delete all pedidos from this comanda first
      const { error: pedidosError } = await supabase.from("pedidos").delete().eq("comanda_id", comandaId)

      if (pedidosError) {
        console.error("[v0] Erro ao excluir pedidos da comanda:", pedidosError)
        throw pedidosError
      }

      // Then delete the comanda
      const { error: comandaError } = await supabase.from("comandas").delete().eq("id", comandaId)

      if (comandaError) {
        console.error("[v0] Erro ao excluir comanda:", comandaError)
        throw comandaError
      }

      // Remove from local state
      setComandas((prev) => prev.filter((c) => c.id !== comandaId))
      setPedidos((prev) => prev.filter((p) => p.comanda_id !== comandaId))

      console.log("[v0] Comanda excluída com sucesso")
    } catch (error) {
      console.error("[v0] Erro ao excluir comanda:", error)
      throw error
    }
  }

  const addPedido = async (pedidoData: Omit<Pedido, "id" | "tempo_pedido">) => {
    const { data, error } = await supabase
      .from("pedidos")
      .insert([
        {
          ...pedidoData,
          tempo_pedido: new Date().toISOString(),
        },
      ])
      .select(`*,
        produtos(*)
      `)
      .single()

    if (error) throw error

    const pedidoWithProduct = {
      ...data,
      produto: data.produtos,
    }

    setPedidos((prev) => [...prev, pedidoWithProduct])
  }

  const updatePedidoStatus = async (pedidoId: string, status: Pedido["status"]) => {
    const updateData: any = { status }

    if (status === "preparando") {
      updateData.tempo_inicio_preparo = new Date().toISOString()
    } else if (status === "pronto") {
      updateData.tempo_pronto = new Date().toISOString()
    } else if (status === "entregue") {
      updateData.tempo_entrega = new Date().toISOString()
    }

    const { data, error } = await supabase.from("pedidos").update(updateData).eq("id", pedidoId).select().single()

    if (error) throw error
    setPedidos((prev) => prev.map((p) => (p.id === pedidoId ? { ...p, ...data } : p)))
  }

  const removerItemPedido = async (pedidoId: string) => {
    try {
      console.log("[v0] Removendo pedido:", pedidoId)

      const { error } = await supabase.from("pedidos").delete().eq("id", pedidoId)

      if (error) throw error

      // Remove from local state
      setPedidos((prev) => prev.filter((p) => p.id !== pedidoId))

      console.log("[v0] Pedido removido com sucesso")
    } catch (error) {
      console.error("[v0] Erro ao remover pedido:", error)
      throw error
    }
  }

  const getPedidosByComanda = (comandaId: string) => {
    return pedidos.filter((pedido) => pedido.comanda_id === comandaId)
  }

  const calcularTotalComanda = (comandaId: string) => {
    const pedidosDaComanda = getPedidosByComanda(comandaId)
    return pedidosDaComanda.reduce((total, pedido) => total + pedido.subtotal, 0)
  }

  const adicionarItensComanda = async (
    comandaId: string,
    itens: Array<{ produto_id: string; quantidade: number; observacoes?: string }>,
  ) => {
    // Get existing pedidos for this comanda
    const { data: existingPedidos, error: fetchError } = await supabase
      .from("pedidos")
      .select("*")
      .eq("comanda_id", comandaId)
      .or("status.is.null,status.neq.entregue")

    if (fetchError) throw fetchError

    const pedidosToInsert = []

    for (const item of itens) {
      const produto = products.find((p) => p.id === item.produto_id)
      if (!produto) continue

      const itemObservacoes = item.observacoes?.trim() || null

      // Determine status based on product category - only portions need status
      const isPorcao =
        produto.nome.toLowerCase().includes("porção") ||
        produto.nome.toLowerCase().includes("porcao") ||
        produto.nome.toLowerCase().includes("batata") ||
        produto.nome.toLowerCase().includes("frango") ||
        produto.nome.toLowerCase().includes("pastel") ||
        produto.nome.toLowerCase().includes("mandioca")

      const itemStatus = isPorcao ? "preparando" : null

      // Always create new pedidos - no more merging with existing ones
      pedidosToInsert.push({
        comanda_id: comandaId,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: produto.preco,
        subtotal: produto.preco * item.quantidade,
        observacoes: itemObservacoes,
        status: itemStatus,
        tempo_pedido: new Date().toISOString(),
      })
    }

    // Insert new pedidos
    if (pedidosToInsert.length > 0) {
      await supabase.from("pedidos").insert(pedidosToInsert)
    }

    if (pedidosToInsert.length > 0) {
      // Calculate new total from all pedidos in this comanda
      const { data: allPedidos, error: totalError } = await supabase
        .from("pedidos")
        .select("subtotal")
        .eq("comanda_id", comandaId)
        .or("status.is.null,status.neq.entregue")

      if (totalError) throw totalError

      const novoTotal = allPedidos?.reduce((total, pedido) => total + (pedido.subtotal || 0), 0) || 0

      // Update comanda total in database
      const { error: updateError } = await supabase.from("comandas").update({ total: novoTotal }).eq("id", comandaId)

      if (updateError) throw updateError

      console.log(`[v0] Total da comanda atualizado para: R$ ${novoTotal.toFixed(2)}`)

      notifyOtherTabs("ITEMS_ADDED", { comandaId, itens })

      await refreshData()
    }
  }

  const getComandasByMesa = (mesaId: string) => {
    console.warn("[v0] getComandasByMesa is deprecated - use direct comanda access instead")
    return []
  }

  const getPedidosByMesa = (mesaId: string) => {
    console.warn("[v0] getPedidosByMesa is deprecated - use getPedidosByComanda instead")
    return []
  }

  const addComanda = async (comandaData: any): Promise<string> => {
    console.warn("[v0] addComanda is deprecated - use criarComanda instead")
    return criarComanda(comandaData.nome_comanda || "Nova Comanda")
  }

  const adicionarPedido = async (pedido: any) => {
    // Placeholder for adicionarPedido function
    console.warn("[v0] adicionarPedido is not implemented")
  }

  const atualizarStatus = async (id: string, status: string) => {
    // Placeholder for atualizarStatus function
    console.warn("[v0] atualizarStatus is not implemented")
  }

  return (
    <PedidosContext.Provider
      value={{
        products,
        mesas,
        comandas,
        pedidos,
        orders: pedidos,
        isLoading,
        refreshData,
        addProduct,
        updateProduct,
        deleteProduct,
        adicionarMesa,
        updateMesa,
        deleteMesa,
        criarComanda,
        updateComanda,
        updateComandaTotal,
        finalizarComanda,
        excluirComanda,
        adicionarItensComanda,
        getPedidosByComanda,
        calcularTotalComanda,
        addPedido,
        updatePedidoStatus,
        removerItemPedido,
        adicionarPedido,
        atualizarStatus,
        // Deprecated functions
        addComanda,
        getComandasByMesa,
        getPedidosByMesa,
      }}
    >
      {children}
    </PedidosContext.Provider>
  )
}

export function usePedidos() {
  const context = useContext(PedidosContext)
  if (context === undefined) {
    throw new Error("usePedidos must be used within a PedidosProvider")
  }
  return context
}
