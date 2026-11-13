"use client";

import Link from "next/link";
import { useRef } from "react";
import { nav } from "@/lib/site";

/**
 * Navigation for narrow screens. A native <details> disclosure, so it opens
 * with Enter or Space and announces its expanded state without ARIA. Closes
 * when a link is chosen (same-page anchors do not unmount it) or on Escape,
 * returning focus to the toggle.
 */
export function MobileMenu() {
  const menu = useRef<HTMLDetailsElement>(null);

  function close({ restoreFocus }: { restoreFocus: boolean }) {
    const el = menu.current;
    if (!el?.open) return;
    el.open = false;
    if (restoreFocus) el.querySelector("summary")?.focus();
  }

  return (
    <details
      ref={menu}
      className="mobile-menu"
      onKeyDown={(event) => {
        if (event.key === "Escape") close({ restoreFocus: true });
      }}
    >
      <summary className="btn btn--secondary btn--sm">Menu</summary>
      <ul className="mobile-menu__panel">
        {nav.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="site-nav__link"
              onClick={() => close({ restoreFocus: false })}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
