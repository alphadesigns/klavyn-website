import { describe, expect, it } from "vitest";
import { normaliseSiteUrl } from "@/lib/site";

describe("normaliseSiteUrl", () => {
  it("falls back to localhost when unset or blank", () => {
    expect(normaliseSiteUrl(undefined)).toBe("http://localhost:3000");
    expect(normaliseSiteUrl("   ")).toBe("http://localhost:3000");
  });

  it("keeps only the origin, so paths can be appended safely", () => {
    expect(normaliseSiteUrl("https://klavyn.dev/")).toBe("https://klavyn.dev");
    expect(normaliseSiteUrl("https://klavyn.dev/some/path?q=1#x")).toBe("https://klavyn.dev");
    expect(normaliseSiteUrl("  https://klavyn.dev  ")).toBe("https://klavyn.dev");
  });

  it("keeps a non-default port", () => {
    expect(normaliseSiteUrl("http://localhost:4000")).toBe("http://localhost:4000");
  });

  it("rejects values that are not absolute URLs", () => {
    expect(() => normaliseSiteUrl("klavyn.dev")).toThrow(/not a valid URL: "klavyn.dev"/);
  });

  it("rejects non-http protocols", () => {
    expect(() => normaliseSiteUrl("javascript:alert(1)")).toThrow(/must use http or https/);
    expect(() => normaliseSiteUrl("ftp://klavyn.dev")).toThrow(/got "ftp:"/);
  });
});
