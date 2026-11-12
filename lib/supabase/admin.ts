import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const hasServiceRole = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Server-only client that bypasses row level security.
 * Used for the two things only an administrator can do: create an account,
 * and delete one. Never import this into a client component.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
