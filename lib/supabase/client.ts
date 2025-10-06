import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = "https://xplrohlotlvebsyivdyv.supabase.co"
  const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbHJvaGxvdGx2ZWJzeWl2ZHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTE4NDAsImV4cCI6MjA3MTg4Nzg0MH0.5E9o1JLWHz_sGFzdsP8Tb3oY4FF8IyusMc-UiXwPOBc"

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
