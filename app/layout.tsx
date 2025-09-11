import type React from "react"
import "./globals.css"
import { PedidosProvider } from "@/contexts/pedidos-context"
import { ToastProvider } from "@/components/toast-notification"

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
          <PedidosProvider>{children}</PedidosProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
