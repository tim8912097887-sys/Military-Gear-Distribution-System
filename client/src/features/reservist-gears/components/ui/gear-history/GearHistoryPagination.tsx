import Button from "../../../../../common/components/ui/common/Button";

type Props = {
  currentPage: number;
  total: number;
  limit: number;
  hasPrevious: boolean;
  hasNext: boolean;
  isNavigating: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export const GearHistoryPagination = ({
  currentPage,
  total,
  limit,
  isNavigating,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: Props) => {
  if (total === 0) {
    return null;
  }

  const start = (currentPage - 1) * limit + 1;
  const end = Math.min(start + limit - 1, total);

  return (
    <div className="flex items-center justify-between border-t border-slate-800 px-4 py-4 sm:px-6">
      <p className="text-sm text-slate-500">
        {start}–{end} of {total}
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="unstyled"
          onClick={onPrevious}
          disabled={!hasPrevious || isNavigating}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </Button>

        <span className="px-2 text-sm text-slate-500">Page {currentPage}</span>

        <Button
          type="button"
          variant="unstyled"
          onClick={onNext}
          disabled={!hasNext || isNavigating}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default GearHistoryPagination;
