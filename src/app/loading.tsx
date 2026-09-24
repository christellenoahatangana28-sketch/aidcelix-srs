export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10" aria-hidden>
      <div className="h-9 w-44 animate-pulse rounded-lg bg-white/10" />
      <div className="mt-6 space-y-3">
        <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}
