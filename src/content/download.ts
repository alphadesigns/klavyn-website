import { site } from "@/lib/site";

/**
 * What a visitor can install today, per platform. The download section, the
 * hero, the FAQ and the SoftwareApplication structured data all read this
 * list, so publishing a new platform is a one-line change here (flip its
 * `status`) and nothing on the site can claim a platform that has no build.
 *
 * Facts come from the Klavyn release notes (.github/release-notes.md) and
 * the assets attached to the latest GitHub release.
 */
export type PlatformStatus = "available" | "next-release" | "not-distributed";

export type Platform = {
  /** Display name, also used in structured data's operatingSystem. */
  name: string;
  status: PlatformStatus;
  /** The file to look for on the release page. */
  file: string;
  /** What to do the first time, in order. Unsigned builds need these. */
  firstLaunch: readonly string[];
};

export const platforms: readonly Platform[] = [
  {
    name: "macOS",
    status: "available",
    file: "Universal .dmg (Apple silicon and Intel)",
    firstLaunch: [
      "Open the .dmg and drag Klavyn to Applications.",
      "The first launch is refused because the app isn’t signed yet. Open System Settings → Privacy & Security and choose Open Anyway.",
    ],
  },
  {
    name: "Android",
    status: "available",
    file: "arm64 .apk",
    firstLaunch: [
      "Download the .apk on your phone and open it.",
      "Allow installs from this source when Android asks. The build is signed with a test key, so it won’t update itself.",
    ],
  },
  {
    name: "Windows",
    status: "next-release",
    file: "Installer",
    firstLaunch: ["SmartScreen will warn about an unsigned installer: choose More info, then Run anyway."],
  },
  {
    name: "Linux",
    status: "next-release",
    file: ".deb and .AppImage",
    firstLaunch: ["Install the .deb with apt, or make the .AppImage executable and run it."],
  },
  {
    name: "iOS",
    status: "not-distributed",
    file: "Simulator builds only",
    firstLaunch: ["There’s no TestFlight or App Store build yet. It can be built and run in the iOS simulator from source."],
  },
];

/** How each status reads on a platform card. */
export const STATUS_LABELS: Record<PlatformStatus, string> = {
  available: "Download now",
  "next-release": "Next release",
  "not-distributed": "Not distributed yet",
};

/**
 * The release list, not /releases/latest: every build is still a GitHub
 * pre-release, and /latest skips pre-releases, so it would 404.
 */
export const releasesUrl = `${site.repoUrl}/releases`;

/** Platforms with an installer attached to the current release. */
export function availablePlatforms(list: readonly Platform[] = platforms): Platform[] {
  return list.filter((platform) => platform.status === "available");
}

/**
 * Joins names the way a sentence would: "macOS", "macOS and Android",
 * "macOS, Windows and Android". Empty input gives an empty string.
 */
export function listNames(names: readonly string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
