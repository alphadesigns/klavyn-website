import { LegalPage } from "@/components/LegalPage";
import { legalMarkdown } from "@/content/legal.generated";
import { parseLegal } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

const PATH = "/terms";

export const metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "The terms covering use of the klavyn app and the test server, including what a pre-release test service does and does not promise.",
  path: PATH,
});

// Parsed once at module load, which for a static page is build time. Markdown
// this site cannot render throws here, so a document that would mis-render
// fails the build rather than the page.
const document = parseLegal(legalMarkdown.terms, "terms.md");

export default function TermsPage() {
  return <LegalPage document={document} path={PATH} />;
}
