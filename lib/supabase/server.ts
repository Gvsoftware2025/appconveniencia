import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = "https://xplrohlotlvebsyivdyv.supabase.co"
  const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbHJvaGxvdGx2ZWJzeWl2ZHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTE4NDAsImV4cCI6MjA3MTg4Nzg0MH0.5E9o1JLWHz_sGFzdsP8Tb3oY4FF8IyusMc-UiXwPOBc"

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
