type InfoRowProps = {
  label: string;
  children: React.ReactNode;
};

function InfoRow({ label, children }: InfoRowProps) {
  return (
    <div className="grid gap-1 px-4 py-4 sm:grid-cols-3 sm:px-5">
      <dt className="text-sm font-medium text-slate-400">{label}</dt>

      <dd className="text-sm font-medium text-slate-100 sm:col-span-2">
        {children}
      </dd>
    </div>
  );
}

export default InfoRow;
