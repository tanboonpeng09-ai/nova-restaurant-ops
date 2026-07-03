import { signInAction } from "@/actions/admin-actions";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
      <form action={signInAction} className="mesh-panel w-full rounded-card p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-ember">Admin login</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white light:text-black">Owner access</h1>
        <p className="mt-3 leading-7 text-white/56 light:text-black/56">
          Sign in with the Supabase admin user connected to `admin_users`.
        </p>
        {error && (
          <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/[0.08] p-3 text-sm text-rose-100 light:text-rose-700">
            {error}
          </p>
        )}
        <label className="mt-6 block text-sm font-semibold text-white/70 light:text-black/70">
          Email
          <input
            name="email"
            type="email"
            required
            className="input-surface mt-2 w-full rounded-button px-4 py-3 text-white outline-none light:text-black"
          />
        </label>
        <label className="mt-4 block text-sm font-semibold text-white/70 light:text-black/70">
          Password
          <input
            name="password"
            type="password"
            required
            className="input-surface mt-2 w-full rounded-button px-4 py-3 text-white outline-none light:text-black"
          />
        </label>
        <button
          type="submit"
          className="pressable mt-6 w-full rounded-button bg-ember px-5 py-4 font-semibold text-white shadow-[0_16px_40px_rgba(255,107,44,0.24)]"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
