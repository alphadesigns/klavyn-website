import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import {
  ArrowRightIcon,
  CheckIcon,
  ClipboardIcon,
  CodeIcon,
  DevicesIcon,
  DownloadIcon,
  EyeIcon,
  FingerprintIcon,
  GithubIcon,
  KeyIcon,
  LaptopIcon,
  LockIcon,
  PlusIcon,
  RotateIcon,
  ServerIcon,
  ShareIcon,
  ShieldIcon,
} from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { SecretStory } from "@/components/SecretStory";
import { STATUS_LABELS, availablePlatforms, listNames, platforms, releasesUrl } from "@/content/download";
import { faq } from "@/content/faq";
import { selfHostCommands } from "@/content/self-host";
import { faqJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProofStrip />
      <SecretStory />
      <ServerSees />
      <Features />
      <Sharing />
      <Download />
      <SelfHost />
      <Compare />
      <Tradeoffs />
      <Faq />
      <ClosingCta />
      <JsonLd data={faqJsonLd(faq)} />
    </>
  );
}

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero__grid">
        <div>
          <a href={site.repoUrl} className="hero__badge reveal">
            <span className="hero__badge-tag">v{site.version}</span>
            MIT-licensed source on GitHub
            <ArrowRightIcon width={14} height={14} />
          </a>
          <h1 id="hero-title" className="hero__title reveal reveal--2">
            Your passwords. Your server. <em>Nobody else’s keys.</em>
          </h1>
          <p className="hero__lede reveal reveal--3">
            {site.name} is a password manager you host yourself. Every secret is
            encrypted on your device before it leaves, so the server only ever
            stores ciphertext. No vendor holds a copy of your vault, and no
            vendor breach can expose it.
          </p>
          <div className="btn-row reveal reveal--3">
            <Link href="/#download" className="btn btn--primary">
              <DownloadIcon />
              Download the app
            </Link>
            <Link href="/self-host" className="btn btn--secondary">
              Run your own server
            </Link>
          </div>
          <ul className="hero__meta" aria-label="At a glance">
            <li><CheckIcon /> Free and MIT-licensed</li>
            <li><CheckIcon /> {listNames(availablePlatforms().map((p) => p.name))} today</li>
            <li><CheckIcon /> One Rust binary or Docker</li>
          </ul>
        </div>
        <ProductMock />
      </div>
    </section>
  );
}

/**
 * A static picture of the app built in HTML, so it stays sharp, themes with
 * the page and costs no image request. Hidden from assistive tech: the
 * figcaption carries its meaning.
 */
