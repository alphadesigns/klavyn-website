import { AlertIcon } from "@/components/icons";
import type { Block, LegalDocument as Document, Span } from "@/lib/legal";

/** One run of inline markup. Plain text is the common case. */
function Spans({ spans }: { spans: readonly Span[] }) {
  return (
    <>
      {spans.map((span, index) => {
        const key = `${span.kind}-${index}`;
        if (span.kind === "code") return <code key={key}>{span.text}</code>;
        if (span.kind === "strong") return <strong key={key}>{span.text}</strong>;
        if (span.kind === "em") return <em key={key}>{span.text}</em>;
        return <span key={key}>{span.text}</span>;
      })}
    </>
  );
}

/**
 * Renders a parsed policy document.
 *
 * Every node is a React element built from parsed blocks; nothing reaches
 * `dangerouslySetInnerHTML`. The parser already refuses Markdown outside the
 * supported subset, so there is no path by which the source could introduce
 * markup of its own.
 */
export function LegalDocument({ document }: { document: Document }) {
  return (
    <>
      {document.draft ? (
        <div className="notice" role="note">
          <AlertIcon />
          <p>
            <strong>This is a draft.</strong> Some details — the operator&rsquo;s
            name, contact addresses and governing law — are still marked with
            placeholders in square brackets and have not been filled in. The app
            shows the same notice above the same text.
          </p>
        </div>
      ) : null}
      {document.blocks.map((block: Block, index) => {
        if (block.kind === "heading") {
          return (
            <h2 key={block.id} id={block.id}>
              <Spans spans={block.spans} />
            </h2>
          );
        }
        if (block.kind === "list") {
          return (
            <ul key={`list-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Spans spans={item} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={`p-${index}`}>
            <Spans spans={block.spans} />
          </p>
        );
      })}
    </>
  );
}
