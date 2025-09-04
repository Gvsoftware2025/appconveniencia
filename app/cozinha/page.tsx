"use client"

import CozinhaInterface from "@/components/cozinha-interface"
import { useRouter } from "next/navigation"

export default function CozinhaPage() {
  const router = useRouter()

  return <CozinhaInterface onBack={() => router.push("/")} />
}
