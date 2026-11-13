"use client";

import { useEffect, useState } from "react";
import { activeSectionId, type TocSection } from "@/lib/toc";

/** Pixels below the viewport top where a heading counts as "being read". */
const READING_LINE = 120;

/** Tracks which section is being read, re-checking at most once per frame. */
function useActiveSection(sections: readonly TocSection[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const headings = sections.flatMap(({ id }) => {
        const el = document.getElementById(id);
        return el ? [{ id, top: el.getBoundingClientRect().top }] : [];
      });
      setActive(activeSectionId(headings, READING_LINE));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [sections]);

  return active;
}

/**
 * "On this page" contents for long guides, pinned beside the article on wide
 * screens. Plain anchor links, so it works without JavaScript; with it, the
 * section being read is marked with aria-current.
 */
export function PageToc({ sections }: { sections: readonly TocSection[] }) {
  const active = useActiveSection(sections);

  return (
    <nav className="toc" aria-labelledby="toc-title">
      <p id="toc-title" className="toc__title">
        On this page
      </p>
      <ol className="toc__list">
        {sections.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="toc__link"
              aria-current={id === active ? "location" : undefined}
            >
              {label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
