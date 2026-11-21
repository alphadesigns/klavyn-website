/**
 * Cookieless, first-party counting of page views and download clicks.
 *
 * Nothing here identifies a visitor. Each page load gets a random id that is
 * held in memory only and never written anywhere (no cookies, no web
 * storage, no IndexedDB), and is forgotten when the visitor leaves the page,
 * so two visits cannot be linked. URLs are reduced to origin and path before
 * they leave the browser, a referrer to its domain, requests carry no
 * credentials and no Referer header, and PostHog is told not to build a
 * person profile. A visitor who sends Do Not Track or Global Privacy Control
 * is not counted at all, and with no project key configured nothing is ever
 * sent.
 *
 * Everything that decides what is sent lives here as plain functions; the
 * component in src/components/Analytics.tsx only wires them to the browser.
 */

/**
 * PostHog's EU ingestion host. The browser connects to it directly, so a
 * Content-Security-Policy on the host serving this site must allow
 * `connect-src https://eu.i.posthog.com`.
 */
export const POSTHOG_HOST = "https://eu.i.posthog.com";

/** PostHog's single-event capture endpoint. */
export const CAPTURE_URL = `${POSTHOG_HOST}/i/v0/e/`;

export const PAGEVIEW_EVENT = "$pageview";
export const DOWNLOAD_CLICKED_EVENT = "download_clicked";

/** Put on a download link, naming its platform id, to count clicks on it. */
export const DOWNLOAD_PLATFORM_ATTRIBUTE = "data-download-platform";

/** The platform value for a link to the releases page as a whole. */
export const ALL_PLATFORMS = "all";

/** Longest platform value accepted from the page; anything longer is not one of ours. */
const MAX_PLATFORM_LENGTH = 40;

/** The browser's privacy signals. `globalPrivacyControl` is not in TypeScript's DOM types yet. */
export type PrivacySignals = {
  doNotTrack?: string | null;
  globalPrivacyControl?: boolean;
};

/**
 * How a payload leaves the browser. Only `fetch`: `navigator.sendBeacon`
 * always sends credentials, so it would carry any cookies the browser holds
 * for posthog.com.
 */
export type Fetch = (url: string, init: RequestInit) => Promise<unknown>;

/** A property value PostHog receives from this site. */
type PropertyValue = string | null;

/** One event in the shape PostHog's capture endpoint accepts. */
export type CapturePayload = {
  api_key: string;
  event: string;
  distinct_id: string;
  properties: { [name: string]: PropertyValue | false; $process_person_profile: false };
};

/** A page view, before reduction: the full URL and the full referrer ("" for none). */
export type PageviewInput = { href: string; referrer: string };

/** Records what the site counts. Created by {@link createTracker}. */
export type Tracker = {
  /** Counts a page view; only the reduced URL and the referrer's domain are sent. */
  pageview(view: PageviewInput): void;
  /** @param platform the clicked link's platform id, from {@link downloadPlatformOf} */
  downloadClicked(platform: string): void;
};

/** Returns the configured project key, or `null` when it is unset or blank. */
export function parseProjectKey(raw: string | undefined): string | null {
  const key = raw?.trim();
  return key ? key : null;
}

/**
 * Whether the visitor allows counting. Do Not Track is "1" in current
 * browsers and was "yes" in old Firefox; either one, or Global Privacy
 * Control, means no.
 */
export function isTrackingAllowed(signals: PrivacySignals): boolean {
  if (signals.doNotTrack === "1" || signals.doNotTrack === "yes") return false;
  return signals.globalPrivacyControl !== true;
}

/**
 * Parses an absolute http(s) URL, or returns `null`. An opaque origin
 * (`about:blank`, `android-app://...`) is treated as no URL at all.
 */
function parseHttpUrl(raw: string): URL | null {
  if (!raw) return null;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    // Not a URL: there is nothing safe to report, so report nothing.
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  return parsed;
}

/**
 * Reduces a page URL to origin and path. The query string and fragment are
 * dropped, since either can carry something the visitor typed or was sent.
 *
 * @returns the stripped URL, or `null` when `href` is not an http(s) URL
 */
