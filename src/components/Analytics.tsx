"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { createTracker, downloadPlatformOf, type PrivacySignals, type Tracker } from "@/lib/analytics";

/**
 * Created on first use and kept for the life of the page load, so every
 * event from one load shares one random id and a reload gets a new one.
 * `undefined` means not created yet; `null` means counting is off.
 */
let tracker: Tracker | null | undefined;

function getTracker(): Tracker | null {
  if (tracker !== undefined) return tracker;
  tracker = createTracker({
    // Inlined at build time; unset means the site sends nothing.
    apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    signals: navigator as Navigator & PrivacySignals,
    transport: {
      sendBeacon: (url, body) => navigator.sendBeacon(url, body),
      fetch: (url, init) => fetch(url, init),
    },
    randomUUID: typeof crypto.randomUUID === "function" ? () => crypto.randomUUID() : undefined,
  });
  return tracker;
}

/**
 * Counts page views and download clicks. Mounted once in the root layout;
 * renders nothing. See src/lib/analytics.ts for what is and is not sent.
 */
export function Analytics() {
  const pathname = usePathname();
  // The path last counted, so React's development double-run of effects
  // does not count one view twice.
  const countedPathname = useRef<string | null>(null);

  useEffect(() => {
    const active = getTracker();
    if (active === null || countedPathname.current === pathname) return;
    const isFirstView = countedPathname.current === null;
    countedPathname.current = pathname;
    // document.referrer never changes after the first load, so a client-side
    // navigation names this site as the referrer rather than repeating it.
    active.pageview(window.location.href, isFirstView ? document.referrer : window.location.origin);
  }, [pathname]);

  useEffect(() => {
    const active = getTracker();
    if (active === null) return;
    const countDownloadClick = (event: MouseEvent) => {
      const platform = downloadPlatformOf(event.target);
      if (platform !== null) active.downloadClicked(platform);
    };
    // Capture phase and passive: sees every click first, and can never
    // delay or cancel the link's own navigation.
    document.addEventListener("click", countDownloadClick, { capture: true, passive: true });
    return () => document.removeEventListener("click", countDownloadClick, { capture: true });
  }, []);

  return null;
}
