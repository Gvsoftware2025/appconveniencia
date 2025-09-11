"use client"

import { useState, useEffect } from "react"
import GestaoInterface from "@/components/gestao-pedidos"
import PasswordProtection from "@/components/password-protection"
import PasswordSettings from "@/components/password-settings"
import { useRouter } from "next/navigation"

export default function GestaoPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPasswordSettings, setShowPasswordSettings] = useState(false)

  useEffect(() => {
    localStorage.removeItem("gestao-password-saved")
  }, [])

  const handleAuthentication = (password) => {
    if (password === process.env.NEXT_PUBLIC_GESTAO_PASSWORD) {
      setIsAuthenticated(true)
    } else {
      alert("Senha incorreta. Tente novamente.")
    }
  }

  if (!isAuthenticated) {
    return (
      <PasswordProtection
        title="Acesso ao painel de gestão de pedidos"
        onSuccess={handleAuthentication}
        onBack={() => router.push("/")}
        requiredPassword={process.env.NEXT_PUBLIC_GESTAO_PASSWORD} // Use variável de ambiente
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
    />
  )
}
