import { Helmet } from "react-helmet-async";

type HeadProps = {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
};

const SITE_URL = import.meta.env.VITE_SITE_URL.replace(/\/+$/, "");

const Head = ({
  title,
  description,
  path = "/",
  noIndex = false,
}: HeadProps) => {
  const canonicalUrl = new URL(path, `${SITE_URL}/`).href;
  const displayTitle = title
    ? `${title} | Reservist Gear Distribution`
    : "Reservist Gear Distribution";

  return (
    <Helmet>
      <title>{displayTitle}</title>

      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      <meta
        name="robots"
        content={noIndex ? "noindex, nofollow" : "index, follow"}
      />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Reservist Gear Distribution" />
      <meta
        property="og:title"
        content={`${title} | Reservist Gear Distribution`}
      />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta
        property="og:image"
        content="https://i.ytimg.com/vi/9WUKr7eXnO0/maxresdefault.jpg"
      />
      <meta
        property="og:image:alt"
        content="Reservist Gear Distribution System"
      />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content={`${title} | Reservist Gear Distribution`}
      />
      <meta name="twitter:description" content={description} />
      <meta
        name="twitter:image"
        content="https://i.ytimg.com/vi/9WUKr7eXnO0/maxresdefault.jpg"
      />
    </Helmet>
  );
};

export default Head;
