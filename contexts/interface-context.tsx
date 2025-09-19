"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface InterfaceContextType {
  activeInterface: string | null
  setActiveInterface: (interfaceId: string | null) => void
}

const InterfaceContext = createContext<InterfaceContextType | undefined>(undefined)

export function InterfaceProvider({ children }: { children: ReactNode }) {
  const [activeInterface, setActiveInterface] = useState<string | null>(null)

  return (
    <InterfaceContext.Provider value={{ activeInterface, setActiveInterface }}>{children}</InterfaceContext.Provider>
  )
}

export function useInterface() {
  const context = useContext(InterfaceContext)
  if (context === undefined) {
    throw new Error("useInterface must be used within an InterfaceProvider")
  }
  return context
}
