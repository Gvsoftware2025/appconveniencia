"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff, Save, Key, ArrowLeft } from "lucide-react"

interface PasswordSettingsProps {
  title: string
  passwordKey: string
  onBack: () => void
}

export default function PasswordSettings({ title, passwordKey, onBack }: PasswordSettingsProps) {
  const [password, setPassword] = useState("CRivesAdmin@2025")
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const savedPassword = localStorage.getItem(`custom_${passwordKey}`) || "CRivesAdmin@2025"
    setPassword(savedPassword)
  }, [passwordKey])

  const handleSave = () => {
    localStorage.setItem(`custom_${passwordKey}`, password)
    setSuccess("✅ Senha atualizada com sucesso!")
    setTimeout(() => setSuccess(""), 3000)
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
              <Key className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
            <p className="text-gray-300">Defina uma senha personalizada para maior segurança</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">Nova Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 pr-12"
                  placeholder="Digite a nova senha..."
                  minLength={4}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-2">Mínimo de 4 caracteres. Use uma senha forte e segura.</p>
            </div>

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-green-400 text-sm text-center bg-green-500/10 border border-green-500/30 p-3 rounded-lg"
              >
                {success}
              </motion.div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="flex-1 px-4 py-3 bg-slate-700/60 text-white rounded-lg hover:bg-slate-700/80 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <button
                onClick={handleSave}
                disabled={password.length < 4}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Salvar Senha
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm">
              💡 <strong>Dica:</strong> Anote sua senha em local seguro. Você precisará dela para acessar esta
              interface.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
