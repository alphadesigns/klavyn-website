import { Breadcrumb } from "@/components/Breadcrumb";
import { LegalDocument } from "@/components/LegalDocument";
import { PageToc } from "@/components/PageToc";
import { legalMarkdown } from "@/content/legal.generated";
import { parseLegal } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "The terms covering use of the klavyn app and the test server, including what a pre-release test service does and does not promise.",
  path: "/terms",
});

// Parsed once at module load, which for a static page is build time. Markdown
// this site cannot render throws here, so a document that would mis-render
// fails the build rather than the page.
const document = parseLegal(legalMarkdown.terms, "terms.md");
const toc = document.headings.map(({ id, text }) => ({ id, label: text }));

export default function TermsPage() {
  return (
    <>
      <Breadcrumb
        trail={[
          { name: "Home", path: "/" },
          { name: "Terms of Service", path: "/terms" },
        ]}
      />
      <div className="page-with-toc">
        <article className="prose">
          <h1>{document.title}</h1>
          <LegalDocument document={document} />
        </article>
        <PageToc sections={toc} />
      </div>
    </>
  );
}
