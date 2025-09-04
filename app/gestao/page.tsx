"use client"

import GestaoInterface from "@/components/gestao-pedidos"
import { useRouter } from "next/navigation"

export default function GestaoPage() {
  const router = useRouter()

  return <GestaoInterface onBack={() => router.push("/")} />
}
