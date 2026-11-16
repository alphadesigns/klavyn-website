import { LegalPage } from "@/components/LegalPage";
import { legalMarkdown } from "@/content/legal.generated";
import { parseLegal } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

const PATH = "/privacy";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "What the klavyn test service stores, what it can and cannot read, how long it keeps it, and how to have it deleted.",
  path: PATH,
});

// Parsed once at module load, which for a static page is build time. Markdown
// this site cannot render throws here, so a document that would mis-render
// fails the build rather than the page.
const document = parseLegal(legalMarkdown.privacy, "privacy.md");

export default function PrivacyPage() {
  return <LegalPage document={document} path={PATH} />;
}
