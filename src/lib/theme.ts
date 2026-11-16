/**
 * Colour theme selection. The site is light unless the reader picks dark
 * with the header toggle; the system setting (prefers-color-scheme) is
 * deliberately not consulted. The choice is saved in localStorage and applied
 * as `data-theme` on <html>, which the tokens in globals.css read through
 * `color-scheme` and `light-dark()`.
 */

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "klavyn-theme";
export const THEME_ATTRIBUTE = "data-theme";
/** Fired on window after the theme changes, so toggles stay in sync. */
export const THEME_CHANGE_EVENT = "klavyn:themechange";
/** The theme a first-time visitor sees; matches `color-scheme` on :root in globals.css. */
export const DEFAULT_THEME: Theme = "light";

/** Browser UI colour per theme; matches --bg in globals.css. */
export const THEME_COLORS: Readonly<Record<Theme, string>> = {
  light: "#f7f5ef",
  dark: "#0a1715",
};

/** Narrows an untrusted stored value to a theme, or null when it is not one. */
export function parseTheme(value: unknown): Theme | null {
  return value === "light" || value === "dark" ? value : null;
}

/** The theme in effect: the saved choice, else the default. */
export function resolveTheme(saved: Theme | null): Theme {
  return saved ?? DEFAULT_THEME;
}

/** The theme a toggle press switches to. */
export function nextTheme(current: Theme): Theme {
  return current === "dark" ? "light" : "dark";
}

/**
 * Inline script for <head> that applies a saved theme before first paint,
 * so a reader who chose dark does not see a light flash.
 * Built only from the constants above; no user input reaches it.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t!=="light"&&t!=="dark")return;document.documentElement.setAttribute(${JSON.stringify(
  THEME_ATTRIBUTE,
)},t);var c=${JSON.stringify(THEME_COLORS)}[t];document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute("content",c)})}catch(e){}})();`;

/**
 * Stylesheet that freezes colour transitions during a theme swap, so every
 * element changes at once instead of each fading at its own speed. The
 * toggle's own icon cross-fade is exempt.
 */
export const NO_TRANSITIONS_CSS =
  "*:not(.theme-toggle__icon),*::before,*::after{transition:none!important}";

/** The slice of the browser that withTransitionsSuppressed touches. */
export interface TransitionEnv {
  document: Pick<Document, "createElement" | "head" | "body">;
  getComputedStyle: (el: Element) => Pick<CSSStyleDeclaration, "opacity">;
  requestAnimationFrame: (cb: () => void) => unknown;
}

/**
 * Runs `apply` with CSS transitions switched off, then restores them after
 * the next frame. The forced style read in between makes the browser commit
 * the new colours before transitions come back.
 */
export function withTransitionsSuppressed(apply: () => void, env: TransitionEnv): void {
  const style = env.document.createElement("style");
  style.textContent = NO_TRANSITIONS_CSS;
  env.document.head.appendChild(style);
  try {
    apply();
  } finally {
    // Reading a computed value forces a style flush with transitions off.
    void env.getComputedStyle(env.document.body).opacity;
    env.requestAnimationFrame(() => style.remove());
  }
}
