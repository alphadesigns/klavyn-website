import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { logo } from "@/lib/logo";

const svg = readFileSync(new URL("../public/logo.svg", import.meta.url), "utf8");

describe("logo drawing data", () => {
  it("uses the same viewBox and tile radius as public/logo.svg", () => {
    expect(svg).toContain(`viewBox="${logo.viewBox}"`);
    expect(svg).toContain(`rx="${logo.tileRadius}"`);
  });

  it.each(Object.entries(logo.paths))("draws the %s path exactly as public/logo.svg does", (_name, d) => {
    expect(svg).toContain(`d="${d}"`);
  });

  it("uses only the brand colours", () => {
    const fills = [...svg.matchAll(/fill="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(fills)).toEqual(new Set(Object.values(logo.colors)));
  });
});
