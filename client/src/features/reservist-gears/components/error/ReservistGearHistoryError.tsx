import { Link } from "react-router";
import { ApiError } from "../../../../common/error/api-error";
import Button from "../../../../common/components/ui/common/Button";

type Props = {
  error: unknown;
  onRetry: () => void;
  backRoute: string;
};

export const ReservistGearHistoryError = ({
  error,
  onRetry,
  backRoute,
}: Props) => {
  const retryAble =
    error instanceof ApiError &&
    !(error.status === 404 || error.status === 400);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to={backRoute}
          className="text-sm text-slate-400 transition hover:text-slate-200"
        >
          ← Back to gear
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 px-6 py-12 text-center shadow-xl shadow-black/20">
          <h1 className="text-lg font-semibold text-slate-100">
            Unable to load gear history
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Something went wrong while loading the history.
          </p>

          {!retryAble ? (
            <Link
              to="/reservists"
              className="
            inline-flex items-center justify-center gap-2
              rounded-lg
              font-semibold
              transition
              focus:outline-none
              focus:ring-2
              disabled:cursor-not-allowed
              disabled:opacity-50
              border border-slate-700
            bg-slate-800
            text-slate-100
            hover:bg-slate-700
            focus:ring-slate-500
            active:bg-slate-800
            px-4 py-2 text-sm

          "
            >
              Back to reservists
            </Link>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="mt-5"
              onClick={onRetry}
            >
              Try again
            </Button>
          )}
        </div>
      </div>
    </main>
  );
};

export default ReservistGearHistoryError;
