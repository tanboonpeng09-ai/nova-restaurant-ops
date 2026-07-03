import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { isServiceRoleConfigured, isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loadRestaurantSnapshot } from "@/services/snapshot-loader";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) redirect("/admin/login?error=No%20active%20admin%20session.%20Please%20sign%20in%20again.");

    const adminCheckClient = isServiceRoleConfigured() ? createAdminClient() : supabase;
    const { data } = await adminCheckClient
      .from("admin_users")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) redirect("/admin/login?error=This%20user%20is%20not%20linked%20to%20admin_users.");
  }

  const snapshot = await loadRestaurantSnapshot();

  return <AdminDashboard initialSnapshot={snapshot} />;
}
