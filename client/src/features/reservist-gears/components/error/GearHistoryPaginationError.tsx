import Button from "../../../../common/components/ui/common/Button";

type GearHistoryPaginationErrorProps = {
  onRetry: () => void;
};

export const GearHistoryPaginationError = ({
  onRetry,
}: GearHistoryPaginationErrorProps) => {
  return (
    <div className="border-b border-slate-800 bg-slate-950/40 px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-400">
          Failed to load this page of history.
        </p>

        <Button
          type="button"
          variant="unstyled"
          onClick={onRetry}
          className="shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100"
        >
          Retry
        </Button>
      </div>
    </div>
  );
};

export default GearHistoryPaginationError;
