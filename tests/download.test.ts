import { describe, expect, it } from "vitest";
import {
  STATUS_LABELS,
  availablePlatforms,
  listNames,
  platforms,
  releasesUrl,
  type Platform,
} from "@/content/download";
import { faq, platformsAnswer } from "@/content/faq";
import { softwareApplicationJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";

const platform = (name: string, status: Platform["status"]): Platform => ({
  name,
  status,
  file: "file",
  firstLaunch: ["step"],
});

describe("listNames", () => {
  it("reads like a sentence for every length", () => {
    expect(listNames([])).toBe("");
    expect(listNames(["macOS"])).toBe("macOS");
    expect(listNames(["macOS", "Android"])).toBe("macOS and Android");
    expect(listNames(["macOS", "Windows", "Android"])).toBe("macOS, Windows and Android");
  });
});

describe("platforms", () => {
  it("gives every platform a file and at least one first-launch step", () => {
    for (const p of platforms) {
      expect(p.file.trim(), p.name).not.toBe("");
      expect(p.firstLaunch.length, p.name).toBeGreaterThan(0);
      expect(STATUS_LABELS[p.status], p.name).toBeTruthy();
    }
  });

  it("names each platform once", () => {
    const names = platforms.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("matches the assets attached to the current release", () => {
    // 0.1.3 ships a .dmg and an .apk. Update this with the data when a
    // release adds a platform, so the site and the release can't drift apart.
    expect(availablePlatforms().map((p) => p.name)).toEqual(["macOS", "Android"]);
  });

  it("links to the release list, which includes pre-releases", () => {
    expect(releasesUrl).toBe(`${site.repoUrl}/releases`);
    expect(releasesUrl).not.toMatch(/\/latest$/);
  });
});

describe("structured data", () => {
  it("lists only platforms with an installer", () => {
    const data = softwareApplicationJsonLd();
    const listed = data.operatingSystem.split(", ");
    expect(listed).toEqual(availablePlatforms().map((p) => p.name));
    for (const p of platforms.filter((p) => p.status !== "available")) {
      expect(listed, p.name).not.toContain(p.name);
    }
    expect(data.downloadUrl).toBe(releasesUrl);
  });
});

describe("platformsAnswer", () => {
  it("states each group by its status", () => {
    const answer = platformsAnswer([
      platform("macOS", "available"),
      platform("Windows", "next-release"),
      platform("iOS", "not-distributed"),
    ]);
    expect(answer).toContain("Installers for macOS are on the releases page today.");
    expect(answer).toContain("Windows builds come with the next release.");
    expect(answer).toContain("iOS isn’t distributed yet");
  });

  it("drops sentences for empty groups instead of leaving gaps", () => {
    const answer = platformsAnswer([platform("macOS", "available"), platform("Linux", "available")]);
    expect(answer).toContain("Installers for macOS and Linux");
    expect(answer).not.toContain("next release");
    expect(answer).not.toContain("isn’t distributed");
    expect(answer).not.toMatch(/\s{2,}/);
  });

  it("says so plainly when nothing is installable", () => {
    expect(platformsAnswer([platform("Windows", "next-release")])).toMatch(/^There’s no installer yet/);
  });

  it("is what the FAQ shows", () => {
    const item = faq.find((f) => f.question === "Which platforms does it run on?");
    expect(item?.answer).toBe(platformsAnswer());
  });
});

describe("copy rules", () => {
  // From the campaign's voice rules: the app says "passphrase", and the
  // server can see secret names, so "zero-knowledge" would overclaim.
  it("never uses words the product can't back", () => {
    const text = JSON.stringify({ faq, site });
    expect(text).not.toMatch(/master password/i);
    expect(text).not.toMatch(/zero-knowledge/i);
  });
});
