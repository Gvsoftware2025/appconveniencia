"use client"

export function useGlobalPrintMonitor() {
  return {
    isMonitoring: false,
    pendingPrint: null,
    clearPendingPrint: () => {},
    handlePrintReceipt: () => {},
    getPrintedComandas: () => new Set(),
    savePrintedComanda: () => {},
    showAutoPrintNotification: false,
    autoPrintMessage: "",
  }
}
