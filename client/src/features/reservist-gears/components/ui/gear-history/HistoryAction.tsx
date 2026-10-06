type HistoryActionProps = {
  action: "ISSUE" | "RETURN";
};

const HistoryAction = ({ action }: HistoryActionProps) => {
  const isIssue = action === "ISSUE";

  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        isIssue ? "bg-slate-800 text-slate-200" : "bg-slate-800 text-slate-400",
      ].join(" ")}
    >
      {isIssue ? "Issued" : "Returned"}
    </span>
  );
};

export default HistoryAction;
