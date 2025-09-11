"use client"

import { useState } from "react"
import AdminProdutos from "@/components/admin-produtos"
import PasswordProtection from "@/components/password-protection"
import PasswordSettings from "@/components/password-settings"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPasswordSettings, setShowPasswordSettings] = useState(false)

  if (!isAuthenticated) {
    return (
      <PasswordProtection
        title="Acesso ao painel administrativo"
        onSuccess={() => setIsAuthenticated(true)}
        onBack={() => router.push("/")}
        requiredPassword="CRivesAdmin@2025"
        storageKey="admin-password-saved"
      />
    )
  }

  if (showPasswordSettings) {
    return (
      <PasswordSettings
        title="⚙️ Configurações de Senha - Admin"
        passwordKey="admin-password"
        onBack={() => setShowPasswordSettings(false)}
      />
    )
  }

  return <AdminProdutos onBack={() => router.push("/")} />
}
