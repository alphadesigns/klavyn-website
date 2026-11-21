"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { createPageCounter, createTracker, type PrivacySignals } from "@/lib/analytics";

/**
 * One counter for the life of the document. It decides everything (what to
 * count, when to forget the id); this module only feeds it browser events.
 */
const counter = createPageCounter(() =>
  createTracker({
    // Inlined at build time; unset means the site sends nothing.
    apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    signals: navigator as Navigator & PrivacySignals,
    fetch: (url, init) => fetch(url, init),
    randomUUID: typeof crypto.randomUUID === "function" ? () => crypto.randomUUID() : undefined,
  }),
);

/**
 * Counts page views and download clicks. Mounted once in the root layout;
 * renders nothing. See src/lib/analytics.ts for what is and is not sent.
 */
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    counter.routeChanged(window.location, document.referrer);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => counter.clicked(event.target);
    const onPageHide = () => counter.pageHidden();
    const onPageShow = (event: PageTransitionEvent) => counter.pageShown(event.persisted, window.location);
    // Capture phase and passive: sees every click first, and can never
    // delay or cancel the link's own navigation.
    document.addEventListener("click", onClick, { capture: true, passive: true });
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return null;
}
