"use client"

import { useState, useEffect } from "react"

interface PrintStatus {
  [comandaId: string]: boolean
}

export function usePrintStatus() {
  const [printedComandas, setPrintedComandas] = useState<PrintStatus>({})

  const STORAGE_KEY = "printed_comandas"

  // Carregar status de impressão do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          // Convert array to object format
          const statusObj: PrintStatus = {}
          parsed.forEach((id: string) => {
            statusObj[id] = true
          })
          setPrintedComandas(statusObj)
        } else {
          setPrintedComandas(parsed)
        }
      } catch (error) {
        console.error("Erro ao carregar status de impressão:", error)
      }
    }
  }, [])

  useEffect(() => {
    const printedIds = Object.keys(printedComandas).filter((id) => printedComandas[id])
    localStorage.setItem(STORAGE_KEY, JSON.stringify(printedIds))
  }, [printedComandas])

  const markAsPrinted = (comandaId: string) => {
    console.log("[v0] Marking comanda as printed:", comandaId)
    setPrintedComandas((prev) => ({
      ...prev,
      [comandaId]: true,
    }))
  }

  const isPrinted = (comandaId: string) => {
    return printedComandas[comandaId] || false
  }

  const getUnprintedCount = (comandaIds: string[]) => {
    return comandaIds.filter((id) => !isPrinted(id)).length
  }

  return {
    markAsPrinted,
    isPrinted,
    getUnprintedCount,
  }
}
