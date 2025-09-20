import type React from "react"
import "./globals.css"
import { PedidosProvider } from "@/contexts/pedidos-context"
import { InterfaceProvider } from "@/contexts/interface-context"
import { ToastProvider } from "@/components/toast-notification"
import GlobalPrintMonitor from "@/components/global-print-monitor"
import { DeveloperModeProvider } from "@/contexts/developer-mode-context"

export const metadata = {
  title: "Sistema Conveniência - Gestão de Pedidos",
  description: "Sistema completo para gestão de pedidos, comandas e pagamentos",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <ToastProvider>
          <DeveloperModeProvider>
            <PedidosProvider>
              <InterfaceProvider>
                <GlobalPrintMonitor />
                {children}
              </InterfaceProvider>
            </PedidosProvider>
          </DeveloperModeProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
