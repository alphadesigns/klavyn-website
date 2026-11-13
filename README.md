# credvault-web

Marketing site for [CredVault](https://github.com/cjaymoni/credvault), the
self-hosted, end-to-end encrypted password manager. Next.js 16 (App Router),
fully static, no client-side analytics or third-party scripts.

## Develop

```sh
npm install
cp .env.example .env.local     # set NEXT_PUBLIC_SITE_URL
npm run dev                    # http://localhost:3000
```

| Command | Does |
| --- | --- |
| `npm test` | Unit tests (Vitest): URL handling, structured data, crawler files, snippets |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint with the Next.js config |
| `npm run build` | Static production build |

## Deploy

Every route prerenders, so any static-capable host works (Vercel, Netlify,
Cloudflare Pages, or `next start` behind a proxy).

**Set `NEXT_PUBLIC_SITE_URL` to the production origin before building.** It
feeds canonical links, the sitemap, `robots.txt`, Open Graph URLs and JSON-LD.
Left unset, all of those point at `http://localhost:3000`. A malformed value
fails the build instead of shipping broken links.

## Layout

```
src/lib/site.ts          product facts, nav, routes: change the domain or repo here
src/lib/seo.ts           per-page metadata and JSON-LD builders
src/content/faq.ts       FAQ copy, shared by the page and FAQPage structured data
src/content/download.ts  per-platform status: flip one field when a release adds a platform
src/content/self-host.tsx shell snippets (rendered and copyable forms from one source)
src/app/                 pages, sitemap.ts, robots.ts, manifest.ts, opengraph-image.tsx
src/app/globals.css      design tokens (light and dark) and all styles
```

## SEO checklist

- Unique title, description and canonical URL per page (`pageMetadata`)
- Open Graph and Twitter cards; a 1200×630 social image generated at build time
- `sitemap.xml`, `robots.txt`, web manifest, favicon and Apple touch icon
- JSON-LD: `WebSite`, `SoftwareApplication` (free offer), `FAQPage`, `BreadcrumbList`
- Semantic landmarks, one `h1` per page, light and dark `theme-color`

Copy must stay true to the product. Claims about the cryptography come from the
CredVault README; check them there before changing them.
