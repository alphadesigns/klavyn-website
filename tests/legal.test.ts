import { describe, expect, it } from "vitest";
import { legalMarkdown } from "@/content/legal.generated";
import { headingId, inlineSpans, parseLegal } from "@/lib/legal";

describe("inlineSpans", () => {
  it("reads code, bold and italic", () => {
    expect(inlineSpans("plain `code` **bold** *italic*")).toEqual([
      { kind: "text", text: "plain " },
      { kind: "code", text: "code" },
      { kind: "text", text: " " },
      { kind: "strong", text: "bold" },
      { kind: "text", text: " " },
      { kind: "em", text: "italic" },
    ]);
  });

  // The alternative to throwing is a stray asterisk in the middle of a legal
  // document, which is what happened to "the *service* we run" upstream
  // before the same check existed there.
  it("refuses a marker it cannot pair", () => {
    expect(() => inlineSpans("the *service we run")).toThrow(/unbalanced/);
    expect(() => inlineSpans("an unclosed `code span")).toThrow(/unbalanced/);
  });
});

describe("headingId", () => {
  it("makes an anchor the table of contents can link to", () => {
    expect(headingId("What we hold, and whether we can read it")).toBe(
      "what-we-hold-and-whether-we-can-read-it",
    );
    expect(headingId("1. Who these terms are between")).toBe("1-who-these-terms-are-between");
  });
});

describe("parseLegal", () => {
  it("rejects Markdown outside the supported subset", () => {
    for (const source of ["# T\n\n### too deep", "# T\n\n> a quote", "# T\n\n1. numbered", "# T\n\n* star bullet"]) {
      expect(() => parseLegal(source, "x.md")).toThrow(/unsupported Markdown/);
    }
  });

  it("requires exactly one title", () => {
    expect(() => parseLegal("no title here", "x.md")).toThrow(/no title/);
    expect(() => parseLegal("# One\n\n# Two", "x.md")).toThrow(/one title/);
  });

  it("joins a paragraph wrapped across lines", () => {
    // Splitting on the newline would cut the emphasis in half, and the
    // inline parser would then refuse it.
    const doc = parseLegal("# T\n\n**emphasis spanning\ntwo lines** after", "x.md");
    expect(doc.blocks).toEqual([
      {
        kind: "paragraph",
        spans: [
          { kind: "strong", text: "emphasis spanning two lines" },
          { kind: "text", text: " after" },
        ],
      },
    ]);
  });

  it("gathers consecutive items into one list", () => {
    const doc = parseLegal("# T\n\n- one\n- two\n\npara", "x.md");
    expect(doc.blocks.map((b) => b.kind)).toEqual(["list", "paragraph"]);
  });
});

describe("the documents this site publishes", () => {
  // The pages parse at build time, so a document the parser refuses would
  // break the build. Failing here instead names which one and why.
  it.each(["privacy", "terms"] as const)("%s parses and has sections", (key) => {
    const doc = parseLegal(legalMarkdown[key], `${key}.md`);
    expect(doc.title).toBeTruthy();
    expect(doc.headings.length).toBeGreaterThan(3);
    expect(new Set(doc.headings.map((h) => h.id)).size).toBe(doc.headings.length);
  });

  // While the sources still carry [PLACEHOLDER] markers, the pages must say
  // so. If someone fills them in, this flips and the notice disappears on its
  // own -- but it must never be possible to publish a draft silently.
  it.each(["privacy", "terms"] as const)("%s is flagged as a draft while placeholders remain", (key) => {
    const doc = parseLegal(legalMarkdown[key], `${key}.md`);
    const hasPlaceholder = /\[[A-Z][^\]]*\]/.test(legalMarkdown[key]);
    expect(doc.draft).toBe(hasPlaceholder);
  });
});

// The counting code and the policy that discloses it ship together. A sync
// from a klavyn checkout whose policy does not describe the site's counting
// would publish the code without its disclosure; this makes that fail.
describe("the privacy policy discloses the site's counting", () => {
  it("names it, and the signals that turn it off", () => {
    // Within the website's own paragraph: the app's section says "no
    // cookies" too, so a check against the whole policy would pass even if
    // this paragraph stopped promising it.
    const privacy = legalMarkdown.privacy;
    const start = privacy.indexOf("**Our website counts visits.**");
    expect(start, "the website paragraph is missing").toBeGreaterThanOrEqual(0);
    const end = privacy.indexOf("\n\n", start);
    const paragraph = privacy.slice(start, end === -1 ? undefined : end);
    expect(paragraph).toMatch(/no cookies/i);
    expect(paragraph).toContain("Do Not Track");
    expect(paragraph).toContain("Global Privacy Control");
    // The promise the "Discard client IP data" deploy step exists for.
    expect(paragraph).toMatch(/discard/i);
  });
});
