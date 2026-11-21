# klavyn-web

Marketing site for [Klavyn](https://github.com/alphadesigns/klavyn), the
self-hosted, end-to-end encrypted password manager. Next.js 16 (App Router),
fully static, no third-party scripts.

Analytics are cookieless and first-party: a small script of our own counts
page views and download clicks and sends them to PostHog's EU host. No
personal data is collected. The only identifier is a random id made for each
page load and never stored (no cookies, no local or session storage); URLs are
sent without their query string or fragment, and referrers as their origin
only. Visitors with Do Not Track or Global Privacy Control on are not counted
at all, and with `NEXT_PUBLIC_POSTHOG_KEY` unset nothing is sent. The code is
`src/lib/analytics.ts` and `src/components/Analytics.tsx`.

## Develop

```sh
npm install
cp .env.example .env.local     # set NEXT_PUBLIC_SITE_URL
npm run dev                    # http://localhost:3000
```

| Command | Does |
| --- | --- |
| `npm test` | Unit tests (Vitest): URL handling, structured data, crawler files, snippets, analytics payloads |
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
Klavyn README; check them there before changing them.

## Deploying

The site runs as a Next server behind the nginx already on the host, in the
same shape as the API: TLS is a Cloudflare Origin Certificate, the app listens
on loopback only, and the firewall allows 80/443 from Cloudflare alone.

```sh
# on the server, as root
git clone https://github.com/alphadesigns/klavyn-website /srv/klavyn-website
chown -R deploy:deploy /srv/klavyn-website

# as deploy
cd /srv/klavyn-website
printf 'NEXT_PUBLIC_SITE_URL=https://klavyn.com\n' > .env
npm ci && npm run build

# as root
cp deploy/klavyn-web.service /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now klavyn-web
```

Then point the apex and `www` server blocks at `127.0.0.1:3100` instead of a
static root, and `nginx -t` before reloading — that host serves other sites,
so a bad block takes them down too.

### The policy pages

`/privacy` and `/terms` are not written here. They are generated from the
Markdown in the klavyn repository, which is the same source the app renders
before sign-up, so the two cannot drift:

```sh
node scripts/sync-legal.mjs ../klavyn
```

Re-run it whenever those documents change, and commit the regenerated
`src/content/legal.generated.ts`. While the sources still contain
`[PLACEHOLDER]` markers the pages show a draft notice, and `tests/legal.test.ts`
makes sure that notice cannot be dropped while a placeholder remains.
