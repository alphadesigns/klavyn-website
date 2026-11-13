/**
 * The privacy policy and terms, parsed from the Markdown that the klavyn
 * repository holds as the single source of truth.
 *
 * Deliberately the same strict subset as `scripts/build-legal.js` in that
 * repository, which renders the copy shown inside the app: a single `#`
 * title, `##` sections, paragraphs, `-` lists, `---` rules, and inline
 * `` ` ``, `**` and `*`. Anything else throws rather than being passed
 * through, because the failure mode for a legal document is not a broken
 * layout -- it is a sentence that renders differently here than in the app
 * people agreed to.
 *
 * Blocks come back structured rather than as an HTML string, so the pages
 * render React elements and nothing is ever passed to
 * `dangerouslySetInnerHTML`.
 */

export type Span =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "em"; text: string };

export type Block =
  | { kind: "heading"; id: string; spans: Span[] }
  | { kind: "paragraph"; spans: Span[] }
  | { kind: "list"; items: Span[][] };

export type LegalDocument = {
  title: string;
  blocks: Block[];
  /** True while the source still has a `[PLACEHOLDER]` to fill in. */
  draft: boolean;
  /** Section headings in order, for the "On this page" list. */
  headings: { id: string; text: string }[];
};

/** A placeholder the operator still has to fill in, e.g. `[CONTACT EMAIL]`. */
const PLACEHOLDER = /\[[A-Z][^\]]*\]/;

/**
 * Inline markup within one block.
 *
 * Every marker must be consumed: a leftover one means the document used
 * something this does not understand, and the alternative to throwing is a
 * stray asterisk in the middle of a legal document.
 *
 * @throws Error on unbalanced `` ` ``, `**` or `*`.
 */
export function inlineSpans(text: string): Span[] {
  const pattern = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  const spans: Span[] = [];
  let last = 0;
  for (let m = pattern.exec(text); m !== null; m = pattern.exec(text)) {
    if (m.index > last) spans.push({ kind: "text", text: text.slice(last, m.index) });
    if (m[1] !== undefined) spans.push({ kind: "code", text: m[1] });
    else if (m[2] !== undefined) spans.push({ kind: "strong", text: m[2] });
    else spans.push({ kind: "em", text: m[3] });
    last = m.index + m[0].length;
  }
  if (last < text.length) spans.push({ kind: "text", text: text.slice(last) });

  const leftovers = spans.filter((s) => s.kind === "text" && (s.text.includes("*") || s.text.includes("`")));
  if (leftovers.length > 0) throw new Error(`unbalanced inline markup: ${text}`);
  return spans;
}

/** A stable anchor for a heading, so the table of contents can link to it. */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Parse one document.
 *
 * @throws Error when the source uses Markdown outside the supported subset,
 *   has no `#` title, or has more than one.
 */
export function parseLegal(markdown: string, file: string): LegalDocument {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");

  // Paragraphs and list items may be wrapped across lines; join them first so
  // the block pass only ever sees whole blocks. Splitting on the newline
  // would cut `**emphasis spanning two lines**` in half, which inlineSpans
  // then refuses rather than emitting a stray asterisk.
  type Raw = { kind: "blank" | "rule" | "h1" | "h2" | "item" | "p"; text: string };
  const raws: Raw[] = [];
  const wrappable = new Set(["p", "item"]);
  for (const original of lines) {
    const line = original.trim();
    const starts = line === "---" || line.startsWith("#") || line.startsWith("- ") || !line;
    const previous = raws.at(-1);
    if (!starts && previous && wrappable.has(previous.kind)) {
      previous.text += ` ${line}`;
      continue;
    }
    if (!line) raws.push({ kind: "blank", text: "" });
    else if (line === "---") raws.push({ kind: "rule", text: "" });
    else if (line.startsWith("# ")) raws.push({ kind: "h1", text: line.slice(2).trim() });
    else if (line.startsWith("## ")) raws.push({ kind: "h2", text: line.slice(3).trim() });
    else if (line.startsWith("- ")) raws.push({ kind: "item", text: line.slice(2).trim() });
    else if (
      /^#{3,}\s/.test(line) ||
      /^[*+]\s/.test(line) ||
      /^\d+\.\s/.test(line) ||
      line.startsWith(">") ||
      original.startsWith("    ")
    ) {
      throw new Error(`${file}: unsupported Markdown: ${line}`);
    } else raws.push({ kind: "p", text: line });
  }

  let title: string | null = null;
  const blocks: Block[] = [];
  const headings: { id: string; text: string }[] = [];
  let list: Span[][] | null = null;
  const closeList = () => {
    if (list) blocks.push({ kind: "list", items: list });
    list = null;
  };

  for (const raw of raws) {
    if (raw.kind !== "item") closeList();
    switch (raw.kind) {
      case "blank":
      case "rule":
        break;
      case "h1":
        if (title) throw new Error(`${file}: a document has one title`);
        title = raw.text;
        break;
      case "h2": {
        const id = headingId(raw.text);
        headings.push({ id, text: raw.text });
        blocks.push({ kind: "heading", id, spans: inlineSpans(raw.text) });
        break;
      }
      case "item":
        list ??= [];
        list.push(inlineSpans(raw.text));
        break;
      case "p":
        blocks.push({ kind: "paragraph", spans: inlineSpans(raw.text) });
        break;
    }
  }
  closeList();
  if (!title) throw new Error(`${file}: no title`);

  return { title, blocks, draft: PLACEHOLDER.test(markdown), headings };
}
