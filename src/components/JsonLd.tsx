import { serializeJsonLd } from "@/lib/seo";

/** Renders schema.org structured data. Server component: no client JS. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // serializeJsonLd escapes "<", so the content cannot close this tag.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
