import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ALL_PLATFORMS,
  CAPTURE_URL,
  DOWNLOAD_PLATFORM_ATTRIBUTE,
  buildPayload,
  createPageCounter,
  createTracker,
  downloadPlatformOf,
  isTrackingAllowed,
  nextPageview,
  pageviewProperties,
  parseProjectKey,
  referringDomain,
  restoredPageview,
  sendPayload,
  stripPageUrl,
  type CapturePayload,
  type PageLocation,
  type PrivacySignals,
  type Tracker,
  type TrackerOptions,
} from "@/lib/analytics";

const KEY = "phc_test_key";
const ID = "00000000-0000-4000-8000-000000000000";
const ORIGIN = "https://klavyn.com";

type FetchMock = (url: string, init: RequestInit) => Promise<void>;

/** A tracker over a recording fetch, with every option overridable. */
function setup(overrides: Partial<TrackerOptions> = {}) {
  const fetch = vi.fn<FetchMock>(() => Promise.resolve());
  const tracker = createTracker({ apiKey: KEY, signals: {}, fetch, randomUUID: () => ID, ...overrides });
  const sent = (): CapturePayload[] => fetch.mock.calls.map(([, init]) => JSON.parse(String(init.body)));
  return { tracker, fetch, sent };
}

/** A click target inside a link marked with `platform`. */
const link = (platform: string) => ({ closest: () => ({ getAttribute: () => platform }) });

const at = (pathname: string, query = ""): PageLocation => ({
  href: `${ORIGIN}${pathname}${query}`,
  pathname,
  origin: ORIGIN,
});

describe("stripPageUrl", () => {
  it("keeps origin and path and drops the query string and fragment", () => {
    expect(stripPageUrl("https://klavyn.com/self-host?token=secret&q=me#install")).toBe(
      "https://klavyn.com/self-host",
    );
  });

  it("drops credentials in the URL along with everything else", () => {
    expect(stripPageUrl("https://user:pass@klavyn.com/privacy?x=1")).toBe("https://klavyn.com/privacy");
  });

  it("keeps the root path", () => {
    expect(stripPageUrl("https://klavyn.com/?utm_source=x")).toBe("https://klavyn.com/");
  });

  it("returns null for something that is not an http(s) URL", () => {
    for (const value of ["", "not a url", "about:blank", "javascript:alert(1)", "file:///etc/passwd"]) {
      expect(stripPageUrl(value), value).toBeNull();
    }
  });
});

describe("referringDomain", () => {
  it("reduces a referrer to its domain alone, without scheme, port, path or query", () => {
    expect(referringDomain("https://news.example.org/item?id=42#top")).toBe("news.example.org");
    expect(referringDomain("http://localhost:3000/a/b")).toBe("localhost");
    expect(referringDomain("https://user:pass@mail.example.com:8443/inbox")).toBe("mail.example.com");
  });

  it("is null for no referrer or a non-web one", () => {
    for (const value of ["", "garbage", "android-app://com.example/", "about:blank"]) {
      expect(referringDomain(value), value).toBeNull();
    }
  });
});

describe("pageviewProperties", () => {
  it("sends the stripped URL, its host and path, and the referrer's domain", () => {
    expect(
      pageviewProperties({ href: "https://klavyn.com/security?a=1#b", referrer: "https://search.example/?q=klavyn" }),
    ).toEqual({
      $current_url: "https://klavyn.com/security",
      $host: "klavyn.com",
      $pathname: "/security",
      $referring_domain: "search.example",
    });
  });

  it("sends a null referring domain when there is no referrer", () => {
    expect(pageviewProperties({ href: "https://klavyn.com/", referrer: "" })?.$referring_domain).toBeNull();
  });

  it("never sends the full referrer", () => {
    const properties = pageviewProperties({ href: "https://klavyn.com/", referrer: "https://a.example/secret" });
    expect(properties).not.toHaveProperty("$referrer");
    expect(JSON.stringify(properties)).not.toContain("secret");
  });

  it("is null for a page URL that is not http(s)", () => {
    expect(pageviewProperties({ href: "about:blank", referrer: "" })).toBeNull();
  });
});

