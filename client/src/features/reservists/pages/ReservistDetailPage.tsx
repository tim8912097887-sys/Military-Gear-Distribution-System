import { Link, useParams } from "react-router";
import ReservistDetail from "../components/ui/ReservistDetail";
import { useMutation, useQuery } from "@tanstack/react-query";
import { checkInReservist, getReservist } from "../api/query/query";
import ReservistDetailSkeleton from "../components/skeleton/ReservistDetailSkeleton";
import ReservistDetailError from "../components/error/ReservistDetailError";
import { ApiError } from "../api/error/api-error";
import { toast } from "react-toastify";
import { queryClient } from "../../../main";

const ReservistDetailPage = () => {
  const { id } = useParams();
  const reservistId = id as string;

  const { isPending, error, data } = useQuery({
    queryKey: ["reservistdetailpage", reservistId],
    queryFn: () => getReservist(reservistId),
    retry: (failureCount, error) => {
      // Stop retrying if it's a 404
      if (error instanceof ApiError && error.status === 404) {
        return false;
      }

      return failureCount < 3;
    },
  });

  const { isPending: isCheckingIn, mutate } = useMutation({
    mutationFn: async () => checkInReservist(reservistId),
    onSuccess: (updatedReservist) => {
      // Update the reservist in the cache
      queryClient.setQueryData(
        ["reservistdetailpage", reservistId],
        updatedReservist,
      );

      toast.success("Reservist checked in successfully", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
        theme: "dark",
      });
    },

    onError: (error) => {
      toast.error(error.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
        theme: "dark",
      });
    },
  });

  const content = (() => {
    if (isPending) {
      return <ReservistDetailSkeleton />;
    }

    if (error) {
      return <ReservistDetailError error={error} />;
    }

    if (!data) {
      return <ReservistDetailError />;
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
