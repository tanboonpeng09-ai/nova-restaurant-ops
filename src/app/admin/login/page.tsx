import { LockKeyhole } from "lucide-react";
import { signInAction } from "@/actions/admin-actions";
import { AppShell } from "@/components/shared/app-shell";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AppShell
      navigationLinks={[
        { label: "View Menu", href: "/menu" },
        { label: "Kitchen", href: "/kitchen" }
      ]}
    >
    <div className="admin-login-page min-h-[calc(100vh-4rem)] px-4 py-12">
      <div className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-5xl items-center gap-8 lg:grid-cols-[1fr_440px]">
        <section className="hidden lg:block">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-white">
            Restaurant OS
          </span>
          <h1 className="mt-5 max-w-xl text-5xl font-black tracking-[-0.055em] text-slate-950">
            Owner cockpit for table service, kitchen flow, and live operations.
          </h1>
          <p className="mt-5 max-w-lg text-base font-medium leading-8 text-slate-500">
            Sign in to manage ordering state, menu availability, table tools, staff calls, and operational reporting.
          </p>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
            {["Orders", "Menu", "Tables"].map((label) => (
              <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_14px_42px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
                <div className="mt-4 h-2 rounded-full bg-emerald-400" />
              </div>
            ))}
          </div>
        </section>

        <form
          action={signInAction}
          className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8"
        >
          <div className="grid size-12 place-items-center rounded-[18px] bg-slate-950 text-white shadow-[0_16px_38px_rgba(15,23,42,0.16)]">
            <LockKeyhole size={22} />
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Admin login</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">Owner access</h2>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
            Sign in with the Supabase admin user connected to <code className="font-bold text-slate-700">admin_users</code>.
          </p>
          {error && (
            <p className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
              {error}
            </p>
          )}
          <label className="mt-6 block text-sm font-black text-slate-700">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-2 min-h-12 w-full rounded-button border border-slate-200 bg-slate-50 px-4 text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </label>
          <label className="mt-4 block text-sm font-black text-slate-700">
            Password
            <input
              name="password"
              type="password"
              required
              className="mt-2 min-h-12 w-full rounded-button border border-slate-200 bg-slate-50 px-4 text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </label>
          <button
            type="submit"
            className="pressable mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-button bg-emerald-500 px-5 py-3 font-black text-white shadow-[0_18px_44px_rgba(16,185,129,0.22)] hover:bg-emerald-600"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
    </AppShell>
  );
}
