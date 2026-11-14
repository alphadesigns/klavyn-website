// Copies the privacy policy and terms out of the klavyn repository, where
// they are the single source of truth, into a generated module this site
// renders.
//
// They are not edited here. The same two Markdown files produce the copy
// shown inside the app before sign-up, and a second hand-maintained copy on
// the website is how the two come to disagree -- which for a document people
// accept is not a formatting bug, it is a false statement about what the
// service does.
//
// Run with:  node scripts/sync-legal.mjs [path-to-klavyn-repo]
// Default:   ../klavyn
"use strict";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const OUTPUT = path.join(ROOT, "src/content/legal.generated.ts");
const SOURCES = [
  { key: "privacy", file: "docs/privacy.md" },
  { key: "terms", file: "docs/terms.md" },
];

function findRepo() {
  const candidates = [process.argv[2], "../klavyn"].filter(Boolean);
  for (const candidate of candidates) {
    const resolved = path.resolve(ROOT, candidate);
    if (SOURCES.every(({ file }) => fs.existsSync(path.join(resolved, file)))) return resolved;
  }
  throw new Error(
    `could not find the klavyn repository (tried: ${candidates.join(", ")}).\n` +
      "Pass its path: node scripts/sync-legal.mjs ../klavyn",
  );
}

const repo = findRepo();
const documents = {};
for (const { key, file } of SOURCES) {
  documents[key] = fs.readFileSync(path.join(repo, file), "utf8");
}

// A literal, not a template, so the generated file has no interpolation of
// its own and the Markdown is carried byte for byte.
const body = Object.entries(documents)
  .map(([key, markdown]) => `  ${key}: ${JSON.stringify(markdown)},`)
  .join("\n");

fs.writeFileSync(
  OUTPUT,
  `// GENERATED FILE -- do not edit.
//
// The Markdown below is copied verbatim from the klavyn repository
// (${SOURCES.map((s) => s.file).join(", ")}), which is where it is written and
// reviewed. To change what these pages say, change it there and re-run:
//
//   node scripts/sync-legal.mjs
//
// tests/legal.test.ts parses both at build time, so Markdown this site cannot
// render fails the test suite rather than the page.
export const legalMarkdown = {
${body}
} as const;

export type LegalKey = keyof typeof legalMarkdown;
`,
  "utf8",
);

console.log(`sync-legal: wrote ${path.relative(ROOT, OUTPUT)} from ${repo}`);
