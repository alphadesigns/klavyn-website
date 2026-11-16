import { Breadcrumb } from "@/components/Breadcrumb";
import { LegalDocument } from "@/components/LegalDocument";
import { PageToc } from "@/components/PageToc";
import type { LegalDocument as Document } from "@/lib/legal";

/**
 * A policy page in the same frame as the guides: a hero with the breadcrumb
 * and title, then the document beside an "On this page" list.
 *
 * @param document The parsed policy; its title is the page heading.
 * @param path The page's own route, for the breadcrumb.
 */
export function LegalPage({ document, path }: { document: Document; path: string }) {
  const toc = document.headings.map(({ id, text }) => ({ id, label: text }));

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Breadcrumb
            trail={[
              { name: "Home", path: "/" },
              { name: document.title, path },
            ]}
          />
          <span className="eyebrow">Legal</span>
          <h1>{document.title}</h1>
        </div>
      </section>

      <div className="container doc-layout">
        <article className="prose">
          <LegalDocument document={document} />
        </article>
        <PageToc sections={toc} />
      </div>
    </>
  );
}
