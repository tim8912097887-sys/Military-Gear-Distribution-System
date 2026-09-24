import Button from "../../../../components/ui/common/Button";

type ReservistNextPageErrorProps = {
  onRetry: () => void;
};

const ReservistNextPageError = ({ onRetry }: ReservistNextPageErrorProps) => {
  return (
    <div
      className="
                      mt-4
                      rounded-xl
                      border border-red-900/50
                      bg-red-950/20
                      px-4 py-4
                    "
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-100">
            Couldn't load more reservists
          </p>

          <p className="mt-0.5 text-xs text-slate-400">
            Your existing records are still available.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => onRetry()}>
          Try again
        </Button>
      </div>
    </div>
  );
};

export default ReservistNextPageError;
