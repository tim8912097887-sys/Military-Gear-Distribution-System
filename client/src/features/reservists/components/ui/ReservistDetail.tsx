import type { ReservistView } from "../types";

type ReservistDetailProps = {
  onCheckIn: () => void;
  isCheckingIn: boolean;
  reservist: ReservistView;
};

const ReservistDetail = ({
  reservist,
  onCheckIn,
  isCheckingIn,
}: ReservistDetailProps) => {
  const isCheckedIn = Boolean(reservist.checkedInAt);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-800 shadow-xl">
        {/* Header */}
        <div className="border-b border-slate-700/80 px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
                  {reservist.name}
                </h1>

                <span className="rounded-md bg-slate-700 px-2.5 py-1 text-sm font-medium text-slate-300">
                  {reservist.militaryRank}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-400">
                Reservist information
              </p>
            </div>

            {/* Check-in status */}
            <span
              className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-sm font-medium ${
                isCheckedIn
                  ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20"
              }`}
            >
              <span
                className={`mr-2 h-2 w-2 rounded-full ${
                  isCheckedIn ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              {isCheckedIn ? "Checked in" : "Not checked in"}
            </span>
          </div>
        </div>

        {/* Information */}
        <div className="px-6 py-6 sm:px-8">
          <div className="divide-y divide-slate-700/70 rounded-xl border border-slate-700/70">
            <div className="grid gap-1 px-4 py-4 sm:grid-cols-3 sm:px-5">
              <dt className="text-sm font-medium text-slate-400">
                National ID
              </dt>
              <dd className="text-sm font-medium text-slate-100 sm:col-span-2">
                {reservist.nationalId}
              </dd>
            </div>

            <div className="grid gap-1 px-4 py-4 sm:grid-cols-3 sm:px-5">
              <dt className="text-sm font-medium text-slate-400">
                Military rank
              </dt>
              <dd className="text-sm font-medium text-slate-100 sm:col-span-2">
                {reservist.militaryRank}
              </dd>
            </div>

            <div className="grid gap-1 px-4 py-4 sm:grid-cols-3 sm:px-5">
              <dt className="text-sm font-medium text-slate-400">
                Check-in time
              </dt>
              <dd className="text-sm font-medium text-slate-100 sm:col-span-2">
                {reservist.checkedInAt
                  ? new Date(reservist.checkedInAt).toLocaleString()
                  : "Not checked in"}
              </dd>
            </div>

            <div className="grid gap-1 px-4 py-4 sm:grid-cols-3 sm:px-5">
              <dt className="text-sm font-medium text-slate-400">Created at</dt>
              <dd className="text-sm font-medium text-slate-100 sm:col-span-2">
                {new Date(reservist.createdAt).toLocaleString()}
              </dd>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 border-t border-slate-700/80 bg-slate-800/60 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          {isCheckedIn ? (
            <button
              type="button"
              disabled
              className="
                inline-flex items-center justify-center
                rounded-lg
                bg-slate-700
                px-5 py-2.5
                text-sm font-semibold
                text-slate-400
                cursor-not-allowed
              "
            >
              Already checked in
            </button>
          ) : (
            <button
              type="button"
              onClick={onCheckIn}
              disabled={isCheckingIn}
              className="
                inline-flex items-center justify-center
                gap-2
                rounded-lg
                bg-emerald-600
                px-5 py-2.5
                text-sm font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-emerald-500
                focus:outline-none
                focus:ring-2
                focus:ring-emerald-500/50
                active:bg-emerald-700
              "
            >
              {isCheckingIn ? (
                <>
                  <span
                    aria-hidden="true"
                    className="
                      h-4 w-4
                      animate-spin
                      rounded-full
                      border-2
                      border-white/30
                      border-t-white
                    "
                  />
                  Checking in...
                </>
              ) : (
                "Check in reservist"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservistDetail;
