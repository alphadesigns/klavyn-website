"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@/components/icons";
import {
  DARK_SCHEME_QUERY,
  THEME_ATTRIBUTE,
  THEME_CHANGE_EVENT,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  nextTheme,
  parseTheme,
  resolveTheme,
  withTransitionsSuppressed,
  type Theme,
} from "@/lib/theme";

function readTheme(): Theme {
  const saved = parseTheme(document.documentElement.getAttribute(THEME_ATTRIBUTE));
  return resolveTheme(saved, window.matchMedia(DARK_SCHEME_QUERY).matches);
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DARK_SCHEME_QUERY);
  media.addEventListener("change", onChange);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

function applyTheme(theme: Theme) {
  withTransitionsSuppressed(() => {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute("content", THEME_COLORS[theme]));
  }, window);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);  } catch (error) {
    // Storage can be blocked (private mode, site data off); the switch still
    // applies for this page view, it just will not be remembered.
    console.warn(`Could not save theme "${theme}" to localStorage`, error);
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

/**
 * Header switch between the light and dark themes. A toggle button with a
 * stable name ("Dark theme") whose pressed state says which is on. The icon
 * is chosen in CSS from the theme on <html>, so it is right before hydration;
 * aria-pressed is left off until the client knows the theme.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme | null>(subscribe, readTheme, () => null);

  return (
    <button
      type="button"
      className="btn btn--secondary btn--sm btn--icon theme-toggle"
      aria-pressed={theme === null ? undefined : theme === "dark"}
      onClick={() => applyTheme(nextTheme(readTheme()))}
    >
      <MoonIcon className="theme-toggle__icon theme-toggle__moon" />
      <SunIcon className="theme-toggle__icon theme-toggle__sun" />
      <span className="visually-hidden">Dark theme</span>
    </button>
  );
}
