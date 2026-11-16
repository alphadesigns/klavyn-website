import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlatformStatus } from "@/components/PlatformStatus";
import { STATUS_LABELS, platforms, releasesUrl, type PlatformStatus as Status } from "@/content/download";

const render = (name: string, status: Status) =>
  renderToStaticMarkup(<PlatformStatus platform={{ name, status }} />);

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

  it("shows the other statuses as plain text, with nothing to click", () => {
    for (const status of ["next-release", "not-distributed"] as const) {
      const html = render("Windows", status);
      expect(html, status).not.toContain("<a");
      expect(html, status).toContain(STATUS_LABELS[status]);
    }
  });

  it("escapes the platform name", () => {
    expect(render("<b>", "available")).toContain("for &lt;b&gt;");
  });

  it("gives a link to exactly the platforms the site lists as available", () => {
    const linked = platforms.filter((p) => render(p.name, p.status).includes("<a")).map((p) => p.name);
    expect(linked).toEqual(platforms.filter((p) => p.status === "available").map((p) => p.name));
  });
});