describe("isTrackingAllowed", () => {
  it("allows counting with no signal set", () => {
    expect(isTrackingAllowed({})).toBe(true);
    expect(isTrackingAllowed({ doNotTrack: "0", globalPrivacyControl: false })).toBe(true);
    expect(isTrackingAllowed({ doNotTrack: null })).toBe(true);
  });

  it("respects Do Not Track", () => {
    expect(isTrackingAllowed({ doNotTrack: "1" })).toBe(false);
    expect(isTrackingAllowed({ doNotTrack: "yes" })).toBe(false);
  });

  it("respects Global Privacy Control", () => {
    expect(isTrackingAllowed({ globalPrivacyControl: true })).toBe(false);
  });
});

describe("parseProjectKey", () => {
  it("is null when the key is unset or blank", () => {
    for (const value of [undefined, "", "   "]) expect(parseProjectKey(value)).toBeNull();
  });

  it("trims a configured key", () => {
    expect(parseProjectKey(` ${KEY}\n`)).toBe(KEY);
  });
});

describe("buildPayload", () => {
  it("has PostHog's shape and never processes a person profile", () => {
    expect(buildPayload(KEY, ID, "$pageview", { $current_url: "https://klavyn.com/" })).toEqual({
      api_key: KEY,
      event: "$pageview",
      distinct_id: ID,
      properties: { $current_url: "https://klavyn.com/", $process_person_profile: false, $geoip_disable: true },
    });
  });

  it("cannot be talked into person profiles by a property", () => {
    const payload = buildPayload(KEY, ID, "x", { $process_person_profile: "true", $geoip_disable: "false" });
    expect(payload.properties.$process_person_profile).toBe(false);
    expect(payload.properties.$geoip_disable).toBe(true);
  });
});

describe("downloadPlatformOf", () => {
  const element = (platform: string | null) => ({
    closest: (selector: string) => {
      expect(selector).toBe(`[${DOWNLOAD_PLATFORM_ATTRIBUTE}]`);
      return platform === null ? null : { getAttribute: () => platform };
    },
  });

  it("reads the platform from the nearest marked link", () => {
    expect(downloadPlatformOf(element("macos"))).toBe("macos");
    expect(downloadPlatformOf(element(ALL_PLATFORMS))).toBe("all");
  });

  it("is null for a click outside a download link", () => {
    expect(downloadPlatformOf(element(null))).toBeNull();
  });

  it("is null for a target that is not an element", () => {
    for (const target of [null, undefined, {}, "a", 1]) expect(downloadPlatformOf(target)).toBeNull();
  });

  it("rejects an empty or oversized platform value", () => {
    expect(downloadPlatformOf(element(""))).toBeNull();
    expect(downloadPlatformOf(element("   "))).toBeNull();
    expect(downloadPlatformOf(element("x".repeat(41)))).toBeNull();
  });
});

describe("nextPageview", () => {
  const view = (last: string | null, path: string) =>
    nextPageview(last, path, `${ORIGIN}${path}?q=1`, "https://ref.example/page", ORIGIN);

  it("uses document.referrer for the first view of the page load", () => {
    expect(view(null, "/")).toEqual({ href: `${ORIGIN}/?q=1`, referrer: "https://ref.example/page" });
  });

  it("names this site as the referrer of a later, client-side view", () => {
    expect(view("/", "/security")).toEqual({ href: `${ORIGIN}/security?q=1`, referrer: ORIGIN });
  });

  it("does not count the same path twice in a row", () => {
    expect(view("/security", "/security")).toBeNull();
  });
});

describe("restoredPageview", () => {
  it("counts a page restored from the back-forward cache, with no referrer", () => {
    expect(restoredPageview(true, `${ORIGIN}/terms`)).toEqual({ href: `${ORIGIN}/terms`, referrer: "" });
  });

  it("leaves an ordinary load to the route change", () => {
    expect(restoredPageview(false, `${ORIGIN}/terms`)).toBeNull();
  });
});

