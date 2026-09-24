import { Link, useParams } from "react-router";
import ReservistDetail from "../components/ui/detail/ReservistDetail";
import ReservistDetailSkeleton from "../components/skeleton/ReservistDetailSkeleton";
import ReservistDetailError from "../components/error/ReservistDetailError";
import useGetReservist from "../hooks/useGetReservist";
import { useCheckInReservist } from "../hooks/useCheckInReservist";
import { reservistIdSchema } from "../schema/reservist-id";
import ReservistDetailIdError from "../components/error/ReservistDetailIdError";

const ReservistDetailPage = () => {
  const { id } = useParams();
  const result = reservistIdSchema.safeParse(id);

  const { isPending, error, data, refetch } = useGetReservist(id as string);

  const { isPending: isCheckingIn, mutate } = useCheckInReservist(id as string);

  const content = (() => {
    if (!result.success) {
      return <ReservistDetailIdError />;
    }
    if (isPending) {
      return <ReservistDetailSkeleton />;
    }

    if (!data || error) {
      return <ReservistDetailError error={error} onRetry={() => refetch()} />;
    }

    return (
      <ReservistDetail
        reservist={data}
        onCheckIn={mutate}
        isCheckingIn={isCheckingIn}
      />
    );
  })();

  return (
    <main className="min-h-dvh bg-slate-950">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back navigation */}
        <div className="mb-8">
          <Link
            to="/reservists"
            className="
              inline-flex items-center gap-2
              text-sm font-medium
              text-slate-400
              transition
              hover:text-slate-100
              focus:outline-none
              focus:ring-2
              focus:ring-slate-500/50
              rounded-md
            "
          >
            <span aria-hidden="true">←</span>
            Back to reservists
          </Link>
        </div>

        {/* Page heading */}
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-400">Reservists</p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
            Reservist details
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            View reservist information and check-in status.
          </p>
        </div>

        {/* Content */}
        <section aria-live="polite">{content}</section>
      </div>
    </main>
  );
};

export default ReservistDetailPage;
