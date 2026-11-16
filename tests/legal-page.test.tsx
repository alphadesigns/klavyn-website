import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LegalPage } from "@/components/LegalPage";
import { parseLegal } from "@/lib/legal";

const render = (markdown: string) =>
  renderToStaticMarkup(<LegalPage document={parseLegal(markdown, "test.md")} path="/privacy" />);

const FINAL = "# Privacy Policy\n\nIntro.\n\n## Who runs this\n\nUs.\n\n## What we hold\n\n- One\n- Two\n";
const DRAFT = `${FINAL}\nContact \`[CONTACT EMAIL]\`.\n`;

describe("LegalPage", () => {
  it("uses the guide layout: a hero with the title, then the document beside its contents", () => {
    const html = render(FINAL);
    expect(html).toContain('class="page-hero"');
    expect(html).toContain("<h1>Privacy Policy</h1>");
    expect(html).toContain('class="container doc-layout"');
    expect(html).toContain('<article class="prose">');
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it("lists every section in the contents, linked to its heading", () => {
    const html = render(FINAL);
    for (const id of ["who-runs-this", "what-we-hold"]) {
      expect(html).toContain(`<h2 id="${id}">`);
      expect(html).toContain(`href="#${id}"`);
    }
  });

  it("ends the breadcrumb on the document itself", () => {
    expect(render(FINAL)).toContain('<li aria-current="page">Privacy Policy</li>');
  });

  it("shows the draft notice only while a placeholder remains", () => {
    expect(render(DRAFT)).toContain('class="notice" role="note"');
    expect(render(DRAFT)).toContain("This is a draft.");
    expect(render(FINAL)).not.toContain("This is a draft.");
  });

  it("renders a document with no sections", () => {
    const html = render("# Terms\n\nOnly a paragraph.\n");
    expect(html).toContain("<p><span>Only a paragraph.</span></p>");
    expect(html).not.toContain("<h2");
  });
});
