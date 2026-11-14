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
  const upcoming = names("next-release");
  const unreleased = names("not-distributed");

  const sentences = [
    installable
      ? `Installers for ${installable} are on the releases page today.`
      : "There’s no installer yet; build the app from source.",
  ];
  if (upcoming) sentences.push(`${upcoming} builds come with the next release.`);
  if (unreleased) sentences.push(`${unreleased} isn’t distributed yet but builds from source.`);
  sentences.push(
    "Each platform gets its own native look. The server is a single Rust binary, or a Docker Compose stack with automatic HTTPS.",
  );
  return sentences.join(" ");
}

export const faq: FaqItem[] = [
  {
    question: "Can whoever runs the server read my passwords?",
    answer:
      "No. Your passphrase is stretched into a key on your device with Argon2id, and every secret is encrypted with its own AES-256-GCM key before it leaves. The server stores ciphertext and the name you gave each secret. The operator can see secret names and who shares with whom, never what’s inside.",
  },
  {
    question: "What happens if I forget my passphrase?",
    answer:
      "Your vault can’t be recovered, by you, the operator or anyone else. That’s the price of a server that holds nothing it could decrypt. You can change your passphrase at any time while you still know it.",
  },
  {
    question: "Can I try it without running a server?",
    answer:
      "Yes. During pre-release the app comes pre-filled with a test server run by the maintainer, so you can create an account straight away. Use test credentials only: it’s for trying the app, not for real passwords. Type your own server’s address instead whenever you like; the app remembers it.",
  },
  {
    question: "How do I share a password with someone?",
    answer:
      "They create an account on the same server. You open the secret, enter their email and the key fingerprint they read out to you over a call or in person, and send the invite. They get that one secret and nothing else. You can revoke access at any time, and revoking rotates the key so they can’t read later changes.",
  },
  {
    question: "Why do I have to confirm a fingerprint when I share?",
    answer:
      "Public keys come from the server. A compromised server could hand you its own key instead of your friend’s. Checking the fingerprint over another channel means you only ever encrypt to the key you expected. After the first time, Klavyn remembers it.",
  },
  {
    question: "Which platforms does it run on?",
    answer: platformsAnswer(),
  },
  {
    question: "How much does it cost?",
    answer:
      "Nothing. Klavyn is free and MIT-licensed. You pay only for the server you run it on, and a small VPS is enough.",
  },
  {
    question: "Is it ready for production?",
    answer:
      "Not yet. Klavyn is pre-release: storage formats aren’t frozen and nothing is migrated between builds. Try it, read the code and report issues, but keep your current password manager until a stable release.",
  },
];
