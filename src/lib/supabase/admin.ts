import { createClient } from "@supabase/supabase-js";
import { requireServiceRoleEnv } from "@/lib/env";

export function createAdminClient() {
  const { url, serviceRoleKey } = requireServiceRoleEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
