import Skeleton from "./Skeleton";

const HistoryCardSkeleton = () => {
  return (
    <div className="p-4">
      <div className="flex justify-between">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-4 w-28" />
      </div>

      <Skeleton className="mt-4 h-5 w-32" />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="col-span-2 h-8 w-32" />
      </div>
    </div>
  );
};
export default HistoryCardSkeleton;
