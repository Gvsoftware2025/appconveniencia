"use client"

import { useState, useEffect } from "react"
import { useInterface } from "@/contexts/interface-context"
import { motion } from "framer-motion"
import { Users, ClipboardList, CreditCard, Settings, FileText } from "lucide-react"
import GarcomInterface from "@/components/garcom-interface"
import GestaoInterface from "@/components/gestao-pedidos"
import PagamentoInterface from "@/components/pagamento-interface"
import AdminProdutos from "@/components/admin-produtos"
import PasswordProtection from "@/components/password-protection"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const [activeInterface, setActiveInterface] = useState<string | null>(null)
  const { setActiveInterface: setGlobalActiveInterface } = useInterface()
  const [showPasswordScreen, setShowPasswordScreen] = useState<string | null>(null)
  const [mainPasswordEntered, setMainPasswordEntered] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setGlobalActiveInterface(activeInterface)
  }, [activeInterface, setGlobalActiveInterface])

  useEffect(() => {
    console.log("[v0] HomePage: Component mounted")
    // Clear old custom passwords that might conflict with new system
    const keysToRemove = [
      "custom_admin-password",
      "custom_payment-password",
      "custom_gestao-password",
      "custom_main_system_password",
    ]
    keysToRemove.forEach((key) => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
      }
    })
  }, [])

  console.log("[v0] HomePage: Rendering with state:", { activeInterface, showPasswordScreen, mainPasswordEntered })

  if (!mainPasswordEntered) {
    console.log("[v0] HomePage: Showing main password screen")
    return (
      <PasswordProtection
        title="Digite a senha para acessar o sistema"
        onSuccess={() => setMainPasswordEntered(true)}
        onBack={() => {}} // No back button for main screen
        requiredPassword="1154" // Updated main password
        storageKey="main-system-password-saved" // Added storage key for main password
      />
    )
  }

  const handleInterfaceClick = (interfaceId: string) => {
    console.log("[v0] HomePage: Interface clicked:", interfaceId)

    if (interfaceId === "comandas") {
      router.push("/comandas")
      return
    }

    if (interfaceId === "admin" || interfaceId === "pagamento") {
      setShowPasswordScreen(interfaceId)
      setActiveInterface(interfaceId)
      return
    }

    setActiveInterface(interfaceId)
  }

  const handleAdminPasswordSuccess = () => {
    console.log("[v0] HomePage: Admin password success")
    setShowPasswordScreen(null)
    // activeInterface is already set, just remove password screen
  }

  if (showPasswordScreen === "admin") {
    console.log("[v0] HomePage: Showing admin password screen")
    return (
      <PasswordProtection
        title="Acesso à área administrativa"
        onSuccess={handleAdminPasswordSuccess}
        onBack={() => {
          setShowPasswordScreen(null)
          setActiveInterface(null)
        }}
        requiredPassword="CRivesAdmin@2025"
        storageKey="admin-password-saved" // Added storage key for admin password
      />
    )
  }

  if (showPasswordScreen === "pagamento") {
    console.log("[v0] HomePage: Showing payment password screen")
    return (
      <PasswordProtection
        title="Acesso ao sistema de pagamento"
        onSuccess={handleAdminPasswordSuccess}
        onBack={() => {
          setShowPasswordScreen(null)
          setActiveInterface(null)
        }}
        requiredPassword="CRivesAdmin@2025"
        storageKey="payment-password-saved" // Added storage key for payment password
      />
    )
  }

  if (activeInterface) {
    console.log("[v0] HomePage: Showing interface:", activeInterface)
    const interfaces = {
      garcom: <GarcomInterface onBack={() => setActiveInterface(null)} />,
      gestao: <GestaoInterface onBack={() => setActiveInterface(null)} />,
      pagamento: <PagamentoInterface onBack={() => setActiveInterface(null)} />,
      admin: <AdminProdutos onBack={() => setActiveInterface(null)} />,
    }
    return <div className="relative">{interfaces[activeInterface as keyof typeof interfaces]}</div>
  }

  console.log("[v0] HomePage: Showing main menu")

  const interfaceCards = [
    {
      id: "garcom",
      title: "Interface do Garçom",
      description: "Faça pedidos diretamente das comandas com interface intuitiva e responsiva",
      icon: Users,
      color: "from-emerald-500 to-teal-600",
      features: ["Sistema de comandas", "Pedidos por nome", "Impressão automática"],
    },
    {
      id: "comandas",
      title: "Gerenciar Comandas",
      description: "Visualize todas as comandas abertas e fechadas em um só lugar",
      icon: FileText,
      color: "from-cyan-500 to-blue-600",
      features: ["Visualizar comandas", "Status em tempo real", "Acesso rápido ao pagamento"],
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
      color: "from-orange-500 to-red-600",
      features: ["Adicionar produtos", "Upload de imagens", "Controle de estoque"],
    },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-slate-900/95 backdrop-blur-sm" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="text-center py-4 md:py-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <div className="inline-block p-4 md:p-8 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl rounded-3xl border-4 border-orange-400/70 shadow-2xl hover:shadow-orange-400/40 transition-all duration-300 hover:scale-105">
              <div className="text-3xl sm:text-4xl md:text-6xl font-black text-orange-400 px-2 sm:px-4 md:px-8 py-2 md:py-4 drop-shadow-2xl text-shadow-lg filter brightness-110 contrast-125">
                CONVENIÊNCIA
              </div>
              <div className="text-sm md:text-lg text-orange-300 font-bold tracking-wider drop-shadow-lg bg-slate-900/50 px-2 md:px-4 py-1 md:py-2 rounded-lg border border-orange-400/30">
                SISTEMA DE GESTÃO
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-4"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-orange-400">
              Sistema de Pedidos
            </h1>
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg p-4 mx-auto max-w-2xl">
              <p className="text-lg sm:text-xl text-white">
                Plataforma ultra-moderna para gestão completa do seu restaurante
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 md:gap-4 text-xs md:text-sm">
              <span className="flex items-center gap-1 bg-slate-800/90 text-white px-2 md:px-3 py-1 md:py-2 rounded-full border border-emerald-400/50">
                ⚡ Tecnologia de ponta
              </span>
              <span className="flex items-center gap-1 bg-slate-800/90 text-white px-2 md:px-3 py-1 md:py-2 rounded-full border border-emerald-400/50">
                📱 Interface intuitiva
              </span>
              <span className="flex items-center gap-1 bg-slate-800/90 text-white px-2 md:px-3 py-1 md:py-2 rounded-full border border-emerald-400/50">
                ⏱️ Tempo real
              </span>
            </div>
          </motion.div>
        </header>

        <main className="flex-1 container mx-auto px-4 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {interfaceCards.map((card, index) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  onClick={() => handleInterfaceClick(card.id)}
                  className="group cursor-pointer"
                >
                  <div className="h-full bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-slate-800/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
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
                        <p className="text-gray-200 text-sm leading-relaxed">{card.description}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {card.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <span className="text-sm text-gray-400">Clique para acessar</span>
                      <div className="text-orange-400 group-hover:translate-x-1 transition-transform duration-300">
                        →
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
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
