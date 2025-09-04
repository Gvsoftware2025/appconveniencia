"use client"

import AdminProdutos from "@/components/admin-produtos"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const router = useRouter()

  return <AdminProdutos onBack={() => router.push("/")} />
}
