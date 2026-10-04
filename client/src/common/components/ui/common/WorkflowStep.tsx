type WorkflowStepProps = {
  number: string;
  title: string;
  description: string;
};

const WorkflowStep = ({ number, title, description }: WorkflowStepProps) => {
  return (
    <div className="flex gap-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-xs font-semibold text-slate-400">
        {number}
      </div>

      <div>
        <h4 className="font-medium text-slate-100">{title}</h4>
        <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
      </div>
    </div>
  );
};

export default WorkflowStep;
