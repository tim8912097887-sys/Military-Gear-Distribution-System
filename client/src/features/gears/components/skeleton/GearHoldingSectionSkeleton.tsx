import Skeleton from "./Skeleton";

const GearHoldingSectionSkeleton = () => {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 px-5 py-4">
        <Skeleton className="h-5 w-32" />
      </div>

      <div className="divide-y divide-slate-800">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-5 py-4"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>

            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </section>
  );
};
export default GearHoldingSectionSkeleton;
