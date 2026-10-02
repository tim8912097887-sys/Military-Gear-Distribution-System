type PageHeaderProps = {
  title: string;
  subtitle: string;
};

const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  return (
    <div className="mb-6">
      <p className="text-sm font-medium text-slate-400">Reservists</p>

      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
        {title}
      </h1>

      <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
    </div>
  );
};

export default PageHeader;
