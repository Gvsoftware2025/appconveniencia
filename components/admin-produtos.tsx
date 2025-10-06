"use client"

import type React from "react"
import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Edit, Trash2, Upload, Save, ArrowLeft, ImageIcon } from "lucide-react"
import Image from "next/image"
import { usePedidos } from "@/contexts/pedidos-context"
import { useToast } from "./toast-notification"

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
}

interface AdminProdutosProps {
  onBack: () => void
}

export default function AdminProdutos({ onBack }: AdminProdutosProps) {
  const { products, addProduct, updateProduct, deleteProduct, isLoading } = usePedidos()
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    preco: "",
    categoria_id: "1",
    imagem_url: "",
    descricao: "",
    disponivel: true,
    tempo_preparo: 5,
    ingredientes: [] as string[],
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const handleOpenModal = (product?: Produto) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        nome: product.nome,
        preco: product.preco.toFixed(2).replace(".", ","),
        categoria_id: product.categoria_id,
        imagem_url: product.imagem_url || "",
        descricao: product.descricao || "",
        disponivel: product.disponivel,
        tempo_preparo: product.tempo_preparo,
        ingredientes: product.ingredientes,
      })
      setImagePreview(product.imagem_url || "")
    } else {
      setEditingProduct(null)
      const defaultCategoriaId = products.length > 0 ? products[0].categoria_id : "2b8538f0-9ffc-4982-bd15-b8fb49f67fa1"
      setFormData({
        nome: "",
        preco: "",
        categoria_id: defaultCategoriaId,
        imagem_url: "",
        descricao: "",
        disponivel: true,
        tempo_preparo: 5,
        ingredientes: [],
      })
      setImagePreview("")
    }
    setImageFile(null)
    setShowModal(true)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImageToStorage = async (file: File): Promise<string> => {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const base64String = e.target?.result as string
          resolve(base64String)
        }
        reader.onerror = (error) => {
          console.error("[v0] Erro ao converter imagem:", error)
          reject(error)
        }
        reader.readAsDataURL(file)
      })
    } catch (error) {
      console.error("[v0] Erro ao processar imagem:", error)
      return `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(formData.nome || "produto")}`
    }
  }

  const handlePrecoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value

    // Remove caracteres não numéricos exceto vírgula e ponto
    value = value.replace(/[^\d,.]/g, "")

    // Permite apenas uma vírgula ou ponto
    const commaCount = (value.match(/,/g) || []).length
    const dotCount = (value.match(/\./g) || []).length

    if (commaCount > 1) {
      value = value.replace(/,(?=.*,)/g, "")
    }
    if (dotCount > 1) {
      value = value.replace(/\.(?=.*\.)/g, "")
    }

    // Limita a 2 casas decimais
    if (value.includes(",")) {
      const parts = value.split(",")
      if (parts[1] && parts[1].length > 2) {
        parts[1] = parts[1].substring(0, 2)
        value = parts.join(",")
      }
    } else if (value.includes(".")) {
      const parts = value.split(".")
      if (parts[1] && parts[1].length > 2) {
        parts[1] = parts[1].substring(0, 2)
        value = parts.join(".")
      }
    }

    setFormData({ ...formData, preco: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      console.log("[v0] Iniciando salvamento do produto...")
      console.log("[v0] Dados do formulário:", formData)
      console.log("[v0] Produto em edição:", editingProduct?.id)
      console.log("[v0] Arquivo de imagem:", imageFile?.name)

      let imageUrl = formData.imagem_url

      if (imageFile) {
        console.log("[v0] Processando upload de imagem...")
        try {
          imageUrl = await uploadImageToStorage(imageFile)
          console.log("[v0] Imagem processada com sucesso")
        } catch (imageError) {
          console.error("[v0] Erro no processamento da imagem:", imageError)
          toast.error("Erro no upload da imagem", "O produto será salvo sem a imagem.")
        }
      }

      const precoNumber = Number.parseFloat(formData.preco.replace(",", ".")) || 0

      const productData = {
        ...formData,
        preco: precoNumber,
        imagem_url: imageUrl,
        ingredientes: Array.isArray(formData.ingredientes) ? formData.ingredientes : [],
      }

      console.log("[v0] Dados finais do produto:", productData)

      if (editingProduct) {
        console.log("[v0] Atualizando produto existente:", editingProduct.id)
        await updateProduct(editingProduct.id, productData)
        console.log("[v0] Produto atualizado com sucesso")
        toast.success("Produto atualizado!", "As alterações foram salvas com sucesso.")
      } else {
        console.log("[v0] Criando novo produto")
        await addProduct(productData)
        console.log("[v0] Produto criado com sucesso")
        toast.success("Produto criado!", "O novo produto foi adicionado ao cardápio.")
      }

      handleCloseModal()
    } catch (error) {
      console.error("[v0] Erro ao salvar produto:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      toast.error("Erro ao salvar produto", `Detalhes: ${errorMessage}`)
    }
  }

  const handleDelete = async (productId: string) => {
    if (productId === "00000000-0000-0000-0000-000000000001") {
      toast.error("Não é possível excluir", "O produto 'Diversos' é um produto fixo do sistema.")
      return
    }

    if (confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        await deleteProduct(productId)
        toast.success("Produto removido", "O produto foi removido do cardápio.")
      } catch (error) {
        console.error("[v0] Erro ao excluir produto:", error)
        toast.error("Erro ao excluir produto", "Não foi possível remover o produto. Tente novamente.")
      }
    }
  }

  const getCategoryName = (categoryId: string) => {
    switch (categoryId) {
      case "2b8538f0-9ffc-4982-bd15-b8fb49f67fa1":
        return "Bebidas"
      case "3c9649f1-0aad-4093-ae26-c9ac50a78ab2":
        return "Porções"
      case "4d0750f2-1bbd-5104-bf37-d0bd51b89bc3":
        return "Diversos"
      default:
        return "Categoria"
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProduct(null)
    setImageFile(null)
    setImagePreview("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/restaurant-interior.png')] bg-cover bg-center opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-purple-900/90 to-slate-900/90" />

      <div className="relative z-10 flex items-center justify-between p-4 backdrop-blur-xl bg-white/10 border-b border-white/20">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700/60 hover:bg-slate-700/80 rounded-lg border border-white/20 transition-all duration-200"
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

        <div className="px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-lg">
          <span className="text-blue-400 font-medium">Admin - Produtos</span>
        </div>
      </div>

      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
            Gerenciar Produtos
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Novo Produto
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ scale: 1.02 }}
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-4 shadow-2xl"
            >
              <div className="relative mb-4">
                <div className="w-full h-32 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                  {product.imagem_url ? (
                    <Image
                      src={product.imagem_url || "/placeholder.svg"}
                      alt={product.nome}
                      width={200}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-white/50" />
                  )}
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => handleOpenModal(product)}
                    className="p-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  {product.id !== "00000000-0000-0000-0000-000000000001" && (
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-white">{product.nome}</h3>
                <p className="text-emerald-400 font-bold">R$ {product.preco.toFixed(2)}</p>
                <p className="text-blue-400 text-sm">{getCategoryName(product.categoria_id)}</p>
                <p className="text-gray-300 text-sm">Tempo: {product.tempo_preparo}min</p>
                {product.descricao && <p className="text-gray-400 text-xs line-clamp-2">{product.descricao}</p>}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      product.disponivel ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {product.disponivel ? "Disponível" : "Indisponível"}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {showModal && (
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
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                    {editingProduct ? "Editar Produto" : "Novo Produto"}
                  </h2>
                  <button onClick={handleCloseModal} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Nome do Produto</label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Ex: Hambúrguer Especial"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">Preço (R$)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9,]*"
                        value={formData.preco}
                        onChange={handlePrecoChange}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="0,00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Categoria</label>
                    <select
                      value={formData.categoria_id}
                      onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 [&>option]:bg-slate-800 [&>option]:text-white"
                      required
                    >
                      <option value="2b8538f0-9ffc-4982-bd15-b8fb49f67fa1" className="bg-slate-800 text-white">
                        Bebidas
                      </option>
                      <option value="3c9649f1-0aad-4093-ae26-c9ac50a78ab2" className="bg-slate-800 text-white">
                        Porções
                      </option>
                      <option value="4d0750f2-1bbd-5104-bf37-d0bd51b89bc3" className="bg-slate-800 text-white">
                        Diversos
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Descrição</label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-20 resize-none"
                      placeholder="Descrição do produto..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Tempo de Preparo (min)
                        <span className="text-gray-400 text-sm font-normal ml-1">(opcional)</span>
                      </label>
                      <input
                        type="number"
                        value={formData.tempo_preparo}
                        onChange={(e) =>
                          setFormData({ ...formData, tempo_preparo: Number.parseInt(e.target.value) || 0 })
                        }
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        min="0"
                        placeholder="0 para bebidas, 5-30 para comidas"
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">Status</label>
                      <select
                        value={formData.disponivel ? "true" : "false"}
                        onChange={(e) => setFormData({ ...formData, disponivel: e.target.value === "true" })}
                        className="w-full px-4 py-2 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 [&>option]:bg-slate-800 [&>option]:text-white"
                      >
                        <option value="true" className="bg-slate-800 text-white">
                          Disponível
                        </option>
                        <option value="false" className="bg-slate-800 text-white">
                          Indisponível
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Imagem do Produto</label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          Escolher Imagem
                        </button>
                        <span className="text-gray-400 text-sm">
                          {imageFile ? imageFile.name : "Nenhuma imagem selecionada"}
                        </span>
                      </div>

                      {imagePreview && (
                        <div className="w-32 h-32 bg-white/10 rounded-lg overflow-hidden">
                          <Image
                            src={imagePreview || "/placeholder.svg"}
                            alt="Preview"
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-2 bg-slate-700/60 text-white rounded-lg hover:bg-slate-700/80 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200"
                    >
                      <Save className="w-4 h-4" />
                      {editingProduct ? "Atualizar" : "Criar"} Produto
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
