import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const isConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: any }[]) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component; the middleware refreshes the session.
          }
        }
      }
    }
  );
}

/** Returns the signed-in profile row, or null. */
export async function getCurrentProfile() {
  if (!isConfigured) return null;

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,avatar_path,chess_username,chess_platform,lichess_username,chesscom_username")
    .eq("id", user.id)
    .single();

  return data ?? null;
}
