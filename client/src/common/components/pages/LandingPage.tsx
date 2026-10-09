import { Link } from "react-router";
import WorkflowStep from "../ui/common/WorkflowStep";
import Head from "../seo/Head";

const LandingPage = () => {
  return (
    <>
      <Head
        title="Military Gear Distribution System"
        description="A digital gear distribution system for Taiwan reservist education recall, supporting reservist check-in, gear issuance, returns, and inventory tracking."
      />
      <main className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">
                Education Recall
              </p>
              <h1 className="text-lg font-semibold tracking-tight">
                Gear Distribution
              </h1>
            </div>
          </header>

          <section className="flex flex-1 items-center py-16">
            <div className="grid w-full gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <p className="mb-4 text-sm font-medium text-slate-400">
                  Reservist Management System
                </p>

                <h2 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  Manage reservist gear distribution with confidence.
                </h2>

                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
                  Check in reservists, issue equipment according to allowance,
                  and keep bulk and serialized gear holdings up to date.
                </p>

                <div className="mt-8">
                  <Link
                    to="/reservists"
                    className="inline-flex items-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-slate-950"
                  >
                    Go to Reservist List
                    <span aria-hidden="true" className="ml-2">
                      →
                    </span>
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-black/20">
                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-400">
                    Distribution Workflow
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-white">
                    From check-in to return
                  </h3>
                </div>

                <div className="space-y-5">
                  <WorkflowStep
                    number="01"
                    title="Find Reservist"
                    description="Search by name or national ID."
                  />

                  <WorkflowStep
                    number="02"
                    title="Check In"
                    description="Confirm the reservist's arrival."
                  />

                  <WorkflowStep
                    number="03"
                    title="Issue & Return"
                    description="Manage equipment and current holdings."
                  />
                </div>
              </div>
            </div>
          </section>

          <footer className="border-t border-slate-800 py-6 text-sm text-slate-500">
            Reservist Gear Distribution System
          </footer>
        </div>
      </main>
    </>
  );
};

export default LandingPage;
