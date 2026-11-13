import { describe, expect, it } from "vitest";
import { activeSectionId, tocFromSections } from "@/lib/toc";

describe("tocFromSections", () => {
  it("keeps page order and pairs each id with its heading", () => {
    expect(tocFromSections({ intro: "Intro", "first-account": "Create your first account" })).toEqual([
      { id: "intro", label: "Intro" },
      { id: "first-account", label: "Create your first account" },
    ]);
  });

  it("returns an empty list for a page with no sections", () => {
    expect(tocFromSections({})).toEqual([]);
  });
});

describe("activeSectionId", () => {
  const headings = (...tops: number[]) => tops.map((top, i) => ({ id: `s${i}`, top }));

  it("is null with no headings", () => {
    expect(activeSectionId([], 120)).toBeNull();
  });

  it("marks the first section before any heading reaches the reading line", () => {
    expect(activeSectionId(headings(400, 900), 120)).toBe("s0");
  });

  it("marks the last heading at or above the reading line", () => {
    expect(activeSectionId(headings(-500, 120, 600), 120)).toBe("s1");
    expect(activeSectionId(headings(-900, -400, 80), 120)).toBe("s2");
  });

  it("stays on the last section once everything has scrolled past", () => {
    expect(activeSectionId(headings(-3000, -2000, -1000), 120)).toBe("s2");
  });
});
