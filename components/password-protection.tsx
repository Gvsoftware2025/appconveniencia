"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Lock, Eye, EyeOff, Save } from "lucide-react"

interface PasswordProtectionProps {
  title: string
  onSuccess: () => void
  onBack: () => void
  requiredPassword?: string
  storageKey?: string
  forcePasswordPrompt?: boolean
}

export default function PasswordProtection({
  title,
  onSuccess,
  onBack,
  requiredPassword = "admin123",
  storageKey = "saved_password",
  forcePasswordPrompt = false,
}: PasswordProtectionProps) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [savePassword, setSavePassword] = useState(false)

  const getValidationPassword = () => {
    const passwordKey = storageKey.replace("-saved", "")

    // Clear any old custom passwords that might conflict
    const customPasswordKey = `custom_${passwordKey}`
    if (localStorage.getItem(customPasswordKey)) {
      localStorage.removeItem(customPasswordKey)
    }

    return requiredPassword
  }

  useEffect(() => {
    if (!forcePasswordPrompt) {
      const savedPassword = localStorage.getItem(storageKey)
      const validationPassword = getValidationPassword()
      if (savedPassword === validationPassword) {
        onSuccess()
      }
    }
  }, [requiredPassword, storageKey, onSuccess, forcePasswordPrompt])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validationPassword = getValidationPassword()

    console.log("[v0] Password validation:", {
      entered: password,
      required: validationPassword,
      match: password === validationPassword,
    })

    if (password === validationPassword) {
      if (savePassword) {
        localStorage.setItem(storageKey, password)
      }
      onSuccess()
    } else {
      setError("Senha incorreta. Verifique e tente novamente.")
      setPassword("")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/restaurant-interior.png')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-purple-900/90 to-slate-900/90" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/80 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/20 rounded-full mb-4">
              <Lock className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Acesso Restrito</h2>
            <p className="text-gray-300">{title}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">Senha de Acesso</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError("")
                  }}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 pr-12"
                  placeholder="Digite a senha..."
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm mt-2 font-medium"
                >
                  {error}
                </motion.p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="savePassword"
                checked={savePassword}
                onChange={(e) => setSavePassword(e.target.checked)}
                className="w-4 h-4 text-orange-500 bg-white/10 border-white/20 rounded focus:ring-orange-500 focus:ring-2"
              />
              <label htmlFor="savePassword" className="text-white text-sm flex items-center gap-2">
                <Save className="w-4 h-4" />
                Salvar senha no dispositivo
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 px-4 py-3 bg-slate-700/60 text-white rounded-lg hover:bg-slate-700/80 transition-colors"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all duration-200"
              >
                Acessar
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