function ProductMock() {
  const items = [
    { initial: "G", name: "GitHub", sub: "jo@studio.dev", active: true },
    { initial: "A", name: "AWS root", sub: "ops@studio.dev" },
    { initial: "S", name: "Stripe", sub: "billing@studio.dev" },
    { initial: "W", name: "Office Wi-Fi", sub: "Shared with 4" },
    { initial: "F", name: "Figma", sub: "design@studio.dev" },
  ];
  return (
    <figure className="mock reveal reveal--3" style={{ margin: 0 }}>
      <div aria-hidden="true">
        <div className="mock__window">
          <div className="mock__bar">
            <span className="mock__dot" />
            <span className="mock__dot" />
            <span className="mock__dot" />
            <span className="mock__fingerprint">Your key: 7F3A 91C2 E04B</span>
          </div>
          <div className="mock__body">
            <ul className="mock__list">
              {items.map((item) => (
                <li key={item.name} className="mock__item" data-active={item.active || undefined}>
                  <span className="mock__avatar">{item.initial}</span>
                  <span className="mock__item-text">
                    <span className="mock__item-name">{item.name}</span>
                    <span className="mock__item-sub">{item.sub}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mock__detail">
              <span className="mock__detail-title">GitHub</span>
              <div className="mock__field">
                <span className="mock__label">Username</span>
                <span className="mock__value">jo@studio.dev</span>
              </div>
              <div className="mock__field">
                <span className="mock__label">Password</span>
                <span className="mock__value mock__value--secret">••••••••••••••</span>
              </div>
              <div className="mock__field">
                <span className="mock__label">URL</span>
                <span className="mock__value">github.com</span>
              </div>
              <div className="mock__shared">
                Shared with <span className="mock__chip">sam@studio.dev</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mock__wire">
          <span className="mock__wire-label">{"// what the server stores"}</span>
          <span className="mock__wire-key">name</span>: &quot;GitHub&quot;
          <span className="mock__wire-cipher">
            <span className="mock__wire-key">blob</span>: &quot;q8Zt1v0Xa9LmR2cB7yJpE4kWfN6sHuD3…&quot;
          </span>
        </div>
      </div>
      <figcaption className="visually-hidden">
        The {site.name} desktop app showing a vault entry, next to the encrypted
        blob that is all the server receives for it.
      </figcaption>
    </figure>
  );
}

function ProofStrip() {
  const proof = [
    { value: "Argon2id", label: "password stretching" },
    { value: "AES-256-GCM", label: "a key per secret" },
    { value: "X25519", label: "sharing between people" },
    { value: "Rust", label: "core, server and app" },
  ];
  return (
    <section className="proof" aria-label="Built on">
      <div className="container">
        <ul className="proof__list">
          {proof.map((p) => (
            <li key={p.value} className="proof__item">
              <span className="proof__value">{p.value}</span>
              <span className="proof__label">{p.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ServerSees() {
  const device = [
    ["Your passphrase", "stretched into a key with Argon2id, never sent"],
    ["Usernames, passwords, notes and custom fields", "encrypted together before upload"],
    ["Your unlocked keys", "never leave the device in usable form"],
  ];
  const server = [
    ["The name of each secret", "so lists and invites can show it"],
    ["Who shares with whom", "needed to deliver invites"],
    ["Ciphertext it cannot open", "and can’t relabel or swap"],
  ];
  return (
    <section className="section" aria-labelledby="sees-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">What the server sees</span>
          <h2 id="sees-title" className="section-title">
            Your server holds the vault but can’t open it
          </h2>
          <p className="section-lede">
            Hosted password managers ask you to trust their servers. {site.name}{" "}
            is built so you don’t have to trust yours. Here’s exactly what
            lives where.
          </p>
        </div>
        <div className="sees">
          <div className="sees__card sees__card--device">
            <div className="sees__head">
              <span className="sees__icon"><LaptopIcon /></span>
              <h3>Only on your device</h3>
            </div>
            <ul className="sees__list">
              {device.map(([title, detail]) => (
                <li key={title}>
                  <LockIcon className="sees__yes" />
                  <span><strong>{title}</strong>, {detail}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="sees__card">
            <div className="sees__head">
              <span className="sees__icon"><ServerIcon /></span>
              <h3>What the server sees</h3>
            </div>
            <ul className="sees__list">
              {server.map(([title, detail]) => (
                <li key={title}>
                  <EyeIcon className="sees__no" />
                  <span><strong>{title}</strong>, {detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: ShareIcon,
      title: "Share one secret, not your vault",
      body: "Give a teammate the Wi-Fi password without giving them anything else. Each secret has its own key, wrapped separately for each person who can read it.",
    },
    {
      icon: RotateIcon,
      title: "Revoking actually revokes",
      body: "Remove someone and the secret is re-encrypted under a new key. Even if they saved the old one, they can’t read anything you change afterwards.",
    },
    {
      icon: FingerprintIcon,
      title: "No silent key swaps",
      body: "Confirm a short fingerprint once when you first share. A compromised server can’t slip in its own key, and Klavyn remembers the people you’ve verified.",
    },
    {
      icon: DevicesIcon,
      title: "At home on every platform",
      body: "One app, drawn in each platform’s own style: macOS, Windows 11, GNOME, iOS and Android, in light and dark. A real app, not a browser tab.",
    },
    {
      icon: KeyIcon,
      title: "Room for everything, and a generator",
      body: "Add up to 20 custom fields for PINs, recovery codes or account numbers, and hide any of them. Generate a 20-character password in one click.",
    },
    {
      icon: ClipboardIcon,
      title: "Copies that clean up after themselves",
      body: "Copied passwords and hidden fields clear from the clipboard after 30 seconds, or right away if you choose. Revealed values hide again on their own.",
    },
    {
      icon: ShieldIcon,
      title: "Control over your sessions",
      body: "Change your passphrase and every key is re-wrapped in one step. Lost a laptop? Sign out every other device from the one in your hand.",
    },
    {
      icon: ServerIcon,
      title: "Upgrades that refuse to guess",
      body: "The app checks what your server speaks before it sends anything, and every stored format carries a version. Anything unknown is refused, never misread.",
    },
    {
      icon: CodeIcon,
      title: "Small enough to read",
      body: "A Rust core shared by app and server, covered by unit and end-to-end tests. Small enough that you can read it yourself.",
    },
  ];
  return (
    <section id="features" className="section section--tint" aria-labelledby="features-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Features</span>
          <h2 id="features-title" className="section-title">
            Everything a password manager needs. Nothing it has to phone home for.
          </h2>
        </div>
        <div className="features">
          {features.map(({ icon: FeatureIcon, title, body }) => (
            <article key={title} className="feature">
              <span className="feature__icon"><FeatureIcon /></span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Sharing() {
  return (
    <section className="section" aria-labelledby="sharing-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Sharing</span>
          <h2 id="sharing-title" className="section-title">
            Share a password safely in three steps
          </h2>
          <p className="section-lede">
            No more pasting credentials into chat. The person you share with gets
            exactly one secret, encrypted to a key only they hold.
          </p>
        </div>
        <ol className="steps">
          <li className="step">
            <h3>They join your server</h3>
            <p>
              Your teammate installs the app and creates an account. Their app
              shows a short key fingerprint.
            </p>
          </li>
          <li className="step">
            <h3>You confirm their key</h3>
            <p>
              They read the fingerprint to you on a call or in person. You enter
              it with their email, once.
            </p>
          </li>
          <li className="step">
            <h3>They accept the invite</h3>
            <p>
              The secret appears in their vault. Revoke it whenever you like, and
              the key rotates automatically.
            </p>
          </li>
        </ol>
      </div>
    </section>
  );
}

/**
 * Every platform, with what a visitor can actually get today. Statuses come
 * from src/content/download.ts, so this section never offers a build that
 * isn't on the releases page.
 */
function Download() {
  return (
    <section id="download" className="section section--tint" aria-labelledby="download-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Download</span>
          <h2 id="download-title" className="section-title">
            Try it in a few minutes
          </h2>
          <p className="section-lede">
            Install the app and create an account on the test server it suggests,
            or point it at your own. Every build is free, and every build is
            pre-release: use test credentials until the stable release.
          </p>
        </div>
        <ul className="platforms">
          {platforms.map((platform) => (
            <li key={platform.name} className="platform" data-status={platform.status}>
              <div className="platform__head">
                <h3>{platform.name}</h3>
                <span className="platform__status">{STATUS_LABELS[platform.status]}</span>
              </div>
              <p className="platform__file">{platform.file}</p>
              <ol className="platform__steps">
                {platform.firstLaunch.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
        <div className="download-foot">
          <a href={releasesUrl} className="btn btn--primary">
            <DownloadIcon />
            Go to the releases page
          </a>
          <p>
            The installers aren’t code-signed yet, so each system warns once; the
            steps above get you past it. The app and the server must come from
            the same release.
          </p>
        </div>
      </div>
    </section>
  );
}

function SelfHost() {
  return (
    <section className="section" aria-labelledby="selfhost-title">
      <div className="container split">
        <div>
          <span className="eyebrow">Self-hosting</span>
          <h2 id="selfhost-title" className="section-title">
            Your own server, one command away
          </h2>
          <p className="section-lede">
            One Docker Compose file brings up the server behind Caddy with
            automatic HTTPS on a small VPS. Only ports 80 and 443 face the
            internet.
          </p>
          <ul className="checklist">
            <li><CheckIcon /> Automatic TLS certificates</li>
            <li><CheckIcon /> Registration by token, open or closed</li>
            <li><CheckIcon /> Login rate limiting built in</li>
            <li><CheckIcon /> SQLite storage with a backup script</li>
          </ul>
          <div className="btn-row">
            <Link href="/self-host" className="btn btn--primary">
              Read the setup guide
              <ArrowRightIcon />
            </Link>
          </div>
        </div>
        <CodeBlock title="Deploy" copyText={selfHostCommands.copy}>
          {selfHostCommands.render}
        </CodeBlock>
      </div>
    </section>
  );
}

function Compare() {
  const rows = [
    ["Where your vault lives", "The vendor’s cloud", "A server you control"],
    ["If the company is breached", "Your encrypted vault may be taken", "There’s no company holding it"],
    ["Price for a team of 10", "Billed per seat, every month", "Free. You pay only for the server"],
    ["Source code", "Varies by vendor", "Open, MIT-licensed"],
    ["If the product shuts down", "Export and migrate in a hurry", "Keep running what you have"],
  ];
  return (
    <section className="section section--tint" aria-labelledby="compare-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Why self-host</span>
          <h2 id="compare-title" className="section-title">
            Take the biggest target off the board
          </h2>
          <p className="section-lede">
            A cloud password manager is one of the most valuable targets on the
            internet. A vault on your own server isn’t.
          </p>
        </div>
        <div className="compare-wrap" role="region" aria-labelledby="compare-title" tabIndex={0}>
          <table className="compare">
            <thead>
              <tr>
                <td />
                <th scope="col">Typical hosted manager</th>
                <th scope="col">{site.name}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, hosted, ours]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td>{hosted}</td>
                  <td>{ours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Tradeoffs() {
  return (
    <section className="section" aria-labelledby="tradeoffs-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Straight talk</span>
          <h2 id="tradeoffs-title" className="section-title">
            What you give up, so nobody else can get in
          </h2>
          <p className="section-lede">
            Real security comes with trade-offs. We’d rather you hear them now.
          </p>
        </div>
        <div className="tradeoffs">
          <article className="tradeoff">
            <h3>Forget your passphrase, lose your vault</h3>
            <p>
              No reset link, no support ticket, no backdoor. If anyone could
              recover it for you, an attacker could too.
            </p>
          </article>
          <article className="tradeoff">
            <h3>You run the server</h3>
            <p>
              Updates and backups are yours to schedule. The guide covers both,
              and the server is a single small binary.
            </p>
          </article>
          <article className="tradeoff">
            <h3>It’s still pre-release</h3>
            <p>
              Storage formats may change between builds and the installers
              aren’t signed yet. Try it with test credentials today, and move
              your real passwords in at the stable release.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="section section--tint" aria-labelledby="faq-title">
      <div className="container">
        <div className="section-head section-head--center">
          <span className="eyebrow">FAQ</span>
          <h2 id="faq-title" className="section-title">Questions, answered</h2>
        </div>
        <div className="faq">
          {faq.map(({ question, answer }) => (
            <details key={question} className="faq__item">
              <summary>
                {question}
                <PlusIcon />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="section" aria-labelledby="cta-title">
      <div className="container">
        <div className="cta">
          <h2 id="cta-title">Own your passwords again</h2>
          <p>
            Free, open source and yours to run. Star the repository to follow
            along to the stable release.
          </p>
          <div className="btn-row">
            <Link href="/#download" className="btn btn--primary">
              <DownloadIcon />
              Download the app
            </Link>
            <a href={site.repoUrl} className="btn btn--secondary">
              <GithubIcon />
              Star on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
