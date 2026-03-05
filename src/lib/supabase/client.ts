import { createBrowserClient } from "@supabase/ssr";

let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === "your_supabase_project_url") {
    // Return a dummy client during build/SSR prerender
    // It will never be used at runtime without proper config
    if (typeof window === "undefined") {
      return null as unknown as ReturnType<typeof createBrowserClient>;
    }
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }

  cachedClient = createBrowserClient(url, key);
  return cachedClient;
}
