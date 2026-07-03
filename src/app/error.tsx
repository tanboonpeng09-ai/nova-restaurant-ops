"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center px-4 py-16 text-center">
      <div className="mesh-panel rounded-card p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-ember">Something broke</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white light:text-black">The station needs a reset</h1>
        <p className="mt-4 leading-7 text-white/56 light:text-black/56">
          This error boundary keeps the demo controlled instead of showing a raw crash.
        </p>
        <button
          type="button"
          onClick={reset}
          className="pressable mt-6 rounded-button bg-ember px-5 py-3 font-semibold text-white"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
