import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageToc } from "@/components/PageToc";
import { CodeBlock } from "@/components/CodeBlock";
import { AlertIcon, ArrowRightIcon } from "@/components/icons";
import {
  buildFromSourceCommands,
  firewallCommands,
  selfHostCommands,
  upgradeCommands,
} from "@/content/self-host";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { tocFromSections } from "@/lib/toc";

export const metadata = pageMetadata({
  title: "Self-host your password server",
  description:
    "Deploy the Klavyn server on a VPS with Docker Compose and automatic HTTPS, or build it from source. Covers registration, firewall, backups and upgrades.",
  path: "/self-host",
});

const serverOptions = [
  ["--registration-token TOKEN", "KLAVYN_REGISTRATION_TOKEN", "Only people with this token can create an account. Left blank, as .env.example ships, anyone who can reach the server can."],
  ["--closed-registration", "KLAVYN_CLOSED_REGISTRATION", "No new accounts; existing ones keep working. true, yes, on or 1 close it. Ambiguous values such as off or no stop the server rather than being guessed at, and so does combining it with a token."],
  ["--trust-forwarded-for", "KLAVYN_TRUST_FORWARDED_FOR", "Rate-limit by the rightmost X-Forwarded-For address. Only behind a proxy that sets it."],
];

/** Section headings, in page order; also the "On this page" list. */
const SECTIONS = {
  requirements: "What you need",
  deploy: "Deploy with Docker Compose",
  firewall: "Close everything else",
  accounts: "Decide who can sign up",
  backups: "Back up every night",
  upgrades: "Upgrade safely",
  source: "Build from source instead",
  "first-account": "Create your first account",
} as const;

const toc = tocFromSections(SECTIONS);

export default function SelfHostPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Breadcrumb trail={[{ name: "Home", path: "/" }, { name: "Self-host", path: "/self-host" }]} />
          <span className="eyebrow">Self-hosting guide</span>
          <h1>Run your own {site.name} server</h1>
          <p className="section-lede">
            A small VPS, a domain name and Docker are all you need. Caddy handles
            HTTPS, and the server itself is never exposed directly.
          </p>
        </div>
      </section>

      <div className="container doc-layout">
        <article className="prose">
          <div className="notice" role="note">
            <AlertIcon />
            <p>
              <strong>{site.name} is pre-release.</strong> Storage formats can
              change between builds and nothing is migrated. Run an app and a
              server from the same release, and keep your current password
              manager until a stable release.
            </p>
          </div>

          <h2 id="requirements">{SECTIONS.requirements}</h2>
          <ul>
            <li>A domain with an A record (and AAAA, if you use IPv6) pointing at the server.</li>
            <li>Docker Engine with the Compose plugin.</li>
            <li>Ports 80 and 443 reachable from the internet. Port 80 is needed for the certificate challenge.</li>
            <li>About 1 GB of memory. The first build compiles everything, so a 1 GB machine may need swap.</li>
          </ul>

          <h2 id="deploy">{SECTIONS.deploy}</h2>
          <p>
            Clone the repository, fill in <code>.env</code>, and start the stack.
            The health check should answer with <code>{`{"status":"ok"}`}</code>.
          </p>
          <CodeBlock title="Deploy" copyText={selfHostCommands.copy}>
            {selfHostCommands.render}
          </CodeBlock>
          <p>
            Keep <code>.env</code> readable only by its owner: a registration
            token in it is a credential.
          </p>

          <h2 id="firewall">{SECTIONS.firewall}</h2>
          <p>The application port is never published, but lock down the rest of the machine anyway.</p>
          <CodeBlock title="Firewall" copyText={firewallCommands.copy}>
            {firewallCommands.render}
          </CodeBlock>

          <h2 id="accounts">{SECTIONS.accounts}</h2>
          <p>
            Who can create an account is one of three states: anyone with a
            token, anyone who can reach the server, or nobody new. As shipped,
            the token is blank, which means open. That’s fine on your own
            machine; on a public host, set a token or close registration on
            purpose. Rotating the token doesn’t affect existing accounts.
          </p>
          <dl className="options">
            {serverOptions.map(([flag, env, effect]) => (
              <div key={flag} className="options__item">
                <dt>
                  <code>{flag}</code>
                  <code>{env}</code>
                </dt>
                <dd>{effect}</dd>
              </div>
            ))}
          </dl>
          <p>
            The server prints its registration policy every time it starts, so
            you can check what a host is running with{" "}
            <code>docker compose logs klavyn | grep &quot;registration policy&quot;</code>.
            Logins and registrations are rate-limited per client address out of
            the box.
          </p>

          <h2 id="backups">{SECTIONS.backups}</h2>
          <p>
            There’s no password recovery and the server holds only
            ciphertext, so the database is the single point of failure for every
            vault on it. Run <code>deploy/backup.sh</code> from cron as root, and
            copy the results somewhere off the machine.
          </p>

          <h2 id="upgrades">{SECTIONS.upgrades}</h2>
          <p>
            Migrations run at startup and can’t be undone, so always back up
            first. Upgrade the server before the apps: each app checks what the
            server supports before it sends anything.
          </p>
          <CodeBlock title="Upgrade" copyText={upgradeCommands.copy}>
            {upgradeCommands.render}
          </CodeBlock>

          <h2 id="source">{SECTIONS.source}</h2>
          <p>
            You’ll need <a href="https://rustup.rs">Rust</a>. On Linux,
            Tauri also needs <code>libwebkit2gtk-4.1-dev</code>,{" "}
            <code>libayatana-appindicator3-dev</code> and{" "}
            <code>librsvg2-dev</code>.
          </p>
          <CodeBlock title="Build from source" copyText={buildFromSourceCommands.copy}>
            {buildFromSourceCommands.render}
          </CodeBlock>

          <h2 id="first-account">{SECTIONS["first-account"]}</h2>
          <ol>
            <li>Open the desktop app and enter your server’s HTTPS address.</li>
            <li>Enter your email and a passphrase of at least 12 characters, plus the registration token if your server uses one. The app shows the token field only when the server asks for it.</li>
            <li>Select <strong>Create account</strong>. From then on, use <strong>Log in</strong>.</li>
          </ol>
          <p>
            Choose the server address carefully before inviting anyone. Logins
            are bound to it, so moving to a new domain means creating accounts
            again.
          </p>

          <div className="btn-row" style={{ marginTop: "var(--space-7)" }}>
            <a href={site.repoUrl} className="btn btn--primary">
              Get the code on GitHub
              <ArrowRightIcon />
            </a>
            <Link href="/security" className="btn btn--secondary">
              Read the security model
            </Link>
          </div>
        </article>
        <PageToc sections={toc} />
      </div>
    </>
  );
}
