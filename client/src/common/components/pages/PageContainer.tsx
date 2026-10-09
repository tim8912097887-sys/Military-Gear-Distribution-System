import Head from "../seo/Head";

type PageContainerProps = {
  children: React.ReactNode;
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
};

const PageContainer = ({
  children,
  title,
  description,
  path = "/",
  noIndex = false,
}: PageContainerProps) => {
  return (
    <>
      <Head
        title={title}
        description={description}
        path={path}
        noIndex={noIndex}
      />
      <main className="min-h-screen overflow-x-hidden bg-slate-950">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </div>
      </main>
    </>
  );
};

export default PageContainer;
