import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageToc } from "@/components/PageToc";
import { ArrowRightIcon } from "@/components/icons";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { tocFromSections } from "@/lib/toc";

export const metadata = pageMetadata({
  title: "Security model: how the encryption works",
  description:
    "How CredVault keeps your server from reading your passwords: Argon2id key stretching, a separate AES-256-GCM key per secret, X25519 sharing and key fingerprints.",
  path: "/security",
});

const layers = [
  {
    tag: "Argon2id",
    title: "Your passphrase becomes a key on your device",
    body: "Your passphrase is stretched into a master key locally. Two sub-keys come from it: a login credential (hashed again by the server) and an encryption key that never leaves your device.",
  },
  {
    tag: "Per-server",
    title: "Your login is bound to the server’s address",
    body: "The same email and passphrase produce a different credential on every server, so one operator can’t replay what you send to another.",
  },
  {
    tag: "X25519",
    title: "Every account has a key pair",
    body: "The private key is encrypted with your encryption key and stored on the server, so you can sign in from a new device and recover it.",
  },
  {
    tag: "AES-256-GCM",
    title: "Every secret has its own random key",
    body: "Username, password, URL, notes and custom fields are encrypted as one blob, so the server can’t even tell which fields a secret has.",
  },
  {
    tag: "Key wrap",
    title: "That key is wrapped once per reader",
    body: "Your copy is wrapped under a key derived from your master key. Each person you share with gets a copy sealed to their public key.",
  },
];

/** Section headings, in page order; also the "On this page" list. */
const SECTIONS = {
  layers: "Five layers between your server and your secrets",
  names: "What stays readable, and why",
  revoking: "Revoking access for real",
  fingerprints: "Fingerprints stop a malicious server",
  google: "Optional Google sign-in",
  versions: "Formats that refuse, not guess",
  limits: "Limits worth knowing",
} as const;

const toc = tocFromSections(SECTIONS);

export default function SecurityPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Breadcrumb trail={[{ name: "Home", path: "/" }, { name: "Security", path: "/security" }]} />
          <span className="eyebrow">Security model</span>
          <h1>A server that stores your vault and can’t read it</h1>
          <p className="section-lede">
            {site.name} is designed so that whoever runs the server, including
            you, never holds anything that could decrypt a password. Here is how,
            and where the limits are.
          </p>
        </div>
      </section>

      <div className="container doc-layout">
        <article className="prose">
          <h2 id="layers">{SECTIONS.layers}</h2>
          <ol className="layers">
            {layers.map((layer) => (
              <li key={layer.title} className="layer">
                <span className="layer__tag">{layer.tag}</span>
                <div>
                  <h3>{layer.title}</h3>
                  <p>{layer.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <h2 id="names">{SECTIONS.names}</h2>
          <p>
            Only each secret’s <strong>name</strong> is stored in plaintext,
            so lists and invites can display it. The name is authenticated as
            associated data, so the server can’t present one secret’s
            contents under another secret’s name.
          </p>
          <p>
            The operator can also see who shares with whom. They can’t alter,
            relabel or replace a secret you own.
          </p>

          <h2 id="revoking">{SECTIONS.revoking}</h2>
          <p>
            When you remove someone, {site.name} generates a new key,
            re-encrypts the secret and re-wraps it for everyone who still has
            access. A revoked person who kept the old key can’t read anything
            you change afterwards. Pending invites are cancelled too, because they
            carried the old key.
          </p>
          <p>
            Every rotation increments a key version. A device still holding an
            old key gets a conflict instead of quietly writing under it.
          </p>

          <h2 id="fingerprints">{SECTIONS.fingerprints}</h2>
          <p>
            Public keys come from the server, so a compromised server could hand
            you its own key instead of your friend’s. To close that gap, the
            app shows a short fingerprint of every key:
          </p>
          <ul>
            <li>Your own fingerprint is in the app header after you sign in.</li>
            <li>
              To share with someone the first time, you enter their fingerprint
              with their email. They read it out to you over a channel that
              isn’t the server.
            </li>
            <li>
              The app remembers keys it has confirmed. If the server later offers
              a different key for that person, sharing stops and tells you to
              get their current fingerprint directly.
            </li>
          </ul>
          <p>
            Because the fingerprint is required up front, the server also
            can’t be used to discover who has an account: a wrong fingerprint,
            a wrong address and an unregistered address all get the same answer.
          </p>

          <h2 id="google">{SECTIONS.google}</h2>
          <p>
            Operators can enable Sign in with Google. Google proves who you are,
            but it can’t produce key material: you still enter your master
            password, and the vault key is still derived from it on your device.
          </p>
          <p>
            The cost: someone who takes over your Google account can reach the
            server as you and see secret names, sharing and ciphertext. They
            still can’t read a single secret. It’s off unless the operator
            turns it on.
          </p>

          <h2 id="versions">{SECTIONS.versions}</h2>
          <p>
            The protocol, the encryption scheme and the field layout each carry a
            version number. A build reads its own formats and refuses the rest by
            name, so it can’t be walked back to a weaker scheme, and it
            won’t silently drop a field it doesn’t recognise and save the
            secret back.
          </p>

          <h2 id="limits">{SECTIONS.limits}</h2>
          <ul>
            <li>
              <strong>There is no password recovery.</strong> Not by the operator,
              not by Google, not by anyone. You can change your passphrase while
              you still know it, and every key is re-wrapped in one step.
            </li>
            <li>
              <strong>Moving a server to a new domain invalidates logins,</strong>{" "}
              because credentials are bound to the address. Vaults still decrypt,
              but accounts must be created again. Pick the address before you
              invite people.
            </li>
            <li>
              <strong>HTTPS is required</strong> for any server that isn’t on
              your own machine. The app refuses plain HTTP except to localhost.
            </li>
            <li>
              <strong>For a secret shared with you,</strong> a malicious operator
              could show you fabricated contents. They can’t learn the real
              ones, and you can’t write to it, so nothing leaks.
            </li>
          </ul>
          <p>
            The full design, including every edge case, is in the{" "}
            <a href={`${site.repoUrl}#how-the-security-works`}>project README</a>.
            The code is open for review.
          </p>

          <div className="btn-row" style={{ marginTop: "var(--space-7)" }}>
            <Link href="/self-host" className="btn btn--primary">
              Host your own vault
              <ArrowRightIcon />
            </Link>
            <a href={site.repoUrl} className="btn btn--secondary">
              Read the source
            </a>
          </div>
        </article>
        <PageToc sections={toc} />
      </div>
    </>
  );
}
