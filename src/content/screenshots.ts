/**
 * The real app screenshots the site shows, with the text that describes each.
 * Files live in public/screenshots/<platform>/; tests/screenshots.test.ts
 * checks that every entry here points at a file that exists.
 *
 * All of them show made-up accounts on example.com addresses.
 *
 * The files are lossless WebP: pixel for pixel the PNGs they were captured
 * as, at under a third of the size. The desktop ones carry a Display P3
 * colour profile, which has to survive any re-export or their colours shift.
 * To add one: cwebp -lossless -exact -z 9 -metadata icc in.png -o out.webp
 */
export type Platform = "desktop" | "ios" | "android";

export type Screenshot = {
  /** Path from the site root. */
  src: string;
  /** Pixel size of the file, so the page reserves the right space before it loads. */
  width: number;
  height: number;
  /** What the picture shows, for people who can't see it. */
  alt: string;
  platform: Platform;
};

/** Every screenshot of a platform was captured at one size. */
const PLATFORM_SIZE: Record<Platform, { width: number; height: number }> = {
  desktop: { width: 2080, height: 1400 },
  ios: { width: 1206, height: 2622 },
  android: { width: 1280, height: 2856 },
};

function shot(platform: Platform, name: string, alt: string): Screenshot {
  return { src: `/screenshots/${platform}/${name}.webp`, ...PLATFORM_SIZE[platform], alt, platform };
}

/** A screenshot with the sentence shown under it. */
export type CaptionedScreenshot = { shot: Screenshot; caption: string };

/** The hero picture, in the light and dark themes. */
export const heroShots = {
  light: shot(
    "desktop",
    "secret",
    "The Klavyn desktop app. A list of saved passwords on the left, grouped under Home, Money and Work. The Streaming entry is open, showing its username, a hidden password, web address, notes and that it is shared with sam@example.com.",
  ),
  dark: shot("desktop", "secret-dark", "The same Streaming entry in the Klavyn desktop app, in the dark theme."),
} as const;

/** "A look inside": the desktop app first, then the phone apps. */
export const tourDesktop: CaptionedScreenshot = {
  shot: shot(
    "desktop",
    "secret-shared",
    "The Home Wi-Fi entry in the desktop app. Under Sharing, sam@example.com can view it and an invite to maya@example.com is pending.",
  ),
  caption: "On a Mac. Each password shows who can see it, and who you’ve invited.",
};

export const tourPhones: readonly CaptionedScreenshot[] = [
  {
    shot: shot("ios", "vault", "The vault on an iPhone: passwords listed under Home, Money and Work, each with a copy button."),
    caption: "On an iPhone. Everything in one list, grouped your way.",
  },
  {
    shot: shot(
      "ios",
      "copied",
      "An entry on an iPhone with its password shown and a countdown. A message reads: Password copied, clipboard clears in 30 seconds.",
    ),
    caption: "Copy a password and the clipboard clears itself after 30 seconds.",
  },
  {
    shot: shot("android", "vault-dark", "The vault on an Android phone in the dark theme, with a banner saying one invitation is waiting."),
    caption: "On Android, in dark. Each system gets its own look.",
  },
  {
    shot: shot(
      "android",
      "locked",
      "The lock screen on an Android phone. It reads Vault locked and asks for the vault passphrase, with an Unlock vault button.",
    ),
    caption: "It locks itself. Only your passphrase opens it again.",
  },
];

/** The three screens of sharing one password, in the order they happen. */
export const sharingShots: readonly CaptionedScreenshot[] = [
  {
    shot: shot("ios", "invite", "The Invite people screen on an iPhone, with maya@example.com typed into the email field."),
    caption: "You enter their email.",
  },
  {
    shot: shot(
      "ios",
      "invite-check-key",
      "The Check their keys screen on an iPhone. It asks for the fingerprint of maya@example.com before the invite can go ahead.",
    ),
    caption: "You type the code they read out to you.",
  },
  {
    shot: shot(
      "ios",
      "shared",
      "The Shared screen on an iPhone. An invitation to Analytics dashboard from maya@example.com has Decline and Accept buttons.",
    ),
    caption: "They accept, and it appears in their vault.",
  },
];

/** The fingerprint check, shown beside its explanation on the security page. */
export const fingerprintShot: CaptionedScreenshot = {
  shot: sharingShots[1].shot,
  caption: "The app won’t send an invite until the fingerprint you typed matches.",
};

/** Everything above, for checks that run over all of it. */
export const allShown: readonly Screenshot[] = [
  heroShots.light,
  heroShots.dark,
  tourDesktop.shot,
  ...tourPhones.map((item) => item.shot),
  ...sharingShots.map((item) => item.shot),
  fingerprintShot.shot,
];
