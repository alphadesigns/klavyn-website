/** One entry in a page's "On this page" list: an h2's id and its text. */
export interface TocSection {
  id: string;
  label: string;
}

/**
 * Builds the contents list from a page's section map, so each heading's text
 * is written once and used both by the <h2> and by the list.
 */
export function tocFromSections(sections: Readonly<Record<string, string>>): TocSection[] {
  return Object.entries(sections).map(([id, label]) => ({ id, label }));
}

/**
 * The section being read: the last heading whose top has scrolled to or above
 * `offset` (the reading line just under the sticky header). Before the first
 * heading reaches it, the first section counts as current. Expects headings
 * in document order; returns null when there are none.
 */
export function activeSectionId(
  headings: readonly { id: string; top: number }[],
  offset: number,
): string | null {
  if (headings.length === 0) return null;
  let active = headings[0].id;
  for (const heading of headings) {
    if (heading.top > offset) break;
    active = heading.id;
  }
  return active;
}
