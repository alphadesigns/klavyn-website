import { splitSentences } from "@/lib/sentences";

type SentencesProps = {
  /** Plain text; it is split into sentences, never parsed as markup. */
  text: string;
  /** Carried onto the paragraph or the list, whichever renders. */
  className?: string;
  /**
   * Show a bullet before each sentence. Off by default: under a heading, the
   * lines stay on the heading's left edge and space alone separates them.
   * Turn it on for running text with no heading of its own (an FAQ answer, a
   * passage in an article), where sentences wrap over several lines and a
   * marker is what shows where each one starts.
   */
  marked?: boolean;
};

/**
 * A description. One sentence is a paragraph; more than one becomes a list
 * with a sentence per line, so each point starts on its own line.
 */
export function Sentences({ text, className, marked = false }: SentencesProps) {
  const sentences = splitSentences(text);
  if (sentences.length <= 1) return <p className={className}>{sentences[0] ?? ""}</p>;

  const classes = ["sentences", marked && "sentences--marked", className].filter(Boolean).join(" ");
  return (
    <ul className={classes}>
      {sentences.map((sentence, index) => (
        // Sentences can repeat in theory; position keeps the key unique.
        <li key={`${index}-${sentence}`}>{sentence}</li>
      ))}
    </ul>
  );
}
