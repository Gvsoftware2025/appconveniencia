"use client"

import GarcomInterface from "@/components/garcom-interface"
import { useRouter } from "next/navigation"

export default function GarcomPage() {
  const router = useRouter()

  return <GarcomInterface onBack={() => router.push("/")} />
}
