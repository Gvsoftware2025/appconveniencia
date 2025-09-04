import type React from "react"
import "./globals.css"
import { PedidosProvider } from "@/contexts/pedidos-context"
import { ToastProvider } from "@/components/toast-notification"

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

export const metadata = {
      generator: 'v0.app'
    };
