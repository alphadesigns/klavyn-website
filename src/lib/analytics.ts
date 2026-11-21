/**
 * Cookieless, first-party counting of page views and download clicks.
 *
 * Nothing here identifies a visitor. Each page load gets a random id that is
 * held in memory only and never written anywhere (no cookies, no web
 * storage, no IndexedDB), so two visits cannot be linked. URLs are reduced to
 * origin and path before they leave the browser, a referrer to its origin,
 * and PostHog is told not to build a person profile. A visitor who sends Do
 * Not Track or Global Privacy Control is not counted at all, and with no
 * project key configured nothing is ever sent.
 *
 * Everything that decides what is sent lives here as plain functions; the
 * component in src/components/Analytics.tsx only wires them to the browser.
 */

/** PostHog's EU ingestion host. Kept separate so the CSP and docs can name it. */
export const POSTHOG_HOST = "https://eu.i.posthog.com";

/** PostHog's single-event capture endpoint. */
export const CAPTURE_URL = `${POSTHOG_HOST}/i/v0/e/`;

export const PAGEVIEW_EVENT = "$pageview";
export const DOWNLOAD_CLICKED_EVENT = "download_clicked";

/** Put on a download link, naming its platform, to count clicks on it. */
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

/** How a payload leaves the browser: `navigator.sendBeacon`, with `fetch` as the fallback. */
export type Transport = {
  sendBeacon?: (url: string, body: string) => boolean;
  fetch?: (url: string, init: RequestInit) => Promise<unknown>;
};

/** One event in the shape PostHog's capture endpoint accepts. */
export type CapturePayload = {
  api_key: string;
  event: string;
  distinct_id: string;
  properties: { [name: string]: string | null | false; $process_person_profile: false };
};

/** Records what the site counts. Created by {@link createTracker}. */
export type Tracker = {
  /**
   * @param href the page's full URL; only origin and path are sent
   * @param referrer the referring URL, or "" for none; only its origin is sent
   */
  pageview(href: string, referrer: string): void;
  /** @param platform the clicked link's platform, from {@link downloadPlatformOf} */
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
 * Reduces a referrer to its origin: which site sent the visitor, never which
 * page of it.
 *
 * @returns the origin, or `null` for no referrer or one that is not http(s)
 */
export function referrerOrigin(referrer: string): string | null {
  return parseHttpUrl(referrer)?.origin ?? null;
}

/**
 * Validates a platform name read from a link's attribute. The page is ours,
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
 * @returns the platform, or `null` when the click was not on a download link
 */
export function downloadPlatformOf(target: unknown): string | null {
  if (!isElementLike(target)) return null;
  const link = target.closest(`[${DOWNLOAD_PLATFORM_ATTRIBUTE}]`);
  return parsePlatform(link?.getAttribute(DOWNLOAD_PLATFORM_ATTRIBUTE));
}

/** Properties of a `$pageview`, with the URL and referrer already reduced. */
export function pageviewProperties(href: string, referrer: string): Record<string, string | null> {
  return {
    $current_url: stripPageUrl(href),
    $referrer: referrerOrigin(referrer),
  };
}

/**
 * Builds one capture payload. `$process_person_profile: false` is set last so
 * no caller-supplied property can turn person profiles back on.
 */
export function buildPayload(
  apiKey: string,
  distinctId: string,
  event: string,
  properties: Record<string, string | null>,
): CapturePayload {
  return {
    api_key: apiKey,
    event,
    distinct_id: distinctId,
    properties: { ...properties, $process_person_profile: false },
  };
}

/**
 * Sends a payload without credentials. The body is a string, so both
 * transports send it as text/plain, which needs no CORS preflight; PostHog
 * reads the JSON regardless of the content type.
 */
export function sendPayload(payload: CapturePayload, transport: Transport): void {
  const body = JSON.stringify(payload);
  // sendBeacon returns false when the browser refuses to queue the request.
  if (transport.sendBeacon?.(CAPTURE_URL, body)) return;
  if (!transport.fetch) return;
  transport
    .fetch(CAPTURE_URL, { method: "POST", body, keepalive: true, credentials: "omit" })
    .catch((error: unknown) => {
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
  transport: Transport;
  /** `crypto.randomUUID`, absent outside a secure context. */
  randomUUID?: () => string;
};

/**
 * Creates the tracker for one page load, or returns `null` when nothing may
 * be sent: no project key, Do Not Track or Global Privacy Control set, or no
 * way to make a random id. The id is generated once here and lives only in
 * the returned closure.
 */
export function createTracker(options: TrackerOptions): Tracker | null {
  const apiKey = parseProjectKey(options.apiKey);
  if (apiKey === null) return null;
  if (!isTrackingAllowed(options.signals)) return null;
  if (!options.randomUUID) return null;

  const distinctId = options.randomUUID();
  const capture = (event: string, properties: Record<string, string | null>) =>
    sendPayload(buildPayload(apiKey, distinctId, event, properties), options.transport);

  return {
    pageview(href, referrer) {
      const properties = pageviewProperties(href, referrer);
      if (properties.$current_url === null) return;
      capture(PAGEVIEW_EVENT, properties);
    },
    downloadClicked(platform) {
      const parsed = parsePlatform(platform);
      if (parsed === null) return;
      capture(DOWNLOAD_CLICKED_EVENT, { platform: parsed });
    },
  };
}
