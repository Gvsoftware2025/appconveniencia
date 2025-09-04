"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Users, ChefHat, ClipboardList, CreditCard, Settings } from "lucide-react"
import GarcomInterface from "@/components/garcom-interface"
import CozinhaInterface from "@/components/cozinha-interface"
import GestaoInterface from "@/components/gestao-pedidos"
import PagamentoInterface from "@/components/pagamento-interface"
import AdminProdutos from "@/components/admin-produtos"
import Image from "next/image"

export default function HomePage() {
  const [activeInterface, setActiveInterface] = useState<string | null>(null)

  if (activeInterface) {
    const interfaces = {
      garcom: <GarcomInterface onBack={() => setActiveInterface(null)} />,
      cozinha: <CozinhaInterface onBack={() => setActiveInterface(null)} />,
      gestao: <GestaoInterface onBack={() => setActiveInterface(null)} />,
      pagamento: <PagamentoInterface onBack={() => setActiveInterface(null)} />,
      admin: <AdminProdutos onBack={() => setActiveInterface(null)} />,
    }
    return interfaces[activeInterface as keyof typeof interfaces]
  }

  const interfaceCards = [
    {
      id: "garcom",
      title: "Interface do Garçom",
      description: "Faça pedidos diretamente das mesas com interface intuitiva e responsiva",
      icon: Users,
      color: "from-emerald-500 to-teal-600",
      features: ["Seleção de mesas", "Sistema de comandas", "Divisão de conta"],
    },
    {
      id: "cozinha",
      title: "Interface da Cozinha",
      description: "Visualize e gerencie pedidos em tempo real com notificações instantâneas",
      icon: ChefHat,
      color: "from-orange-500 to-red-600",
      features: ["Pedidos em tempo real", "Status dos pedidos", "Filtros por comandas"],
    },
    {
      id: "gestao",
      title: "Gestão de Pedidos",
      description: "Dashboard completo com relatórios, estatísticas e controle de pedidos",
      icon: ClipboardList,
      color: "from-blue-500 to-indigo-600",
      features: ["Dashboard executivo", "Relatórios de vendas", "Controle de comandas"],
    },
    {
      id: "pagamento",
      title: "Sistema de Pagamento",
      description: "Gerencie fechamento de contas e integração com o sistema de caixa",
      icon: CreditCard,
      color: "from-purple-500 to-pink-600",
      features: ["Múltiplos métodos", "Divisão de conta", "Comprovantes"],
    },
    {
      id: "admin",
      title: "Admin - Produtos",
      description: "Gerencie produtos, preços, imagens e disponibilidade do cardápio",
      icon: Settings,
      color: "from-cyan-500 to-blue-600",
      features: ["Adicionar produtos", "Upload de imagens", "Controle de estoque"],
    },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/restaurant-interior.png)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-purple-900/80 to-slate-900/90 backdrop-blur-sm" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="text-center py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <div className="inline-block p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
              <Image
                src="/logo-conveniencia.png"
                alt="Conveniência"
                width={300}
                height={80}
                className="hover:scale-105 transition-transform duration-300"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              Sistema de Pedidos
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto px-4">
              Plataforma ultra-moderna para gestão completa do seu restaurante
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-emerald-400">
              <span className="flex items-center gap-1">⚡ Tecnologia de ponta</span>
              <span className="flex items-center gap-1">📱 Interface intuitiva</span>
              <span className="flex items-center gap-1">⏱️ Tempo real</span>
            </div>
          </motion.div>
        </header>

        <main className="flex-1 container mx-auto px-4 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {interfaceCards.slice(0, 4).map((card, index) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  onClick={() => setActiveInterface(card.id)}
                  className="group cursor-pointer"
                >
                  <div className="h-full bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-r ${card.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-300 transition-colors">
                          {card.title}
                        </h3>
                        <p className="text-white/70 text-sm leading-relaxed">{card.description}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {card.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-white/60">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <span className="text-sm text-white/50">Clique para acessar</span>
                      <div className="text-orange-400 group-hover:translate-x-1 transition-transform duration-300">
                        →
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="flex justify-center mt-6 max-w-6xl mx-auto">
            <div className="w-full max-w-md">
              {(() => {
                const card = interfaceCards[4] // Admin card
                const Icon = card.icon
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    onClick={() => setActiveInterface(card.id)}
                    className="group cursor-pointer"
                  >
                    <div className="h-full bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
                      <div className="flex items-start gap-4 mb-4">
                        <div
                          className={`p-3 rounded-xl bg-gradient-to-r ${card.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-300 transition-colors">
                            {card.title}
                          </h3>
                          <p className="text-white/70 text-sm leading-relaxed">{card.description}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {card.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-white/60">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {feature}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <span className="text-sm text-white/50">Clique para acessar</span>
                        <div className="text-orange-400 group-hover:translate-x-1 transition-transform duration-300">
                          →
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })()}
            </div>
          </div>
        </main>

        <footer className="text-center py-6 text-white/60 text-sm">
          <p>Transforme a experiência do seu restaurante com tecnologia de ponta</p>
          <div className="flex justify-center gap-6 mt-2 text-xs">
            <span className="flex items-center gap-1">⚡ Tempo Real</span>
            <span className="flex items-center gap-1">📱 Responsivo</span>
            <span className="flex items-center gap-1">🔒 Seguro</span>
            <span className="flex items-center gap-1">🚀 Rápido</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
