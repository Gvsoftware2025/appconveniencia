import type React from "react"
import "./globals.css"
import { PedidosProvider } from "@/contexts/pedidos-context"
import { ToastProvider } from "@/components/toast-notification"

export const metadata = {
  title: "Conveniência Rives",
  description: "Created by GV Software",
  generator: "gv_software",
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
