import { availablePlatforms, listNames, platforms, type Platform } from "@/content/download";

/**
 * Questions shown on the home page and emitted as FAQPage structured data.
 * One source for both, so the markup Google reads always matches what a
 * visitor sees (a mismatch makes the rich result ineligible).
 */
export type FaqItem = { question: string; answer: string };

/**
 * The platforms answer, built from the download data so it changes the
 * moment a platform's status does.
 */
export function platformsAnswer(list: readonly Platform[] = platforms): string {
  const names = (status: Platform["status"]) =>
    listNames(list.filter((platform) => platform.status === status).map((platform) => platform.name));
  const installable = listNames(availablePlatforms(list).map((platform) => platform.name));
  const onTestFlight = names("testflight");
  const upcoming = names("next-release");
  const unreleased = names("not-distributed");

  const sentences = [
    installable
      ? `Installers for ${installable} are on the releases page today.`
      : "There’s no installer yet; build the app from source.",
  ];
  if (onTestFlight) sentences.push(`${onTestFlight} is in beta on TestFlight; the invitation is in the download section.`);
  if (upcoming) sentences.push(`${upcoming} builds come with the next release.`);
  if (unreleased) sentences.push(`${unreleased} isn’t distributed yet but builds from source.`);
  sentences.push(
    "Each platform gets its own native look. The server is a single Rust binary, or a Docker Compose stack with automatic HTTPS.",
  );
  return sentences.join(" ");
}

export const faq: FaqItem[] = [
  {
    question: "Do I need to be technical to use it?",
    answer:
      "Not to use it. Someone has to set up a server once, and that takes some comfort with servers; the setup guide walks through it. Everyone else installs the app, enters the server’s address and chooses a passphrase. To look around first, use the test server the app suggests, with made-up passwords.",
  },
  {
    question: "Can whoever runs the server read my passwords?",
    answer:
      "No. Your device turns your passphrase into a key, and every password is locked with a key of its own before it leaves. The server stores that scrambled data and the name you gave each password. Whoever runs it can see those names and who shares with whom, never what’s inside. The security page names the exact methods.",
  },
  {
    question: "What happens if I forget my passphrase?",
    answer:
      "Your vault can’t be recovered, by you, the person running the server or anyone else. That’s the price of a server that holds nothing it could unlock. You can change your passphrase at any time while you still know it.",
  },
  {
    question: "Can I try it without running a server?",
    answer:
      "Yes. During pre-release the app comes pre-filled with a test server run by the maintainer, so you can create an account straight away. Use made-up passwords only: it’s for trying the app, not for real ones. Type your own server’s address instead whenever you like; the app remembers it.",
  },
  {
    question: "How do I share a password with someone?",
    answer:
      "They create an account on the same server. You open the password, enter their email and the short code (a key fingerprint) they read out to you over a call or in person, and send the invite. They get that one password and nothing else. You can take access back at any time, and from then on they can’t read later changes.",
  },
  {
    question: "Why do I have to confirm a code when I share?",
    answer:
      "The app gets the other person’s key from the server. A tampered server could hand you its own key instead of your friend’s. Checking the code with them directly, away from the app, means you only ever share with the person you meant to. After the first time, Klavyn remembers it.",
  },
  {
    question: "Which platforms does it run on?",
    answer: platformsAnswer(),
  },
  {
    question: "How much does it cost?",
    answer:
      "Nothing. Klavyn is free and open source under the MIT license. The only cost is the server it runs on, and a small rented one is enough.",
  },
  {
    question: "Is it ready for my real passwords?",
    answer:
      "Not yet. Klavyn is pre-release: the way data is stored can still change, and nothing is carried over between versions. Try it and report problems, but keep your current password manager until a stable release.",
  },
];
