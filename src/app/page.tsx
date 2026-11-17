import { Sentences } from "@/components/Sentences";
import Link from "next/link";
import { AppFigure, AppShot } from "@/components/AppShot";
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
import { PlatformStatus } from "@/components/PlatformStatus";
import { SecretStory } from "@/components/SecretStory";
import { availablePlatforms, listNames, platforms, releasesUrl } from "@/content/download";
import { faq } from "@/content/faq";
import { heroShots, sharingShots, tourDesktop, tourPhones } from "@/content/screenshots";
import { selfHostCommands } from "@/content/self-host";
import { faqJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";

/** The entry open in the hero screenshot; SecretStory follows the same one. */
const MOCK_SECRET_NAME = "Streaming";

/** The hero picture fills the page on a phone and under half of it on a desktop. */
const HERO_SHOT_SIZES = "(min-width: 64rem) 560px, 92vw";

/** The names a technical reader looks for, kept out of the everyday copy. */
const BUILT_ON = [
  { value: "Argon2id", label: "turns your passphrase into a key" },
  { value: "AES-256-GCM", label: "a separate key for every secret" },
  { value: "X25519", label: "sharing between people" },
  { value: "Rust", label: "core, server and app" },
] as const;

export default function HomePage() {
  return (
    <>
      <Hero />
      <Promises />
      <WhoItsFor />
      <Tour />
      <SecretStory />
      <ServerSees />
      <Features />
      <Sharing />
      <Download />
      <Compare />
      <Tradeoffs />
      <SelfHost />
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
          <h1 id="hero-title" className="hero__title reveal reveal--2">
            Passwords <em>only you</em> can read.
          </h1>
          <Sentences className="hero__lede reveal reveal--3" text={`${site.name} is a password manager for you, your family or your team. Every password is locked on your device before it is saved, and it is kept on a server you or someone you trust runs, not in a company’s cloud. Even that server can’t read it.`} />
          <div className="btn-row reveal reveal--3">
            <Link href="/#download" className="btn btn--primary">
              <DownloadIcon />
              Download the app
            </Link>
            <Link href="/#how-it-works" className="btn btn--secondary">
              See how it works
            </Link>
          </div>
          <ul className="hero__meta" aria-label="At a glance">
            <li><CheckIcon /> Free, with no subscription</li>
            <li><CheckIcon /> {listNames(availablePlatforms().map((p) => p.name))} today</li>
            <li><CheckIcon /> Pre-release: try it with made-up passwords</li>
          </ul>
        </div>
        <ProductShot />
      </div>
    </section>
  );
}

/**
 * The real desktop app, in whichever theme the page is in, with the one thing
 * a screenshot can't show laid over its corner: what the server holds for the
 * entry that is open.
 */
function ProductShot() {
  return (
    <figure className="mock reveal reveal--3" style={{ margin: 0 }}>
      <div className="mock__window">
        <AppShot shot={heroShots.light} sizes={HERO_SHOT_SIZES} priority className="shot--bare shot--light" />
        <AppShot shot={heroShots.dark} sizes={HERO_SHOT_SIZES} className="shot--bare shot--dark" />
      </div>
      <div className="mock__wire" aria-hidden="true">
        <span className="mock__wire-label">What the server stores</span>
        <span className="mock__wire-key">name</span>: &quot;{MOCK_SECRET_NAME}&quot;
        <span className="mock__wire-cipher">
          <span className="mock__wire-key">contents</span>: &quot;q8Zt1v0Xa9LmR2cB7yJpE4kWfN6sHuD3…&quot;
        </span>
      </div>
      <figcaption className="visually-hidden">
        For this entry the server stores only its name and scrambled contents
        it cannot read.
      </figcaption>
    </figure>
  );
}

/**
 * Real screenshots early on, so a visitor sees the product before reading
 * how it works: the desktop app wide, then four phone screens that each back
 * one claim made further down the page.
 */
function Tour() {
  return (
    <section id="tour" className="section section--tint" aria-labelledby="tour-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">A look inside</span>
          <h2 id="tour-title" className="section-title">
            The same vault on your computer and your phone
          </h2>
          <p className="section-lede">Real screenshots of the app, filled with made-up accounts.</p>
        </div>
        <div className="tour">
          <AppFigure item={tourDesktop} sizes="(min-width: 75rem) 1150px, 92vw" className="tour__desktop" />
          <ul className="tour__phones">
            {tourPhones.map((item) => (
              <li key={item.shot.src}>
                <AppFigure item={item} sizes="(min-width: 52rem) 270px, 45vw" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** The four things a visitor should take away, in everyday words. */
function Promises() {
  const promises = [
    { value: "Locked on your device", label: "before anything is saved" },
    { value: "Share one password", label: "never your whole vault" },
    { value: "Free to use", label: "no subscription, no fee per person" },
    { value: "Open source", label: "anyone can check the code" },
  ];
  return (
    <section className="proof" aria-label="In short">
      <div className="container">
        <ul className="proof__list">
          {promises.map((p) => (
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

/**
 * Answers "is this for me?" before anything technical. Only one person has
 * to run a server, so each kind of visitor gets the one next step that is
 * theirs, easiest first.
 */
function WhoItsFor() {
  const paths = [
    {
      title: "Try it on your own",
      body: "The app suggests a test server, so you can create an account and look around straight away. Use made-up passwords there, not real ones.",
      href: "/#download",
      link: "Download the app",
    },
    {
      title: "Join someone’s server",
      body: "If a family member or colleague runs a server, install the app, enter the address they give you and choose a passphrase. What they share with you appears in your vault.",
      href: "/#sharing",
      link: "See how sharing works",
    },
    {
      title: "Set one up for others",
      body: "You’ll need a small rented server, a domain name and Docker. The guide covers each step, including backups and updates.",
      href: "/self-host",
      link: "Read the setup guide",
    },
  ];
  return (
    <section id="who" className="section" aria-labelledby="who-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Who it’s for</span>
          <h2 id="who-title" className="section-title">
            You don’t need to be technical to use it
          </h2>
          <Sentences className="section-lede" text={`${site.name} needs one server, set up once by one person. Everyone else installs the app and signs in.`} />
        </div>
        <ul className="paths">
          {paths.map((path) => (
            <li key={path.title} className="path">
              <h3>{path.title}</h3>
              <Sentences text={path.body} />
              <Link href={path.href} className="path__link">
                {path.link}
                <ArrowRightIcon width={16} height={16} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ServerSees() {
  const device = [
    ["Your passphrase", "turned into a key on your device, never sent"],
    ["Usernames, passwords, notes and custom fields", "locked together before they are saved"],
    ["Your unlocked keys", "never leave the device in usable form"],
  ];
  const server = [
    ["The name you give each password", "so lists and invites can show it"],
    ["Who shares with whom", "needed to deliver invites"],
    ["Scrambled data it cannot open", "and can’t relabel or swap"],
  ];
  return (
    <section className="section" aria-labelledby="sees-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">What the server sees</span>
          <h2 id="sees-title" className="section-title">
            The server holds your vault but can’t open it
          </h2>
          <Sentences className="section-lede" text={`Most password managers ask you to trust the company’s servers. ${site.name} is built so you don’t have to trust anyone’s, including your own. Here’s exactly what lives where.`} />
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
      title: "Share one password, not your vault",
      body: "Give someone the Wi-Fi password without giving them anything else. Every saved password has its own key, and each person you share with gets their own copy of that key.",
    },
    {
      icon: RotateIcon,
      title: "Take access back, for real",
      body: "Remove someone and the password is locked again under a new key. Even if they kept the old one, they can’t read anything you change afterwards.",
    },
    {
      icon: FingerprintIcon,
      title: "Know it’s really them",
      body: "The first time you share with someone, you confirm a short code they read out to you. A tampered server can’t pose as them, and Klavyn remembers the people you’ve checked.",
    },
    {
      icon: DevicesIcon,
      title: "Looks at home on your device",
      body: "One app, drawn in each system’s own style: macOS, Windows 11, GNOME, iOS and Android, in light and dark. A real app, not a browser tab.",
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
      title: "Updates that never guess",
      body: "Before it sends anything, the app checks that it and the server understand each other. If something doesn’t match, it stops, and never risks misreading your data.",
    },
    {
      icon: CodeIcon,
      title: "Nothing hidden in the code",
      body: "All of the code is public. The same core runs in the app and on the server, it is covered by tests, and it is small enough for one person to read.",
    },
  ];
  return (
    <section id="features" className="section section--tint" aria-labelledby="features-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Features</span>
          <h2 id="features-title" className="section-title">
            Everything you’d expect, built in
          </h2>
          <p className="section-lede">
            Without a company in the middle that holds a copy of your vault.
          </p>
        </div>
        <div className="features">
          {features.map(({ icon: FeatureIcon, title, body }) => (
            <article key={title} className="feature">
              <span className="feature__icon"><FeatureIcon /></span>
              <h3>{title}</h3>
              <Sentences text={body} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Sharing() {
  return (
    <section id="sharing" className="section" aria-labelledby="sharing-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Sharing</span>
          <h2 id="sharing-title" className="section-title">
            Share a password safely in three steps
          </h2>
          <Sentences className="section-lede" text="No more pasting passwords into a chat. The person you share with gets exactly one password, locked with a key only they hold." />
        </div>
        <ol className="steps">
          <li className="step">
            <h3>They join the same server</h3>
            <Sentences text="The other person installs the app and creates an account. Their app shows a short code, called a key fingerprint." />
          </li>
          <li className="step">
            <h3>You confirm it’s them</h3>
            <Sentences text="They read that code to you on a call or in person. You enter it with their email, once." />
          </li>
          <li className="step">
            <h3>They accept the invite</h3>
            <Sentences text="The password appears in their vault. Take access back whenever you like, and they can’t read anything you change afterwards." />
          </li>
        </ol>
        <ul className="shot-row" aria-label="The three screens, in order">
          {sharingShots.map((item) => (
            <li key={item.shot.src}>
              <AppFigure item={item} sizes="(min-width: 40rem) 240px, 9rem" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Every platform, with what a visitor can actually get today. Statuses come
 * from src/content/download.ts, so this section never offers a build that
 * isn't on the releases page or, for iOS, on TestFlight.
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
          <Sentences className="section-lede" text="Install the app and create an account on the test server it suggests, or enter the address of your own. Every version is free, and every version is pre-release: use made-up passwords until the stable release." />
        </div>
        <ul className="platforms">
          {platforms.map((platform) => (
            <li key={platform.name} className="platform" data-status={platform.status}>
              <div className="platform__head">
                <h3>{platform.name}</h3>
                <PlatformStatus platform={platform} />
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
          <Sentences text="The installers aren’t signed yet, so your computer or phone warns you once; the steps above get you past it. The app and the server must come from the same release." />
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
          <span className="eyebrow">For whoever runs the server</span>
          <h2 id="selfhost-title" className="section-title">
            Your own server, one command away
          </h2>
          <Sentences className="section-lede" text="This part is for the person doing the setup. One Docker Compose file brings up the server behind Caddy with automatic HTTPS on a small VPS. Only ports 80 and 443 face the internet." />
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
      <div className="container">
        <div className="built-on">
          <h3 id="built-on-title">What it’s built on</h3>
          <ul className="built-on__list" aria-labelledby="built-on-title">
            {BUILT_ON.map((item) => (
              <li key={item.value}>
                <span className="built-on__value">{item.value}</span>
                <span className="built-on__label">{item.label}</span>
              </li>
            ))}
          </ul>
          <Link href="/security" className="path__link">
            Read the security model
            <ArrowRightIcon width={16} height={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Column headings for the comparison; also the labels each answer carries on a phone. */
const COMPARE_COLUMNS = { hosted: "A typical online password manager", ours: site.name } as const;

/**
 * The questions someone weighing a well-known manager would ask, each
 * answered both ways. The last row is the one this product loses, on
 * purpose: it leads into the trade-offs section that follows.
 */
function Compare() {
  const rows = [
    ["Where are your passwords kept?", "On the company’s servers, with everyone else’s", "On a server you or someone you trust runs"],
    ["What if the company is hacked?", "Your locked vault may be taken with the rest", "There is no company holding it"],
    ["What does it cost for ten people?", "A fee per person, every month", "Nothing. You pay only for the server"],
    ["Who can check how it works?", "Depends on the company", "Anyone. The code is public"],
    ["What if the product is shut down?", "You move everything out in a hurry", "You keep running what you have"],
    ["Who looks after it?", "The company does", "You, or whoever runs your server"],
  ];
  return (
    <section className="section section--tint" aria-labelledby="compare-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">How it compares</span>
          <h2 id="compare-title" className="section-title">
            Why not use one of the big names?
          </h2>
          <Sentences className="section-lede" text={`They work well, and they keep millions of people’s vaults in one place, which makes that place worth breaking into. ${site.name} keeps yours on a server only your people use.`} />
        </div>
        <div className="compare-wrap">
          {/* Explicit roles: on a phone the rows are restyled as stacked
              blocks, and a table laid out with display:block otherwise stops
              being announced as one. */}
          <table className="compare" role="table">
            <thead role="rowgroup">
              <tr role="row">
                <td role="cell" />
                <th scope="col" role="columnheader">{COMPARE_COLUMNS.hosted}</th>
                <th scope="col" role="columnheader">{COMPARE_COLUMNS.ours}</th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {rows.map(([question, hosted, ours]) => (
                <tr key={question} role="row">
                  <th scope="row" role="rowheader">{question}</th>
                  <td role="cell" data-label={COMPARE_COLUMNS.hosted}>{hosted}</td>
                  <td role="cell" data-label={COMPARE_COLUMNS.ours}>{ours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Sentences className="compare-note" text="That last row is the catch, and it’s a real one. Here’s what it means." />
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
          <Sentences className="section-lede" text="Real security comes with trade-offs. We’d rather you hear them now." />
        </div>
        <div className="tradeoffs">
          <article className="tradeoff">
            <h3>Forget your passphrase, lose your vault</h3>
            <Sentences text="No reset link, no support ticket, no backdoor. If anyone could recover it for you, an attacker could too." />
          </article>
          <article className="tradeoff">
            <h3>Someone has to run the server</h3>
            <Sentences text="You, or someone you trust. Updates and backups are theirs to schedule. The guide covers both, and the server is one small program." />
          </article>
          <article className="tradeoff">
            <h3>It’s still pre-release</h3>
            <Sentences text="The way data is stored may change between versions and the installers aren’t signed yet. Try it with made-up passwords today, and move your real ones in at the stable release." />
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
              <Sentences text={answer} marked />
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
          <Sentences text="Free, open source and yours to run. Try it today with made-up passwords, or follow the project on GitHub until the stable release." />
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
