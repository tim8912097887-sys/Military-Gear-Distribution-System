const ReservistDetailSkeleton = () => {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-800 shadow-xl">
        {/* Header */}
        <div className="border-b border-slate-700/80 px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              {/* Name */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-40 animate-pulse rounded-md bg-slate-700 sm:h-10 sm:w-48" />

                {/* Rank */}
                <div className="h-7 w-20 animate-pulse rounded-md bg-slate-700" />
              </div>

              {/* Description */}
              <div className="h-4 w-36 animate-pulse rounded bg-slate-700" />
            </div>

            {/* Status */}
            <div className="h-8 w-28 animate-pulse rounded-full bg-slate-700" />
          </div>
        </div>

        {/* Information */}
        <div className="px-6 py-6 sm:px-8">
          <div className="divide-y divide-slate-700/70 rounded-xl border border-slate-700/70">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="grid gap-2 px-4 py-4 sm:grid-cols-3 sm:px-5"
              >
                <div className="h-4 w-24 animate-pulse rounded bg-slate-700" />

                <div className="h-4 w-40 animate-pulse rounded bg-slate-700 sm:col-span-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 border-t border-slate-700/80 bg-slate-800/60 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <div className="h-10 w-full animate-pulse rounded-lg bg-slate-700 sm:w-40" />
        </div>
      </div>
    </div>
  );
};

export default ReservistDetailSkeleton;
