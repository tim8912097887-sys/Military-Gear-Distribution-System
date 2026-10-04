import type { HTMLAttributes } from "react";
import { cn } from "../../../../common/components/ui/utils/cn";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-slate-800", className)}
      {...props}
    />
  );
};

export default Skeleton;
