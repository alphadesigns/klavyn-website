import { describe, expect, it } from "vitest";
import { SCRAMBLE_GLYPHS, scrambleFrame } from "@/lib/scramble";

const zero = () => 0; // always picks the first glyph

describe("scrambleFrame", () => {
  it("shows the source at the start and the target at the end", () => {
    expect(scrambleFrame("hello", "world", 0)).toBe("hello");
    expect(scrambleFrame("hello", "world", 1)).toBe("world");
  });

  it("clamps progress outside 0 to 1, and treats NaN as the start", () => {
    expect(scrambleFrame("hello", "world", -2)).toBe("hello");
    expect(scrambleFrame("hello", "world", 5)).toBe("world");
    expect(scrambleFrame("hello", "world", Number.NaN)).toBe("hello");
  });

  it("resolves left to right with a noise band at the boundary", () => {
    // length 8, band 4: progress 0.5 resolves floor(0.5 * 12) = 6 characters.
    const frame = scrambleFrame("aaaaaaaa", "bbbbbbbb", 0.5, zero);
    expect(frame).toBe("bbbbbb" + SCRAMBLE_GLYPHS[0].repeat(2));
  });

  it("keeps the untouched tail on the source text", () => {
    const frame = scrambleFrame("aaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbb", 0.1, zero);
    expect(frame.startsWith("bb")).toBe(true);
    expect(frame.endsWith("aaaaaaaaaa")).toBe(true);
    expect(frame).toHaveLength(16);
  });

  it("only uses glyphs from the set for noise", () => {
    const frame = scrambleFrame("", "", 0.5, () => 0.999);
    expect(frame).toBe("");
    const noisy = scrambleFrame("xxxx", "yyyy", 0.1, () => 0.999);
    for (const ch of noisy) expect("xy" + SCRAMBLE_GLYPHS).toContain(ch);
  });

  it("handles strings of different lengths", () => {
    expect(scrambleFrame("short", "a longer target", 1)).toBe("a longer target");
    expect(scrambleFrame("a longer source", "tiny", 0.999, zero)).toMatch(/^tiny/);
  });
});
