import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente con la service role key — solo para código server-only que
// necesita saltarse RLS (el cron de recordatorios, que recorre TODOS los
// usuarios). Nunca importar esto desde código que corre en el cliente.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
