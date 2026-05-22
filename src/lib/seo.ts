export const siteUrl = "https://www.exploreasiatravels.com";
export const siteName = "Explore Asia Travels";
export const legalName = "Explore Asia Travels Pvt Ltd";
export const primaryPhone = "+94775011272";
export const primaryEmail = "sales@exploreasiatravels.com";
export const secondaryEmail = "roshan@exploreasiatravels.com";
export const businessAddress =
  "No 8, Pagiriwaththa Road, Nugegoda, Colombo, Sri Lanka";

export type JsonLd = Record<string, unknown>;

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export type ItemListEntry = {
  name: string;
  path: string;
  description?: string;
  image?: string;
};

export const normalizePath = (path = "/") => {
  if (!path) return "/";

  const [pathname, search = ""] = path.split("?");
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const cleanPathname =
    normalizedPathname.length > 1
      ? normalizedPathname.replace(/\/+$/, "")
      : normalizedPathname;
  const hasFileExtension = /\.[a-z0-9]+$/i.test(cleanPathname);
  const finalPathname =
    cleanPathname === "/" || hasFileExtension ? cleanPathname : `${cleanPathname}/`;

  return search ? `${finalPathname}?${search}` : finalPathname;
};

export const absoluteUrl = (path = "/") => {
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(normalizePath(path), siteUrl).toString();
};

export const cleanJsonLd = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value
      .map((item) => cleanJsonLd(item))
      .filter((item) => item !== undefined && item !== null);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .map(([key, item]) => [key, cleanJsonLd(item)])
        .filter(([, item]) => item !== undefined && item !== null),
    );
  }

  return value;
};

export const organizationJsonLd = (): JsonLd => ({
  "@context": "https://schema.org",
  "@type": ["TravelAgency", "LocalBusiness"],
  "@id": `${siteUrl}/#organization`,
  name: siteName,
  legalName,
  url: siteUrl,
  logo: absoluteUrl("/favicon.png"),
  image: absoluteUrl("/favicon.png"),
  telephone: primaryPhone,
  email: primaryEmail,
  address: {
    "@type": "PostalAddress",
    streetAddress: "No 8, Pagiriwaththa Road",
    addressLocality: "Nugegoda",
    addressRegion: "Colombo",
    addressCountry: "LK",
  },
  areaServed: [
    { "@type": "Country", name: "Sri Lanka" },
    { "@type": "Country", name: "Maldives" },
    { "@type": "Country", name: "India" },
  ],
  sameAs: [],
});

export const websiteJsonLd = (): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  name: siteName,
  url: siteUrl,
  publisher: {
    "@id": `${siteUrl}/#organization`,
  },
});

export const breadcrumbJsonLd = (items: BreadcrumbItem[]): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export const itemListJsonLd = (items: ItemListEntry[]): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: absoluteUrl(item.path),
    item: {
      "@type": "WebPage",
      name: item.name,
      description: item.description,
      image: item.image ? absoluteUrl(item.image) : undefined,
      url: absoluteUrl(item.path),
    },
  })),
});

export const faqJsonLd = (
  faqs: { question: string; answer: string }[],
): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
});

export const serviceJsonLd = ({
  name,
  description,
  path,
  image,
  serviceType,
}: {
  name: string;
  description: string;
  path: string;
  image?: string;
  serviceType?: string;
}): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${absoluteUrl(path)}#service`,
  name,
  description,
  serviceType,
  provider: {
    "@id": `${siteUrl}/#organization`,
  },
  areaServed: ["Sri Lanka", "Maldives", "India"],
  image: image ? absoluteUrl(image) : undefined,
  url: absoluteUrl(path),
});

export const webpageJsonLd = ({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${absoluteUrl(path)}#webpage`,
  name: title,
  description,
  url: absoluteUrl(path),
  image: image ? absoluteUrl(image) : undefined,
  isPartOf: {
    "@id": `${siteUrl}/#website`,
  },
  publisher: {
    "@id": `${siteUrl}/#organization`,
  },
});
