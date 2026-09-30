import Skeleton from "./Skeleton";

const GearAllowanceSectionSkeleton = () => {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 px-5 py-4">
        <Skeleton className="h-5 w-28" />
      </div>

      <div className="grid gap-px bg-slate-800 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-slate-900 p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-6 w-16" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default GearAllowanceSectionSkeleton;
