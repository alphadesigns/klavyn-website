import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME,
  NO_TRANSITIONS_CSS,
  THEME_ATTRIBUTE,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  nextTheme,
  parseTheme,
  resolveTheme,
  themeInitScript,
  withTransitionsSuppressed,
  type TransitionEnv,
} from "@/lib/theme";

describe("parseTheme", () => {
  it("accepts the two themes", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
  });

  it("rejects anything else", () => {
    for (const value of [null, undefined, "", "system", "Dark", 1, {}]) {
      expect(parseTheme(value)).toBeNull();
    }
  });
});

describe("resolveTheme", () => {
  it("is light when nothing is saved", () => {
    expect(DEFAULT_THEME).toBe("light");
    expect(resolveTheme(null)).toBe("light");
  });

  it("keeps a saved choice", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });
});

describe("nextTheme", () => {
  it("flips between light and dark", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });
});

/** Runs the head script against a minimal stand-in for the browser. */
function runInitScript(storage: { getItem(key: string): string | null }) {
  const attributes = new Map<string, string>();
  const metas = [new Map<string, string>(), new Map<string, string>()];
  const document = {
    documentElement: { setAttribute: (k: string, v: string) => attributes.set(k, v) },
    querySelectorAll: () => metas.map((m) => ({ setAttribute: (k: string, v: string) => m.set(k, v) })),
  };
  new Function("localStorage", "document", themeInitScript)(storage, document);
  return { attributes, metas };
}

describe("themeInitScript", () => {
  it("applies a saved theme and its browser colour", () => {
    const { attributes, metas } = runInitScript({ getItem: () => "light" });
    expect(attributes.get(THEME_ATTRIBUTE)).toBe("light");
    for (const meta of metas) expect(meta.get("content")).toBe(THEME_COLORS.light);
  });

  it("reads the shared storage key", () => {
    const keys: string[] = [];
    runInitScript({ getItem: (k) => (keys.push(k), null) });
    expect(keys).toEqual([THEME_STORAGE_KEY]);
  });

  it("leaves the page on the default theme when nothing valid is saved", () => {
    for (const saved of [null, "system", "<script>"]) {
      const { attributes, metas } = runInitScript({ getItem: () => saved });
      expect(attributes.size).toBe(0);
      for (const meta of metas) expect(meta.size).toBe(0);
    }
  });

  it("does not throw when storage is blocked", () => {
    const blocked = {
      getItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(() => runInitScript(blocked)).not.toThrow();
  });
});

describe("withTransitionsSuppressed", () => {
  /** A stub browser that records the order of events. */
  function makeEnv() {
    const log: string[] = [];
    const frames: (() => void)[] = [];
    const style = {
      textContent: "",
      remove: () => log.push("style removed"),
    };
    const env = {
      document: {
        createElement: () => style,
        head: { appendChild: () => log.push("style added") },
        body: {},
      },
      getComputedStyle: () => {
        log.push("flush");
        return { opacity: "1" };
      },
      requestAnimationFrame: (cb: () => void) => frames.push(cb),
    };
    return { env: env as unknown as TransitionEnv, log, frames, style };
  }

  it("applies the change with transitions off, then restores them a frame later", () => {
    const { env, log, frames, style } = makeEnv();
    withTransitionsSuppressed(() => log.push("apply"), env);
    expect(style.textContent).toBe(NO_TRANSITIONS_CSS);
    expect(log).toEqual(["style added", "apply", "flush"]);
    frames.forEach((cb) => cb());
    expect(log.at(-1)).toBe("style removed");
  });

  it("still restores transitions when the change throws", () => {
    const { env, log, frames } = makeEnv();
    expect(() =>
      withTransitionsSuppressed(() => {
        throw new Error("boom");
      }, env),
    ).toThrow("boom");
    frames.forEach((cb) => cb());
    expect(log).toEqual(["style added", "flush", "style removed"]);
  });

  it("exempts the toggle's icon cross-fade", () => {
    expect(NO_TRANSITIONS_CSS).toContain(":not(.theme-toggle__icon)");
  });
});
