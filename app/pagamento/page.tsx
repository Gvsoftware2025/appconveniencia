"use client"

import PagamentoInterface from "@/components/pagamento-interface"
import { useRouter } from "next/navigation"

export default function PagamentoPage() {
  const router = useRouter()

  return <PagamentoInterface onBack={() => router.push("/")} />
}
