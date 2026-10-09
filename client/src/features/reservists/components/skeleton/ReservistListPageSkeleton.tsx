import PageContainer from "../../../../common/components/pages/PageContainer";
import { ReservistCardSkeleton } from "./ReservistCardSkeleton";

const ReservistListPageSkeleton = () => {
  return (
    <PageContainer>
      <header className="mb-6" aria-hidden="true">
        <div className="h-4 w-28 animate-pulse rounded bg-slate-800" />
        <div className="mt-2 h-10 w-52 animate-pulse rounded bg-slate-800" />
        <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-slate-800" />
      </header>

      <section
        aria-label="Loading reservist records"
        aria-busy="true"
        className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/20"
      >
        <div className="border-b border-slate-800 bg-slate-900 p-4 sm:p-5">
          <div className="h-11 w-full max-w-xl animate-pulse rounded-xl bg-slate-800" />
        </div>

        <div className="flex items-center justify-between px-4 py-3 sm:px-5">
          <div className="space-y-2" aria-hidden="true">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
            <div className="h-3 w-16 animate-pulse rounded bg-slate-800" />
          </div>
          <div className="h-3 w-36 animate-pulse rounded bg-slate-800" aria-hidden="true" />
        </div>

        <div className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <ReservistCardSkeleton key={index} />
          ))}
        </div>
      </section>
    </PageContainer>
  );
};

export default ReservistListPageSkeleton;
