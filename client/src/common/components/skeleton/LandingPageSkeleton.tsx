const LandingPageSkeleton = () => {
  return (
    <main
      aria-label="Loading home page"
      aria-busy="true"
      className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100"
    >
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between" aria-hidden="true">
          <div className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-800" />
            <div className="h-6 w-40 animate-pulse rounded bg-slate-800" />
          </div>
        </header>

        <section className="flex flex-1 items-center py-16">
          <div className="grid w-full gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div aria-hidden="true">
              <div className="mb-4 h-4 w-48 animate-pulse rounded bg-slate-800" />
              <div className="max-w-3xl space-y-3">
                <div className="h-10 w-full animate-pulse rounded bg-slate-800 sm:h-12" />
                <div className="h-10 w-5/6 animate-pulse rounded bg-slate-800 sm:h-12" />
              </div>
              <div className="mt-6 max-w-2xl space-y-2">
                <div className="h-5 w-full animate-pulse rounded bg-slate-800" />
                <div className="h-5 w-11/12 animate-pulse rounded bg-slate-800" />
                <div className="h-5 w-2/3 animate-pulse rounded bg-slate-800" />
              </div>
              <div className="mt-8 h-12 w-52 animate-pulse rounded-xl bg-slate-800" />
            </div>

            <div
              aria-hidden="true"
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-black/20"
            >
              <div className="mb-6 space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-slate-800" />
                <div className="h-7 w-56 animate-pulse rounded bg-slate-800" />
              </div>
              <div className="space-y-5">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-800" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
                      <div className="h-4 w-full animate-pulse rounded bg-slate-800" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-800 py-6" aria-hidden="true">
          <div className="h-4 w-64 animate-pulse rounded bg-slate-800" />
        </footer>
      </div>
    </main>
  );
};

export default LandingPageSkeleton;
