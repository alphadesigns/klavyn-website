import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlatformStatus } from "@/components/PlatformStatus";
import {
  STATUS_LABELS,
  TESTFLIGHT_URL,
  platformLink,
  platforms,
  releasesUrl,
  type PlatformId,
  type PlatformStatus as Status,
} from "@/content/download";
import { DOWNLOAD_PLATFORM_ATTRIBUTE } from "@/lib/analytics";

// The real ids are the lowercased names; the escaping test passes markup through both.
const render = (name: string, status: Status, link?: string) =>
  renderToStaticMarkup(<PlatformStatus platform={{ id: name.toLowerCase() as PlatformId, name, status, link }} />);

describe("PlatformStatus", () => {
  it("links an available platform's label to the releases page", () => {
    const html = render("macOS", "available");
    expect(html).toContain(`<a href="${releasesUrl}"`);
    expect(html).toContain(STATUS_LABELS.available);
  });

  it("names the platform in the link, so two download links read differently", () => {
    expect(render("macOS", "available")).toContain("for macOS");
    expect(render("Android", "available")).toContain("for Android");
  });

  it("links a TestFlight beta to its invitation, never to the releases page", () => {
    const html = render("iOS", "testflight", TESTFLIGHT_URL);
    expect(html).toContain(`<a href="${TESTFLIGHT_URL}"`);
    expect(html).not.toContain(releasesUrl);
    expect(html).toContain(STATUS_LABELS.testflight);
    expect(html).toContain("for iOS");
  });

  it("shows a TestFlight beta with no invitation as plain text", () => {
    expect(render("iOS", "testflight")).not.toContain("<a");
  });

  it("shows the other statuses as plain text, with nothing to click", () => {
    for (const status of ["next-release", "not-distributed"] as const) {
      const html = render("Windows", status);
      expect(html, status).not.toContain("<a");
      expect(html, status).toContain(STATUS_LABELS[status]);
    }
  });

  it("marks each link with its stable platform id, not its display name", () => {
    expect(render("macOS", "available")).toContain(`${DOWNLOAD_PLATFORM_ATTRIBUTE}="macos"`);
    expect(render("iOS", "testflight", TESTFLIGHT_URL)).toContain(`${DOWNLOAD_PLATFORM_ATTRIBUTE}="ios"`);
    expect(render("Windows", "next-release")).not.toContain(DOWNLOAD_PLATFORM_ATTRIBUTE);
  });

  it("sends each real platform's own id for its link", () => {
    for (const p of platforms.filter((platform) => platformLink(platform) !== null)) {
      const html = renderToStaticMarkup(<PlatformStatus platform={p} />);
      expect(html, p.name).toContain(`${DOWNLOAD_PLATFORM_ATTRIBUTE}="${p.id}"`);
    }
  });

  it("escapes the platform name", () => {
    expect(render("<b>", "available")).toContain("for &lt;b&gt;");
  });

  it("gives a link to exactly the platforms that can be had today", () => {
    const linked = platforms.filter((p) => render(p.name, p.status, p.link).includes("<a")).map((p) => p.name);
    expect(linked).toEqual(platforms.filter((p) => platformLink(p) !== null).map((p) => p.name));
    expect(linked).toEqual(["macOS", "Android", "iOS"]);
  });
});