export function stripPageUrl(href: string): string | null {
  const parsed = parseHttpUrl(href);
  return parsed ? `${parsed.origin}${parsed.pathname}` : null;
}

/**
 * Reduces a referrer to its domain: which site sent the visitor, never which
 * page of it, and not its scheme or port either.
 *
 * @returns the hostname, or `null` for no referrer or one that is not http(s)
 */
export function referringDomain(referrer: string): string | null {
  return parseHttpUrl(referrer)?.hostname ?? null;
}

/**
 * The properties of a `$pageview`: the stripped URL, the host and path
 * PostHog's web analytics reads, and the referrer's domain.
 *
 * @returns the properties, or `null` when the page URL is not http(s)
 */
export function pageviewProperties(view: PageviewInput): Record<string, PropertyValue> | null {
  const stripped = stripPageUrl(view.href);
  if (stripped === null) return null;
  // Re-parsed from the stripped form, so nothing dropped above can come back.
  const page = new URL(stripped);
  return {
    $current_url: stripped,
    $host: page.hostname,
    $pathname: page.pathname,
    $referring_domain: referringDomain(view.referrer),
  };
}

/**
 * Validates a platform id read from a link's attribute. The page is ours,
 * but the value still goes to a third party, so it is bounded.
 */
export function parsePlatform(raw: string | null | undefined): string | null {
  const platform = raw?.trim();
  if (!platform || platform.length > MAX_PLATFORM_LENGTH) return null;
  return platform;
}

/** The parts of a DOM element {@link downloadPlatformOf} uses. */
type ElementLike = {
  closest(selector: string): { getAttribute(name: string): string | null } | null;
};

function isElementLike(target: unknown): target is ElementLike {
  return typeof (target as ElementLike | null)?.closest === "function";
}

/**
 * Finds the download platform of a click target: the
 * `data-download-platform` value on the target or the nearest ancestor
 * carrying one.
 *
 * @returns the platform id, or `null` when the click was not on a download link
 */
export function downloadPlatformOf(target: unknown): string | null {
  if (!isElementLike(target)) return null;
  const link = target.closest(`[${DOWNLOAD_PLATFORM_ATTRIBUTE}]`);
  return parsePlatform(link?.getAttribute(DOWNLOAD_PLATFORM_ATTRIBUTE));
}

/** Where the page is, as the browser reports it. */
export type PageLocation = { href: string; pathname: string; origin: string };

/**
 * Decides whether a route change is a new page view, and what referred it.
 * The same path twice (React runs effects twice in development) is not a
 * new view. `document.referrer` never changes after the page loads, so only
 * the first view uses it; a later, client-side view was referred by this
 * site itself.
 *
 * @param lastPath the path last counted in this page load, or `null` for none
 * @returns the view to count, or `null` when there is none
 */
export function nextPageview(
  lastPath: string | null,
  path: string,
  href: string,
  documentReferrer: string,
  origin: string,
): PageviewInput | null {
  if (lastPath === path) return null;
  return { href, referrer: lastPath === null ? documentReferrer : origin };
}

/**
 * Decides whether a `pageshow` is a new page view. Only a page restored from
 * the back-forward cache (`persisted`) is: a normal load is counted by the
 * route change. Where the visitor came back from is not known, so no
 * referrer is sent.
 */
export function restoredPageview(persisted: boolean, href: string): PageviewInput | null {
  return persisted ? { href, referrer: "" } : null;
}

/**
 * Builds one capture payload. `$process_person_profile: false` is set last so
 * no caller-supplied property can turn person profiles back on.
 */
export function buildPayload(
  apiKey: string,
  distinctId: string,
  event: string,
  properties: Record<string, PropertyValue>,
): CapturePayload {
  return {
    api_key: apiKey,
    event,
    distinct_id: distinctId,
    properties: { ...properties, $process_person_profile: false },
  };
}

