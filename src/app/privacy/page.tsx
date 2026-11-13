import { Breadcrumb } from "@/components/Breadcrumb";
import { LegalDocument } from "@/components/LegalDocument";
import { PageToc } from "@/components/PageToc";
import { legalMarkdown } from "@/content/legal.generated";
import { parseLegal } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "What the klavyn test service stores, what it can and cannot read, how long it keeps it, and how to have it deleted.",
  path: "/privacy",
});

// Parsed once at module load, which for a static page is build time. Markdown
// this site cannot render throws here, so a document that would mis-render
// fails the build rather than the page.
const document = parseLegal(legalMarkdown.privacy, "privacy.md");
const toc = document.headings.map(({ id, text }) => ({ id, label: text }));

export default function PrivacyPage() {
  return (
    <>
      <Breadcrumb
        trail={[
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy" },
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
