/**
 * Site-wide facts. Everything the pages, metadata and structured data say
 * about the product comes from here, so a change (a new domain, a renamed
 * repository) is made once.
 */

import { logo } from "@/lib/logo";

/** Used when NEXT_PUBLIC_SITE_URL is unset, e.g. local development. */
const FALLBACK_SITE_URL = "http://localhost:3000";

/**
 * Normalises a configured site URL: requires http(s), drops any path, query
 * or trailing slash, so `${siteUrl}/security` is always well formed.
 *
 * @throws Error when the value is not an absolute http(s) URL. A bad value
 *   would otherwise ship broken canonical links and sitemap entries silently.
 */
export function normaliseSiteUrl(raw: string | undefined): string {
  const value = raw?.trim();
  if (!value) return FALLBACK_SITE_URL;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`NEXT_PUBLIC_SITE_URL is not a valid URL: "${value}"`);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must use http or https, got "${parsed.protocol}" in "${value}"`,
    );
  }
  return parsed.origin;
}

export const site = {
  name: "Klavyn",
  /** Under 60 characters so search results show it whole. */
  title: "Klavyn · Self-hosted, end-to-end encrypted passwords",
  /** Under 160 characters for the same reason. */
  description:
    "A password manager you run on your own server. Everything is encrypted on your device, so the server stores only ciphertext. Free and open source.",
  url: normaliseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  repoUrl: "https://github.com/cjaymoni/klavyn",  license: "MIT",
  version: "0.1.3",
  /** Brand evergreen, from the logo. */
  themeColor: logo.colors.evergreen,
  locale: "en_US",
  keywords: [
    "self-hosted password manager",
    "end-to-end encrypted password manager",
    "open source password manager",
    "password manager for teams",
    "password sharing",
    "Argon2id",
    "X25519",
    "Tauri password manager",
  ],
} as const;

export const nav = [
  { href: "/#features", label: "Features" },
  { href: "/#download", label: "Download" },
  { href: "/security", label: "Security" },
  { href: "/self-host", label: "Self-host" },
  { href: "/#faq", label: "FAQ" },
] as const;

/** Routes listed in the sitemap, with how often their content changes. */
export const routes = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/security", changeFrequency: "monthly", priority: 0.8 },
  { path: "/self-host", changeFrequency: "monthly", priority: 0.8 },
  // Linked from the Google consent screen as well as the footer, so they are
  // in the sitemap even though they are not pages anyone browses to.
  { path: "/privacy", changeFrequency: "monthly", priority: 0.3 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.3 },
] as const;

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}
