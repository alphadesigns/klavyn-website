import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ALL_PLATFORMS,
  CAPTURE_URL,
  DOWNLOAD_PLATFORM_ATTRIBUTE,
  buildPayload,
  createTracker,
  downloadPlatformOf,
  isTrackingAllowed,
  pageviewProperties,
  parseProjectKey,
  referrerOrigin,
  sendPayload,
  stripPageUrl,
  type CapturePayload,
  type PrivacySignals,
  type TrackerOptions,
} from "@/lib/analytics";

const KEY = "phc_test_key";
const ID = "00000000-0000-4000-8000-000000000000";

/** A tracker over a recording transport, with every option overridable. */
function setup(overrides: Partial<TrackerOptions> = {}) {
  const sendBeacon = vi.fn<(url: string, body: string) => boolean>(() => true);
  const fetch = vi.fn<(url: string, init: RequestInit) => Promise<void>>(() => Promise.resolve());
  const tracker = createTracker({
    apiKey: KEY,
    signals: {},
    transport: { sendBeacon, fetch },
    randomUUID: () => ID,
    ...overrides,
  });
  const sent = (): CapturePayload[] => sendBeacon.mock.calls.map(([, body]) => JSON.parse(body));
  return { tracker, sendBeacon, fetch, sent };
}

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

describe("referrerOrigin", () => {
  it("reduces a referrer to its origin", () => {
    expect(referrerOrigin("https://news.example.org/item?id=42#top")).toBe("https://news.example.org");
    expect(referrerOrigin("http://localhost:3000/a/b")).toBe("http://localhost:3000");
  });

  it("is null for no referrer or a non-web one", () => {
    for (const value of ["", "garbage", "android-app://com.example/", "about:blank"]) {
      expect(referrerOrigin(value), value).toBeNull();
    }
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
      properties: { $current_url: "https://klavyn.com/", $process_person_profile: false },
    });
  });

  it("cannot be talked into person profiles by a property", () => {
    const payload = buildPayload(KEY, ID, "x", { $process_person_profile: "true" });
    expect(payload.properties.$process_person_profile).toBe(false);
  });
});

describe("pageviewProperties", () => {
  it("sends only the stripped URL and the referrer's origin", () => {
    expect(pageviewProperties("https://klavyn.com/security?a=1#b", "https://search.example/?q=klavyn")).toEqual({
      $current_url: "https://klavyn.com/security",
      $referrer: "https://search.example",
    });
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
    expect(downloadPlatformOf(element("macOS"))).toBe("macOS");
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

describe("sendPayload", () => {
  const payload = buildPayload(KEY, ID, "$pageview", {});

  it("uses sendBeacon when the browser queues it", () => {
    const fetch = vi.fn(() => Promise.resolve());
    const sendBeacon = vi.fn(() => true);
    sendPayload(payload, { sendBeacon, fetch });
    expect(sendBeacon).toHaveBeenCalledWith(CAPTURE_URL, JSON.stringify(payload));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("falls back to a credential-less keepalive fetch", () => {
    for (const sendBeacon of [undefined, vi.fn(() => false)]) {
      const fetch = vi.fn<(url: string, init: RequestInit) => Promise<void>>(() => Promise.resolve());
      sendPayload(payload, { sendBeacon, fetch });
      expect(fetch).toHaveBeenCalledWith(CAPTURE_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        keepalive: true,
        credentials: "omit",
      });
    }
  });

  it("reports a failed fetch instead of throwing into the page", async () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    const failure = new Error("blocked");
    sendPayload(payload, { fetch: () => Promise.reject(failure) });
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
      const { tracker, sendBeacon, fetch } = setup({ apiKey });
      expect(tracker).toBeNull();
      expect(sendBeacon).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    }
  });

  it("sends nothing at all under Do Not Track or Global Privacy Control", () => {
    const refusals: PrivacySignals[] = [{ doNotTrack: "1" }, { globalPrivacyControl: true }];
    for (const signals of refusals) {
      const { tracker, sendBeacon, fetch } = setup({ signals });
      expect(tracker).toBeNull();
      expect(sendBeacon).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    }
  });

  it("sends nothing without a random id source", () => {
    expect(setup({ randomUUID: undefined }).tracker).toBeNull();
  });

  it("sends a stripped page view", () => {
    const { tracker, sent } = setup();
    tracker!.pageview("https://klavyn.com/terms?ref=mail#s2", "https://mail.example.com/inbox/123");
    expect(sent()).toEqual([
      {
        api_key: KEY,
        event: "$pageview",
        distinct_id: ID,
        properties: {
          $current_url: "https://klavyn.com/terms",
          $referrer: "https://mail.example.com",
          $process_person_profile: false,
        },
      },
    ]);
  });

  it("skips a page view whose URL cannot be reduced", () => {
    const { tracker, sendBeacon } = setup();
    tracker!.pageview("about:blank", "");
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("sends a download click with only its platform", () => {
    const { tracker, sent } = setup();
    tracker!.downloadClicked("Android");
    expect(sent()).toEqual([
      {
        api_key: KEY,
        event: "download_clicked",
        distinct_id: ID,
        properties: { platform: "Android", $process_person_profile: false },
      },
    ]);
  });

  it("uses one id for every event of a page load and a new one for the next load", () => {
    const ids = ["first-load", "second-load"];
    const randomUUID = vi.fn(() => ids.shift()!);
    const first = setup({ randomUUID });
    first.tracker!.pageview("https://klavyn.com/", "");
    first.tracker!.downloadClicked("macOS");
    expect(first.sent().map((p) => p.distinct_id)).toEqual(["first-load", "first-load"]);

    const second = setup({ randomUUID });
    second.tracker!.pageview("https://klavyn.com/", "");
    expect(second.sent()[0].distinct_id).toBe("second-load");
    expect(randomUUID).toHaveBeenCalledTimes(2);
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

      const { tracker, sendBeacon } = setup();
      tracker!.pageview("https://klavyn.com/", "https://example.com/");
      tracker!.downloadClicked("macOS");
      expect(sendBeacon).toHaveBeenCalledTimes(2);

      expect(cookie.get).not.toHaveBeenCalled();
      expect(cookie.set).not.toHaveBeenCalled();
      for (const store of [localStorage, sessionStorage]) {
        for (const method of Object.values(store)) expect(method).not.toHaveBeenCalled();
      }
      expect(indexedDB.open).not.toHaveBeenCalled();
    });
  });
});
