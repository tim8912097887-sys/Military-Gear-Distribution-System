import { Link } from "react-router";

const ReservistGearPageInvalidId = () => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center shadow-xl shadow-black/20">
        <div
          aria-hidden="true"
          className="
            mx-auto flex h-10 w-10 items-center justify-center
            rounded-full bg-red-400/10
            text-sm font-bold text-red-400
          "
        >
          !
        </div>

        <h1 className="mt-4 text-lg font-semibold text-slate-100">
          Invalid reservist ID
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          The reservist ID in the URL is not valid.
        </p>

        <Link
          to="/reservists"
          className="
            mt-5 inline-flex items-center justify-center
            rounded-md border border-slate-700
            bg-slate-800 px-4 py-2
            text-sm font-medium text-slate-200
            transition
            hover:bg-slate-700 hover:text-slate-100
            focus:outline-none focus:ring-2 focus:ring-slate-500/50
          "
        >
          Back to reservist
        </Link>
      </div>
    </div>
  );
};

export default ReservistGearPageInvalidId;
