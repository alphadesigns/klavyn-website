/**
 * Shell snippets shown on the site. Each has a rendered form (with prompts and
 * comments) and a copy form (commands only), built from one list of lines so
 * the two cannot drift apart.
 */
import type { ReactNode } from "react";
import { site } from "@/lib/site";

/** A command to run, or a comment explaining the next one. */
export type ShellLine = { cmd: string } | { comment: string };

export type Snippet = { render: ReactNode; copy: string };

export function buildSnippet(lines: readonly ShellLine[]): Snippet {
  const copy = lines
    .filter((line): line is { cmd: string } => "cmd" in line)
    .map((line) => line.cmd)
    .join("\n");

  const render = lines.map((line, index) => (
    <span key={index}>
      {"cmd" in line ? (
        <>
          <span className="c-prompt">$ </span>
          {line.cmd}
        </>
      ) : (
        <span className="c-comment"># {line.comment}</span>
      )}
      {index < lines.length - 1 ? "\n" : null}
    </span>
  ));

  return { render, copy };
}

export const selfHostCommands = buildSnippet([
  { cmd: `git clone ${site.repoUrl} && cd credvault/deploy` },
  { cmd: "cp .env.example .env && chmod 600 .env" },
  { comment: "set your domain and ACME email; to limit sign-ups, also set a token from:" },
  { cmd: "openssl rand -base64 32" },
  { cmd: "$EDITOR .env" },
  { cmd: "docker compose up -d --build" },
  { cmd: "curl https://vault.example.com/health" },
]);

export const buildFromSourceCommands = buildSnippet([
  { comment: "server" },
  { cmd: "cargo build --release -p credvault-server" },
  { cmd: "./target/release/credvault-server --bind 0.0.0.0:8787 --data-dir /srv/credvault" },
  { comment: "desktop app installer, written to target/release/bundle" },
  { cmd: 'cargo install tauri-cli --version "^2" --locked' },
  { cmd: "cd apps/desktop && cargo tauri build" },
]);

export const firewallCommands = buildSnippet([
  { cmd: "ufw default deny incoming" },
  { cmd: "ufw allow OpenSSH" },
  { cmd: "ufw allow 80,443/tcp" },
  { cmd: "ufw enable" },
]);

export const upgradeCommands = buildSnippet([
  { comment: "back up first: there are no down migrations" },
  { cmd: "./backup.sh" },
  { cmd: "git pull" },
  { cmd: "docker compose up -d --build" },
  { cmd: "docker compose logs -f credvault" },
]);
