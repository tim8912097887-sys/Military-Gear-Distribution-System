export function ReservistCardSkeleton() {
  return (
    <div
      className="
        animate-pulse rounded-xl
        border border-white/10
        bg-white/2
        p-4
      "
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="h-5 w-32 rounded bg-white/10" />
            <div className="h-5 w-16 rounded-md bg-white/10" />
          </div>

          <div className="mt-2 h-4 w-28 rounded bg-white/10" />
        </div>

        <div className="h-5 w-5 rounded bg-white/10" />
      </div>

      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="h-4 w-24 rounded bg-white/10" />
      </div>
    </div>
  );
}
