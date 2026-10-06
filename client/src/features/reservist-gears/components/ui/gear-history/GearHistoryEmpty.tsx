const GearHistoryEmpty = () => {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-800 bg-slate-950 text-slate-600">
        ↔
      </div>

      <h2 className="mt-4 text-sm font-medium text-slate-200">
        No gear history
      </h2>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Gear issue and return activity will appear here.
      </p>
    </div>
  );
};

export default GearHistoryEmpty;