/** The request options for every send: no cookies, no Referer, and survives the page closing. */
export const SEND_OPTIONS = {
  method: "POST",
  keepalive: true,
  credentials: "omit",
  referrerPolicy: "no-referrer",
} as const satisfies RequestInit;

/**
 * Sends a payload. The body is a string, so it goes as text/plain, which
 * needs no CORS preflight; PostHog reads the JSON regardless of the content
 * type.
 */
export function sendPayload(payload: CapturePayload, fetch: Fetch): void {
  fetch(CAPTURE_URL, { ...SEND_OPTIONS, body: JSON.stringify(payload) }).catch((error: unknown) => {
    // Counting is best effort: a blocked or offline request must never
    // break the page, so it is reported for debugging and dropped.
    console.debug(`analytics: sending ${payload.event} failed`, error);
  });
}

/** What {@link createTracker} needs from the browser. */
export type TrackerOptions = {
  /** The raw `NEXT_PUBLIC_POSTHOG_KEY`. */
  apiKey: string | undefined;
  signals: PrivacySignals;
  fetch: Fetch;
  /** `crypto.randomUUID`, absent outside a secure context. */
  randomUUID?: () => string;
};

/**
 * Creates a tracker with a new random id, or returns `null` when nothing may
 * be sent: no project key, Do Not Track or Global Privacy Control set, or no
 * way to make a random id. The id lives only in the returned closure.
 */
export function createTracker(options: TrackerOptions): Tracker | null {
  const apiKey = parseProjectKey(options.apiKey);
  if (apiKey === null) return null;
  if (!isTrackingAllowed(options.signals)) return null;
  if (!options.randomUUID) return null;

  const distinctId = options.randomUUID();
  const capture = (event: string, properties: Record<string, PropertyValue>) =>
    sendPayload(buildPayload(apiKey, distinctId, event, properties), options.fetch);

  return {
    pageview(view) {
      const properties = pageviewProperties(view);
      if (properties === null) return;
      capture(PAGEVIEW_EVENT, properties);
    },
    downloadClicked(platform) {
      const parsed = parsePlatform(platform);
      if (parsed === null) return;
      capture(DOWNLOAD_CLICKED_EVENT, { platform: parsed });
    },
  };
}

/** One page load's counting, driven by browser events. Created by {@link createPageCounter}. */
export type PageCounter = {
  /** The App Router path changed, including the first render. */
  routeChanged(location: PageLocation, documentReferrer: string): void;
  /** `pagehide`: the visitor left, so the id is forgotten. */
  pageHidden(): void;
  /** `pageshow`: counts a page restored from the back-forward cache. */
  pageShown(persisted: boolean, location: PageLocation): void;
  /** A click anywhere; counts it when it is on a download link. */
  clicked(target: unknown): void;
};

/**
 * Ties the decisions above to page events. The tracker, and with it the
 * random id, is made on first use and dropped on `pagehide`, so a page
 * restored with Back gets a new id instead of the one it left with.
 *
 * @param makeTracker called for each new id; in the browser, {@link createTracker}
 */
export function createPageCounter(makeTracker: () => Tracker | null): PageCounter {
  // `undefined`: not made yet, or forgotten on leaving. `null`: counting is off.
  let tracker: Tracker | null | undefined;
  let lastPath: string | null = null;

  const current = (): Tracker | null => {
    if (tracker === undefined) tracker = makeTracker();
    return tracker;
  };

  const count = (path: string, view: PageviewInput | null) => {
    if (view === null) return;
    lastPath = path;
    current()?.pageview(view);
  };

  return {
    routeChanged(location, documentReferrer) {
      count(
        location.pathname,
        nextPageview(lastPath, location.pathname, location.href, documentReferrer, location.origin),
      );
    },
    pageHidden() {
      tracker = undefined;
    },
    pageShown(persisted, location) {
      count(location.pathname, restoredPageview(persisted, location.href));
    },
    clicked(target) {
      const platform = downloadPlatformOf(target);
      if (platform !== null) current()?.downloadClicked(platform);
    },
  };
}
