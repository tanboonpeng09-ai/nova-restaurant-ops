export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mesh-panel animate-pulse rounded-card p-8">
        <div className="h-4 w-36 rounded-full bg-white/[0.08] light:bg-black/[0.06]" />
        <div className="mt-4 h-9 w-64 rounded-full bg-white/[0.1] light:bg-black/[0.07]" />
        <div className="mt-6 h-48 rounded-card bg-white/[0.07] light:bg-black/[0.045]" />
      </div>
    </div>
  );
}
