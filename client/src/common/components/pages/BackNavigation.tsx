import { Link } from "react-router";

type BackNavigationProps = {
  to: string;
};

const BackNavigation = ({ to }: BackNavigationProps) => {
  return (
    <div className="mb-8">
      <Link
        to={to}
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
  );
};

export default BackNavigation;
