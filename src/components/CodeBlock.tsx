"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";

/** How long the button shows its result before resetting. */
const RESULT_RESET_MS = 2000;
/** A failure tells the reader what to do instead, so it stays up longer. */
const FAILURE_RESET_MS = 6000;

type CopyState = "idle" | "copied" | "failed";

const LABELS: Record<CopyState, string> = {
  idle: "Copy",
  copied: "Copied",
  failed: "Selected. Copy it manually",
};

const ANNOUNCEMENTS: Record<CopyState, string> = {
  idle: "",
  copied: "Commands copied to the clipboard",
  failed: "Couldn’t copy automatically. The commands are selected; copy them with your keyboard.",
};

type Props = {
  /** Names the snippet in the bar and in the button's accessible name; keep it unique per page. */
  title: string;
  /** Exactly what lands on the clipboard: commands only, no prompts or comments. */
  copyText: string;
  /** The rendered code, which may include prompts and comments. */
  children: React.ReactNode;
};

export function CodeBlock({ title, copyText, children }: Props) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const code = useRef<HTMLElement>(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    clearTimeout(timer.current);
    let next: CopyState;
    try {
      await navigator.clipboard.writeText(copyText);
      next = "copied";
    } catch (error) {
      // Clipboard access can be denied (insecure context, permissions).
      // Select the text so the reader's own copy shortcut works, and say so.
      console.error(`Copying the "${title}" snippet failed`, error);
      if (code.current) window.getSelection()?.selectAllChildren(code.current);
      next = "failed";
    }
    setState(next);
    timer.current = setTimeout(
      () => setState("idle"),
      next === "failed" ? FAILURE_RESET_MS : RESULT_RESET_MS,
    );
  }

  return (
    <div className="code">
      <div className="code__bar">
        <span>{title}</span>
        <button type="button" className="code__copy" onClick={copy}>
          {/* Both icons stay mounted so the swap can cross-fade instead of jumping. */}
          <span className="code__icon" data-copied={state === "copied"} aria-hidden="true">
            <CopyIcon className="code__icon-copy" />
            <CheckIcon className="code__icon-check" />
          </span>
          {LABELS[state]}
          <span className="visually-hidden"> {title} commands</span>
        </button>
        <span className="visually-hidden" role="status">
          {ANNOUNCEMENTS[state]}
        </span>
      </div>
      <pre tabIndex={0} aria-label={`${title} commands`}>
        <code ref={code}>{children}</code>
      </pre>
    </div>
  );
}
