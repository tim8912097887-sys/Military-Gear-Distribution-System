import Button from "../../../../components/ui/common/Button";

type ReservistListInitialErrorProps = {
  onRetry: () => void;
};

const ReservistListInitialError = ({
  onRetry,
}: ReservistListInitialErrorProps) => {
  return (
    <div
      className="
                  rounded-xl
                  border border-red-900/50
                  bg-red-950/30
                  px-5 py-8
                  text-center
                "
    >
      <div
        className="
                    mx-auto mb-3 flex h-10 w-10
                    items-center justify-center
                    rounded-full
                    bg-red-900/40
                    text-red-400
                  "
      >
        !
      </div>

      <h3 className="text-sm font-semibold text-slate-100">
        Unable to load reservists
      </h3>

      <p className="mx-auto mt-1 max-w-md text-sm mb-3 text-slate-400">
        We couldn't load the reservist records. Please check your connection and
        try again.
      </p>

      <Button variant="primary" size="sm" onClick={() => onRetry()}>
        Try again
      </Button>
    </div>
  );
};

export default ReservistListInitialError;
