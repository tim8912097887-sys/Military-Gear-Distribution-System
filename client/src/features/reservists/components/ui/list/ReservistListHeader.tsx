const ReservistListHeader = () => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Personnel
      </div>

      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
        Reservists
      </h1>

      <p className="mt-2 text-sm text-slate-400">
        Search and manage registered reservists.
      </p>
    </div>
  );
};

export default ReservistListHeader;
