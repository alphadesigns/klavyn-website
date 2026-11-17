import { existsSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppFigure, AppShot } from "@/components/AppShot";
import { allShown, heroShots, sharingShots, tourPhones } from "@/content/screenshots";

const PUBLIC_DIR = path.join(__dirname, "..", "public");

describe("screenshots", () => {
  it("points every entry at a file that exists", () => {
    for (const shot of allShown) {
      expect(existsSync(path.join(PUBLIC_DIR, shot.src)), shot.src).toBe(true);
    }
  });

  it("describes every picture for people who can't see it", () => {
    for (const shot of allShown) {
      expect(shot.alt.trim().length, shot.src).toBeGreaterThan(20);
      expect(shot.alt, shot.src).not.toMatch(/^(screenshot|image|picture) of/i);
    }
  });

  it("gives every picture a real size", () => {
    for (const shot of allShown) {
      expect(shot.width, shot.src).toBeGreaterThan(0);
      expect(shot.height, shot.src).toBeGreaterThan(0);
    }
  });

  it("shows the same entry in the light and dark hero", () => {
    expect(heroShots.light.src).toBe("/screenshots/desktop/secret.webp");
    expect(heroShots.dark.src).toBe("/screenshots/desktop/secret-dark.webp");
  });

  it("shows sharing as three screens, each with a caption", () => {
    expect(sharingShots).toHaveLength(3);
    for (const item of [...sharingShots, ...tourPhones]) {
      expect(item.caption.trim(), item.shot.src).not.toBe("");
    }
  });
});

describe("AppShot", () => {
  it("frames the desktop app as a window and a phone app as a phone", () => {
    expect(renderToStaticMarkup(<AppShot shot={heroShots.light} sizes="100vw" />)).toContain("shot--desktop");
    expect(renderToStaticMarkup(<AppShot shot={tourPhones[0].shot} sizes="100vw" />)).toContain("shot--phone");
  });

  it("carries the description and the size onto the image", () => {
    const html = renderToStaticMarkup(<AppShot shot={heroShots.light} sizes="100vw" />);
    expect(html).toContain('width="2080"');
    expect(html).toContain('height="1400"');
    expect(html).toContain("The Klavyn desktop app.");
  });

  it("puts the caption under the picture", () => {
    const html = renderToStaticMarkup(<AppFigure item={sharingShots[0]} sizes="100vw" />);
    expect(html).toContain("<figcaption>You enter their email.</figcaption>");
  });
});
