import { describe, expect, it } from "vitest";
import {
  STATUS_LABELS,
  TESTFLIGHT_URL,
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

  it("offers iOS through its TestFlight invitation, not as an installer", () => {
    const ios = platforms.find((p) => p.name === "iOS");
    expect(ios?.status).toBe("testflight");
    expect(ios?.link).toBe(TESTFLIGHT_URL);
    expect(TESTFLIGHT_URL).toMatch(/^https:\/\/testflight\.apple\.com\/join\/[A-Za-z0-9]+$/);
    expect(availablePlatforms().map((p) => p.name)).not.toContain("iOS");
  });

  it("gives every TestFlight platform somewhere to go", () => {
    for (const p of platforms.filter((p) => p.status === "testflight")) {
      expect(p.link, p.name).toBeTruthy();
    }
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
      platform("iOS", "testflight"),
      platform("visionOS", "not-distributed"),
    ]);
    expect(answer).toContain("Installers for macOS are on the releases page today.");
    expect(answer).toContain("Windows builds come with the next release.");
    expect(answer).toContain("iOS is in beta on TestFlight");
    expect(answer).toContain("visionOS isn’t distributed yet");
  });

  it("drops sentences for empty groups instead of leaving gaps", () => {
    const answer = platformsAnswer([platform("macOS", "available"), platform("Linux", "available")]);
    expect(answer).toContain("Installers for macOS and Linux");
    expect(answer).not.toContain("next release");
    expect(answer).not.toContain("isn’t distributed");
    expect(answer).not.toContain("TestFlight");
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

describe("plain language", () => {
  // The FAQ is read by people who are not developers. The names of the
  // algorithms live on the security page and in the home page's "built on"
  // list, not in answers a first-time visitor has to get through.
  const JARGON = /Argon2id|AES-256|X25519|ciphertext|\bVPS\b|\bbinary\b|\bTLS\b|\bblob\b/i;

  it("keeps the FAQ free of cryptography and hosting jargon", () => {
    for (const { question, answer } of faq.filter((f) => f.answer !== platformsAnswer())) {
      expect(question, question).not.toMatch(JARGON);
      expect(answer, question).not.toMatch(JARGON);
    }
    expect(site.description).not.toMatch(JARGON);
  });

  it("opens with whether a non-technical person can use it", () => {
    expect(faq[0].question).toBe("Do I need to be technical to use it?");
    expect(faq[0].answer).toMatch(/^Not to use it\./);
  });

  it("asks each question once", () => {
    const questions = faq.map((f) => f.question);
    expect(new Set(questions).size).toBe(questions.length);
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
