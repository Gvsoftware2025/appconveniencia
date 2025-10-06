"use client"

import { useState, useEffect } from "react"
import GestaoInterface from "@/components/gestao-pedidos"
import PasswordProtection from "@/components/password-protection"
import PasswordSettings from "@/components/password-settings"
import { useRouter, useSearchParams } from "next/navigation"

export default function GestaoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPasswordSettings, setShowPasswordSettings] = useState(false)
  const comandaId = searchParams.get("comanda")

  const GESTAO_PASSWORD = "CRivesAdmin@2025"

  useEffect(() => {
    localStorage.removeItem("gestao-password-saved")
  }, [])

  const handleAuthentication = () => {
    setIsAuthenticated(true)
  }

  if (!isAuthenticated) {
    return (
      <PasswordProtection
        title="Acesso ao painel de gestão de pedidos"
        onSuccess={handleAuthentication}
        onBack={() => router.push("/")}
        requiredPassword={GESTAO_PASSWORD}
        storageKey="gestao-password-saved"
        forcePasswordPrompt={true}
      />
    )
  }

  if (showPasswordSettings) {
    return (
      <PasswordSettings
        title="Configurar Senha - Gestão de Pedidos"
        passwordKey="gestao-password"
        onBack={() => setShowPasswordSettings(false)}
      />
    )
  }

  return (
    <GestaoInterface
      onBack={() => router.push("/")}
      onPasswordSettings={() => setShowPasswordSettings(true)}
      initialComandaId={comandaId || undefined}
    />
  )
}
