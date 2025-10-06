import type React from "react"
import "./globals.css"
import { PedidosProvider } from "@/contexts/pedidos-context"
import { InterfaceProvider } from "@/contexts/interface-context"
import { ToastProvider } from "@/components/toast-notification"
import GlobalPrintMonitor from "@/components/global-print-monitor"

export const metadata = {
  title: "Sistema Conveniência - Gestão de Pedidos",
  description: "Sistema completo para gestão de pedidos, comandas e pagamentos",
  generator: "v0.app",
  manifest: "/manifest.json",
  themeColor: "#7c3aed",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Conv. Rives",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Conv. Rives" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.jpg" />
        <link rel="apple-touch-icon" href="/icon-192.jpg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('[PWA] Service Worker registered:', registration.scope);
                    },
                    function(err) {
                      console.log('[PWA] Service Worker registration failed:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ToastProvider>
          <PedidosProvider>
            <InterfaceProvider>
              <GlobalPrintMonitor />
              {children}
            </InterfaceProvider>
          </PedidosProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
