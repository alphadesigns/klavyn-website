import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Sentences } from "@/components/Sentences";
import { faq } from "@/content/faq";
import { splitSentences } from "@/lib/sentences";

describe("splitSentences", () => {
  it("splits on full stops, question marks and exclamation marks", () => {
    expect(splitSentences("One. Two? Three! Four.")).toEqual(["One.", "Two?", "Three!", "Four."]);
  });

  it("leaves a single sentence whole", () => {
    expect(splitSentences("Just the one, with a comma; and a colon: here.")).toHaveLength(1);
  });

  it("does not split inside file names, versions or addresses", () => {
    expect(splitSentences("Open the .dmg from version 0.1.3 at vault.klavyn.com today.")).toHaveLength(1);
  });

  it("keeps a closing quote or bracket with its sentence", () => {
    expect(splitSentences("She said “done.” Then left (quickly.) The end.")).toEqual([
      "She said “done.”",
      "Then left (quickly.)",
      "The end.",
    ]);
  });

  it("splits before a sentence that starts in lower case", () => {
    expect(splitSentences("Android is ready. iOS isn’t yet.")).toEqual(["Android is ready.", "iOS isn’t yet."]);
  });

  it("handles blank input and stray whitespace", () => {
    expect(splitSentences("")).toEqual([]);
    expect(splitSentences("   \n ")).toEqual([]);
    expect(splitSentences("  One.\n  Two.  ")).toEqual(["One.", "Two."]);
  });

  it("splits every FAQ answer into sentences that each end one", () => {
    for (const { question, answer } of faq) {
      for (const sentence of splitSentences(answer)) {
        expect(sentence, question).toMatch(/[.!?]$/);
        expect(sentence.length, `${question}: "${sentence}"`).toBeGreaterThan(1);
      }
    }
  });
});

describe("Sentences", () => {
  it("renders one sentence as a paragraph", () => {
    expect(renderToStaticMarkup(<Sentences text="Only one." className="lede" />)).toBe('<p class="lede">Only one.</p>');
  });

  it("renders several sentences as a list, one per item", () => {
    const html = renderToStaticMarkup(<Sentences text="First. Second. Third." className="lede" />);
    expect(html).toBe('<ul class="sentences lede"><li>First.</li><li>Second.</li><li>Third.</li></ul>');
  });

  it("shows bullets only when asked to", () => {
    expect(renderToStaticMarkup(<Sentences text="A. B." />)).not.toContain("sentences--marked");
    expect(renderToStaticMarkup(<Sentences text="A. B." marked className="x" />)).toContain(
      '<ul class="sentences sentences--marked x">',
    );
    // One sentence is a paragraph either way, so there is nothing to mark.
    expect(renderToStaticMarkup(<Sentences text="A." marked />)).toBe("<p>A.</p>");
  });

  it("works without a class name", () => {
    expect(renderToStaticMarkup(<Sentences text="A. B." />)).toContain('<ul class="sentences">');
  });

  it("escapes markup in the text", () => {
    expect(renderToStaticMarkup(<Sentences text="<b>One.</b> Two." />)).not.toContain("<b>");
  });

  it("renders an empty paragraph for blank text", () => {
    expect(renderToStaticMarkup(<Sentences text="  " />)).toBe("<p></p>");
  });
});
