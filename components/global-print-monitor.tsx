"use client"

import { useGlobalPrintMonitor } from "@/hooks/use-global-print-monitor"

export default function GlobalPrintMonitor() {
  const { isMonitoring } = useGlobalPrintMonitor()

  console.log("[v0] Global Print Monitor: Ativo e monitorando:", isMonitoring)

  return null
}
