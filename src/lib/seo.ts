import type { Metadata } from "next";
import { availablePlatforms, releasesUrl } from "@/content/download";
import type { FaqItem } from "@/content/faq";
import { absoluteUrl, site } from "@/lib/site";

type PageSeo = {
  /** Page-specific title; the root layout's template appends the site name. */
  title: string;
  description: string;
  /** Route path starting with "/", used for the canonical URL. */
  path: string;
};

/**
 * Metadata for one route: canonical URL plus matching Open Graph and Twitter
 * fields. The social image itself is inherited from the root
 * opengraph-image route, so it is not repeated here.
 */
export function pageMetadata({ title, description, path }: PageSeo): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: site.name },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * Serialises structured data for a <script type="application/ld+json"> tag.
 * "<" is escaped so no string in the data can close the script element early
 * and inject markup.
 */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: site.name,
    description: site.description,
    url: site.url,
    applicationCategory: "SecurityApplication",
    // Only platforms with a published installer, so search engines are never
    // told about a build nobody can download.
    operatingSystem: availablePlatforms().map((p) => p.name).join(", "),
    softwareVersion: site.version,
    license: `https://opensource.org/licenses/${site.license}`,
    downloadUrl: releasesUrl,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
  };
}

export function faqJsonLd(items: readonly FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

export function breadcrumbJsonLd(trail: readonly { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map(({ name, path }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: absoluteUrl(path),
    })),
  };
}
