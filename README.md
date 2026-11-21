# klavyn-web

Marketing site for [Klavyn](https://github.com/alphadesigns/klavyn), the
self-hosted, end-to-end encrypted password manager. Next.js 16 (App Router),
fully static, no third-party scripts.

Page views and download clicks are counted without cookies: a small script
of our own sends them to PostHog's EU host. PostHog sees the visitor's IP
address on the way in and is configured to discard it, and is told not to
work out a location from it. The only identifier is a random id made for each
page load, never stored (no cookies, no local or session storage) and
forgotten when the visitor leaves the page. URLs are sent without their query
string or fragment, referrers as their domain only, and requests carry no
cookies or Referer header. Visitors with Do Not Track or Global Privacy
Control on are not counted at all, and with `NEXT_PUBLIC_POSTHOG_KEY` unset
nothing is sent. The code is `src/lib/analytics.ts` and
`src/components/Analytics.tsx`.

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

**Before setting `NEXT_PUBLIC_POSTHOG_KEY`**, turn on "Discard client IP
data" in that PostHog project's settings, and check that it is on. Visitors'
browsers send the counts to PostHog directly, so PostHog sees their IP
address, and the privacy policy says it is discarded. The setting is per
project; if the klavyn server's app telemetry uses the same project, that is
fine, because the server already sends no client IP. Leave the key out of
`.env` and the site sends nothing at all.

**Do not deploy this branch, `posthog-pageviews`, until the klavyn
repository's `posthog-telemetry` branch is merged and its server deployed** --
with or without the key. The privacy policy synced into this branch describes
behaviour only that branch has, and deploying it publishes that text.

```sh
# on the server, as root
git clone https://github.com/alphadesigns/klavyn-website /srv/klavyn-website
chown -R deploy:deploy /srv/klavyn-website

# as deploy -- both values are inlined at build time, so .env is written first
cd /srv/klavyn-website
printf 'NEXT_PUBLIC_SITE_URL=https://klavyn.com\nNEXT_PUBLIC_POSTHOG_KEY=phc_...\n' > .env
npm ci && npm run build

# as root
cp deploy/klavyn-web.service /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now klavyn-web
```

If nginx (or anything else in front) sets a Content-Security-Policy for the
site, its `connect-src` must allow `https://eu.i.posthog.com`, or the browser
blocks every count. The repository sets none itself.

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
`src/content/legal.generated.ts`. Until klavyn's `posthog-telemetry` branch
is merged, sync only from a checkout of that branch: its `main` does not yet
describe this site's counting, and `tests/legal.test.ts` fails if the
policy's website paragraph stops naming the counting, Do Not Track, Global
Privacy Control, the absence of cookies, or that the address is discarded. While the sources still contain
`[PLACEHOLDER]` markers the pages show a draft notice, and `tests/legal.test.ts`
makes sure that notice cannot be dropped while a placeholder remains.
