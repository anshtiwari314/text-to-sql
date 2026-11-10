import {
  DATABASE_LIST_AND,
  DATABASE_NAMES,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
  siteUrl,
} from "@/lib/site";
import type { Metadata } from "next";

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE} for ${DATABASE_LIST_AND}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [...SITE_KEYWORDS],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "technology",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  alternates: { canonical: "/" },
  formatDetection: { telephone: false, email: false, address: false },
  appleWebApp: {
    title: SITE_NAME,
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export function JsonLd() {
  const url = siteUrl();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        url,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Text-to-SQL",
        operatingSystem: "Web",
        description: SITE_DESCRIPTION,
        featureList: [
          "Natural language to SQL",
          "Schema-aware query generation",
          ...DATABASE_NAMES.map((name) => `${name} support`),
        ],
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url,
        description: SITE_DESCRIPTION,
        inLanguage: "en",
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `Which databases does ${SITE_NAME} support?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${SITE_NAME} is a text-to-SQL AI for ${DATABASE_LIST_AND}.`,
            },
          },
          {
            "@type": "Question",
            name: `What is ${SITE_NAME}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${SITE_NAME} turns English questions into SQL, runs the query on your connected database, and shows the results.`,
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
