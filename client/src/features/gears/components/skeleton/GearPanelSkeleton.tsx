import Skeleton from "./Skeleton";

const GearPanelSkeleton = () => {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 px-5 py-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-2 h-3 w-48" />
      </div>

      <div className="divide-y divide-slate-800">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-5 py-4"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>

            <Skeleton className="h-9 w-24" />
          </div>
        ))}
      </div>

      <div className="flex justify-end border-t border-slate-800 px-5 py-4">
        <Skeleton className="h-9 w-28" />
      </div>
    </section>
  );
};

export const IssueGearPanelSkeleton = GearPanelSkeleton;
export const ReturnGearPanelSkeleton = GearPanelSkeleton;
