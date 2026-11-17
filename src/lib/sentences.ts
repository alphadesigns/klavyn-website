/**
 * Splits running text into its sentences, for descriptions that are shown
 * one sentence per line.
 *
 * A sentence ends at ".", "!" or "?" (optionally followed by a closing quote
 * or bracket) when whitespace comes next. A full stop inside a word, such as
 * ".dmg" or "0.1.3", has no whitespace after it and so never splits. The copy
 * on this site uses no abbreviations that end in a full stop mid-sentence
 * ("e.g.", "Dr."); one of those would split early, and tests/sentences.test.ts
 * checks the real copy so that shows up there.
 *
 * @returns The sentences in order, trimmed; an empty array for blank input.
 */
export function splitSentences(text: string): string[] {
  return text
    .trim()
    .split(/(?<=[.!?]["”’)\]]?)\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}
