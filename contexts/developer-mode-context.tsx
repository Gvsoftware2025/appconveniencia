"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface DeveloperModeContextType {
  isDeveloperMode: boolean
  toggleDeveloperMode: () => void
  mockData: {
    pedidos: any[]
    comandas: any[]
    produtos: any[]
  }
  setMockData: (data: Partial<DeveloperModeContextType["mockData"]>) => void
}

const DeveloperModeContext = createContext<DeveloperModeContextType | undefined>(undefined)

export function DeveloperModeProvider({ children }: { children: ReactNode }) {
  const [isDeveloperMode, setIsDeveloperMode] = useState(false)
  const [mockData, setMockDataState] = useState({
    pedidos: [],
    comandas: [],
    produtos: [],
  })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Shift+A
      if (event.ctrlKey && event.shiftKey && event.key === "A") {
        event.preventDefault()
        toggleDeveloperMode()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const toggleDeveloperMode = () => {
    setIsDeveloperMode((prev) => {
      const newMode = !prev
      console.log(`[v0] Developer Mode ${newMode ? "ATIVADO" : "DESATIVADO"}`)

      // Show toast notification
      if (typeof window !== "undefined") {
        const event = new CustomEvent("show-toast", {
          detail: {
            title: newMode ? "🔧 Modo Desenvolvedor ATIVADO" : "✅ Modo Normal ATIVADO",
            description: newMode
              ? "Todas as operações são simuladas e não afetam o banco de dados"
              : "Operações normais restauradas",
            type: newMode ? "info" : "success",
          },
        })
        window.dispatchEvent(event)
      }

      return newMode
    })
  }

  const setMockData = (data: Partial<DeveloperModeContextType["mockData"]>) => {
    setMockDataState((prev) => ({ ...prev, ...data }))
  }

  return (
    <DeveloperModeContext.Provider
      value={{
        isDeveloperMode,
        toggleDeveloperMode,
        mockData,
        setMockData,
      }}
    >
      {children}
      {/* Developer Mode Indicator */}
      {isDeveloperMode && (
        <div className="fixed top-4 right-4 z-[9999] bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg border-2 border-orange-400 animate-pulse">
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>🔧 MODO DESENVOLVEDOR
          </div>
          <div className="text-xs opacity-90 mt-1">Ctrl+Shift+A para desativar</div>
        </div>
      )}
    </DeveloperModeContext.Provider>
  )
}

export function useDeveloperMode() {
  const context = useContext(DeveloperModeContext)
  if (context === undefined) {
    throw new Error("useDeveloperMode must be used within a DeveloperModeProvider")
  }
  return context
}

// Hook para interceptar operações de banco de dados
export function useDevDatabase() {
  const { isDeveloperMode, mockData, setMockData } = useDeveloperMode()

  const interceptedOperation = <T,>(
    operation: () => Promise<T> | T,
    mockResult?: T,
    operationName?: string,
  ): Promise<T> | T => {
    if (isDeveloperMode) {
      console.log(`[v0] DEV MODE: Intercepting ${operationName || "database operation"}`)
      if (mockResult !== undefined) {
        return Promise.resolve(mockResult)
      }
      // Return empty result for operations without specific mock
      return Promise.resolve({} as T)
    }
    return operation()
  }

  return {
    isDeveloperMode,
    mockData,
    setMockData,
    interceptedOperation,
  }
}
