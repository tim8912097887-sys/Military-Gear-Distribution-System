import Skeleton from "./Skeleton";

const ReservistGearPageHeaderSkeleton = () => {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-36" />

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </div>
  );
};

export default ReservistGearPageHeaderSkeleton;