describe("sendPayload", () => {
  const payload = buildPayload(KEY, ID, "$pageview", {});

  it("sends with fetch, without credentials or a Referer, and surviving the page closing", () => {
    const fetch = vi.fn<FetchMock>(() => Promise.resolve());
    sendPayload(payload, fetch);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(CAPTURE_URL);
    expect(init).toEqual({
      method: "POST",
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
  });

  it("never uses sendBeacon, which always sends credentials", () => {
    // Both files, the wiring included: it is where `navigator` is in reach.
    // Matched without stripping comments, so no comment can hide code.
    for (const file of ["../src/lib/analytics.ts", "../src/components/Analytics.tsx"]) {
      const source = fs.readFileSync(path.join(__dirname, file), "utf8");
      expect(source, file).not.toMatch(/\bsendBeacon\b/);
    }
  });

  it("reports a failed send instead of throwing into the page", async () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    const failure = new Error("blocked");
    sendPayload(payload, () => Promise.reject(failure));
    await vi.waitFor(() => expect(debug).toHaveBeenCalledWith("analytics: sending $pageview failed", failure));
    debug.mockRestore();
  });

  it("sends to PostHog's EU capture endpoint", () => {
    expect(CAPTURE_URL).toBe("https://eu.i.posthog.com/i/v0/e/");
  });
});

describe("createTracker", () => {
  it("sends nothing at all without a project key", () => {
    for (const apiKey of [undefined, "", "  "]) {
      const { tracker, fetch } = setup({ apiKey });
      expect(tracker).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    }
  });

  it("sends nothing at all under Do Not Track or Global Privacy Control", () => {
    const refusals: PrivacySignals[] = [{ doNotTrack: "1" }, { globalPrivacyControl: true }];
    for (const signals of refusals) {
      const { tracker, fetch } = setup({ signals });
      expect(tracker).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    }
  });

  it("sends nothing without a random id source", () => {
    expect(setup({ randomUUID: undefined }).tracker).toBeNull();
  });

  it("sends a stripped page view", () => {
    const { tracker, sent } = setup();
    tracker!.pageview({ href: "https://klavyn.com/terms?ref=mail#s2", referrer: "https://mail.example.com/inbox/123" });
    expect(sent()).toEqual([
      {
        api_key: KEY,
        event: "$pageview",
        distinct_id: ID,
        properties: {
          $current_url: "https://klavyn.com/terms",
          $host: "klavyn.com",
          $pathname: "/terms",
          $referring_domain: "mail.example.com",
          $process_person_profile: false,
          $geoip_disable: true,
        },
      },
    ]);
  });

  it("skips a page view whose URL cannot be reduced", () => {
    const { tracker, fetch } = setup();
    tracker!.pageview({ href: "about:blank", referrer: "" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sends a download click with only its platform", () => {
    const { tracker, sent } = setup();
    tracker!.downloadClicked("android");
    expect(sent()).toEqual([
      {
        api_key: KEY,
        event: "download_clicked",
        distinct_id: ID,
        properties: { platform: "android", $process_person_profile: false, $geoip_disable: true },
      },
    ]);
  });

  it("makes its id once and uses it for every event", () => {
    const randomUUID = vi.fn(() => ID);
    const { tracker, sent } = setup({ randomUUID });
    tracker!.pageview({ href: "https://klavyn.com/", referrer: "" });
    tracker!.downloadClicked("macos");
    expect(sent().map((p) => p.distinct_id)).toEqual([ID, ID]);
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });
});

describe("createPageCounter", () => {
  /** A counter whose trackers record what they were asked, each with its own id. */
  function counterSetup() {
    const events: { id: string; event: string; detail: unknown }[] = [];
    let made = 0;
    const makeTracker = vi.fn((): Tracker => {
      const id = `load-${++made}`;
      return {
        pageview: (view) => events.push({ id, event: "pageview", detail: view }),
        downloadClicked: (platform) => events.push({ id, event: "download", detail: platform }),
      };
    });
    return { counter: createPageCounter(makeTracker), makeTracker, events };
  }

  it("counts the first view with the document's referrer and later views with the site's origin", () => {
    const { counter, events } = counterSetup();
    counter.routeChanged(at("/"), "https://ref.example/page");
    counter.routeChanged(at("/security"), "https://ref.example/page");
    expect(events.map((e) => e.detail)).toEqual([
      { href: `${ORIGIN}/`, referrer: "https://ref.example/page" },
      { href: `${ORIGIN}/security`, referrer: ORIGIN },
    ]);
  });

  it("counts a path once when the route effect runs twice", () => {
    const { counter, events } = counterSetup();
    counter.routeChanged(at("/"), "");
    counter.routeChanged(at("/"), "");
    expect(events).toHaveLength(1);
  });

  it("does not make a tracker before there is anything to count", () => {
    const { counter, makeTracker } = counterSetup();
    counter.clicked({ closest: () => null });
    counter.pageShown(false, at("/"));
    expect(makeTracker).not.toHaveBeenCalled();
  });

  it("uses one id for the whole page load", () => {
    const { counter, events, makeTracker } = counterSetup();
    counter.routeChanged(at("/"), "");
    counter.clicked(link("macos"));
    counter.routeChanged(at("/self-host"), "");
    expect(events.map((e) => e.id)).toEqual(["load-1", "load-1", "load-1"]);
    expect(makeTracker).toHaveBeenCalledTimes(1);
  });

  it("forgets the id on leaving and counts a fresh view under a new id when restored with Back", () => {
    const { counter, events } = counterSetup();
    counter.routeChanged(at("/"), "");
    counter.pageHidden();
    counter.pageShown(true, at("/", "?q=1"));
    expect(events).toEqual([
      { id: "load-1", event: "pageview", detail: { href: `${ORIGIN}/`, referrer: "" } },
      { id: "load-2", event: "pageview", detail: { href: `${ORIGIN}/?q=1`, referrer: "" } },
    ]);
  });

  it("counts a later client-side navigation after a restore as referred by the site", () => {
    const { counter, events } = counterSetup();
    counter.routeChanged(at("/"), "https://ref.example/");
    counter.pageHidden();
    counter.pageShown(true, at("/"));
    counter.routeChanged(at("/terms"), "https://ref.example/");
    expect(events.at(-1)).toEqual({ id: "load-2", event: "pageview", detail: { href: `${ORIGIN}/terms`, referrer: ORIGIN } });
  });

  it("counts a click on a download link and ignores any other click", () => {
    const { counter, events } = counterSetup();
    counter.clicked(link("ios"));
    counter.clicked({ closest: () => null });
    expect(events).toEqual([{ id: "load-1", event: "download", detail: "ios" }]);
  });

  it("does nothing when counting is off, and asks again after leaving", () => {
    const makeTracker = vi.fn(() => null);
    const counter = createPageCounter(makeTracker);
    counter.routeChanged(at("/"), "");
    counter.clicked(link("macos"));
    expect(makeTracker).toHaveBeenCalledTimes(1);
    counter.pageHidden();
    counter.pageShown(true, at("/"));
    expect(makeTracker).toHaveBeenCalledTimes(2);
  });

  it("sends nothing end to end without a key", () => {
    const fetch = vi.fn<FetchMock>(() => Promise.resolve());
    const counter = createPageCounter(() =>
      createTracker({ apiKey: undefined, signals: {}, fetch, randomUUID: () => ID }),
    );
    counter.routeChanged(at("/"), "");
    counter.clicked(link("macos"));
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("storage", () => {
  const sources = ["src/lib/analytics.ts", "src/components/Analytics.tsx"].map((file) => ({
    file,
    text: fs.readFileSync(path.join(__dirname, "..", file), "utf8"),
  }));

  it("never references cookies or browser storage in the source", () => {
    for (const { file, text } of sources) {
      for (const pattern of [/document\.cookie/, /localStorage/, /sessionStorage/, /indexedDB/, /cookieStore/]) {
        expect(text, `${file} mentions ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  describe("at runtime", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("touches no cookie or storage while counting", () => {
      const cookie = { get: vi.fn(() => ""), set: vi.fn() };
      const document = Object.defineProperty({}, "cookie", { ...cookie, configurable: true });
      const storage = () => ({ getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() });
      const localStorage = storage();
      const sessionStorage = storage();
      const indexedDB = { open: vi.fn() };
      vi.stubGlobal("document", document);
      vi.stubGlobal("localStorage", localStorage);
      vi.stubGlobal("sessionStorage", sessionStorage);
      vi.stubGlobal("indexedDB", indexedDB);

      const { tracker, fetch } = setup();
      const counter = createPageCounter(() => tracker);
      counter.routeChanged(at("/"), "https://example.com/");
      counter.clicked(link("macos"));
      counter.pageHidden();
      counter.pageShown(true, at("/"));
      expect(fetch).toHaveBeenCalledTimes(3);

      expect(cookie.get).not.toHaveBeenCalled();
      expect(cookie.set).not.toHaveBeenCalled();
      for (const store of [localStorage, sessionStorage]) {
        for (const method of Object.values(store)) expect(method).not.toHaveBeenCalled();
      }
      expect(indexedDB.open).not.toHaveBeenCalled();
    });
  });
});
