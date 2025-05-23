import { Database } from "@/supabase/types"
import { createBrowserClient } from "@supabase/ssr"

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      redirectTo: process.env.SUPABASE_REDIRECT_TO || "https://maxgptfrontend-knfodtb0y-matthew-houses-projects.vercel.app"
    }
  }
)
