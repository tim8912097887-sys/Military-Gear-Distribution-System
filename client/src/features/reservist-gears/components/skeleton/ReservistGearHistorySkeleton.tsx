import HistoryCardSkeleton from "./HistoryCardSkeleton";
import Skeleton from "./Skeleton";

export const ReservistGearHistorySkeleton = () => {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <Skeleton className="mb-4 h-5 w-28" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/20">
        <div className="hidden md:block">
          <div className="border-b border-slate-800 bg-slate-950/40 px-6 py-4">
            <div className="grid grid-cols-6 gap-6">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="ml-auto h-3 w-12" />
            </div>
          </div>

          <div className="divide-y divide-slate-800">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="grid grid-cols-6 gap-6 px-6 py-5">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-10" />
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="ml-auto h-5 w-32" />
              </div>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-800 md:hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <HistoryCardSkeleton key={index} />
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-4 sm:px-6">
          <Skeleton className="h-4 w-20" />

          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-16" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default ReservistGearHistorySkeleton;
