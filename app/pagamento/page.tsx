"use client"

import { useState } from "react"
import PagamentoInterface from "@/components/pagamento-interface"
import PasswordProtection from "@/components/password-protection"
import PasswordSettings from "@/components/password-settings"
import { useRouter, useSearchParams } from "next/navigation"

export default function PagamentoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPasswordSettings, setShowPasswordSettings] = useState(false)
  const mesaId = searchParams.get("mesa")

  if (!isAuthenticated) {
    return (
      <PasswordProtection
        title="Acesso ao sistema de pagamento"
        onSuccess={() => setIsAuthenticated(true)}
        onBack={() => router.push("/")}
        requiredPassword="CRivesAdmin@2025"
        storageKey="payment-password-saved"
      />
    )
  }

  if (showPasswordSettings) {
    return (
      <PasswordSettings
        title="⚙️ Configurações de Senha - Pagamento"
        passwordKey="payment-password"
        onBack={() => setShowPasswordSettings(false)}
      />
    )
  }

  return <PagamentoInterface onBack={() => router.push("/")} mesaId={mesaId || undefined} />
}
