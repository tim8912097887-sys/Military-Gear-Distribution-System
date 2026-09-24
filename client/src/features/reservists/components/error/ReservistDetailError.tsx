import { Link } from "react-router";
import Button from "../../../../components/ui/common/Button";
import { ApiError } from "../../api/error/api-error";

type ReservistDetailErrorProps = {
  error?: unknown;
  onRetry: () => void;
};

const ReservistDetailError = ({
  error,
  onRetry,
}: ReservistDetailErrorProps) => {
  const isNotFound = error instanceof ApiError && error.status === 404;

  const title = isNotFound ? "Reservist not found" : "Unable to load reservist";

  const message = isNotFound
    ? "The reservist may have been removed or the link may be invalid."
    : "We couldn't load this reservist. Please try again.";

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-800 shadow-xl">
        <div className="flex flex-col items-center px-6 py-16 text-center sm:px-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-inset ring-red-500/20">
            <span className="text-xl text-red-400">!</span>
          </div>

          <h1 className="text-xl font-semibold text-slate-100">{title}</h1>

          <p className="mt-2 max-w-md text-sm leading-6 mb-3 text-slate-400">
            {message}
          </p>
          {isNotFound ? (
            <Button variant="primary" size="sm">
              <Link to="/reservists">Back to reservists</Link>
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => onRetry()}>
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservistDetailError;
