"use client";

import { useEffect, useRef, useState } from "react";
import { KeyIcon, LaptopIcon, LockIcon, ServerIcon } from "@/components/icons";
import { scrambleFrame } from "@/lib/scramble";

/** Same length as the ciphertext, so the scramble sweeps evenly. */
const PLAINTEXT = "correct-horse-battery-staple";
const CIPHERTEXT = "q8Zt1v0Xa9LmR2cB7yJpE4kWfN6s";
/** Stored readable so lists and invites can show it; matches the hero mock. */
const SECRET_NAME = "GitHub";
const SCRAMBLE_MS = 700;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
/**
 * A step becomes active when it crosses a thin band about two-thirds down the
 * viewport: below the pinned stage on phones, near the middle on desktop.
 */
const ACTIVE_BAND = "-65% 0px -30% 0px";

const STEPS = [
  {
    title: "It starts with a secret",
    body: "You save a password in the app. Right now it exists in exactly one place: the screen in front of you.",
  },
  {
    title: "Your passphrase becomes a key",
    body: "Argon2id stretches your passphrase into an encryption key, on your device. The passphrase itself is never sent anywhere.",
  },
  {
    title: "The secret is sealed before it leaves",
    body: "Each secret gets its own AES-256-GCM key. Username, password, notes and custom fields are encrypted together.",
  },
  {
    title: "Only ciphertext crosses the wire",
    body: "What travels to your server is the secret’s name and random-looking bytes. Strip away TLS and the name is all anyone could read.",
  },
  {
    title: "The server keeps what it can’t open",
    body: "Your server stores the blob and a name for it. Breach it, and an attacker walks away with ciphertext and no keys.",
  },
] as const;

/** Index of the step crossing the active band, tracked with one observer. */
function useActiveStep(count: number) {
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = refs.current.indexOf(entry.target as HTMLLIElement);
          if (index !== -1) setActive(index);
        }
      },
      { rootMargin: ACTIVE_BAND },
    );
    for (const el of refs.current.slice(0, count)) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [count]);

  return { active, refs };
}

/** Shows `target`, scrambling from the previous text whenever it changes. */
function useScrambledText(target: string) {
  const [text, setText] = useState(target);
  const shown = useRef(target);

  useEffect(() => {
    const from = shown.current;
    if (from === target) return;
    const instant = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = instant ? 1 : (now - start) / SCRAMBLE_MS;
      const next = scrambleFrame(from, target, progress);
      shown.current = next;
      setText(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return text;
}

/**
 * "The life of a secret": steps scroll past a pinned picture of a device and
 * a server, and the picture follows along. The steps carry the meaning, so
 * the picture is hidden from assistive tech and the section reads fine with
 * no JavaScript (the picture then rests on its first state).
 */
export function SecretStory() {
  const { active, refs } = useActiveStep(STEPS.length);
  const value = useScrambledText(active >= 2 ? CIPHERTEXT : PLAINTEXT);
  const on = (step: number) => active >= step;

  return (
    <section className="section story" aria-labelledby="story-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">How it works</span>
          <h2 id="story-title" className="section-title">
            The life of a secret
          </h2>
          <p className="section-lede">
            Follow one password from your keyboard to your server, and see why
            the server never learns what it is.
          </p>
        </div>

        <div className="story__grid">
          <div className="story__stage" data-step={active} aria-hidden="true">
            <div className="story__progress">
              <span>
                {String(active + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
              </span>
              <span className="story__bar">
                <span style={{ transform: `scaleX(${(active + 1) / STEPS.length})` }} />
              </span>
            </div>

            <div className="story__card" data-on={on(0)}>
              <div className="story__card-head">
                <LaptopIcon /> Your device
              </div>
              <div className="story__field">
                <span className="story__label">Password</span>
                <span className="story__value" data-sealed={on(2)}>
                  {value}
                </span>
              </div>
              <div className="story__chips">
                <span className="story__chip" data-on={on(1)}>
                  <KeyIcon /> Argon2id key · 7F3A 91C2
                </span>
                <span className="story__chip story__chip--seal" data-on={on(2)}>
                  <LockIcon /> AES-256-GCM
                </span>
              </div>
            </div>

            <div className="story__wire" data-on={on(3)}>
              <span className="story__packet" data-arrived={on(4)} />
              <span className="story__wire-label">TLS → your server</span>
            </div>

            <div className="story__card story__card--server" data-on={on(4)}>
              <div className="story__card-head">
                <ServerIcon /> Your server
              </div>
              <div className="story__field">
                <span className="story__label">Stored</span>
                <span className="story__value story__value--stored">
                  {on(4) ? `name: "${SECRET_NAME}", blob: "${CIPHERTEXT}…"` : "waiting for data…"}
                </span>
              </div>
              <span className="story__verdict" data-on={on(4)}>
                No key here. Only the name is readable.
              </span>
            </div>
          </div>

          <ol className="story__steps">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                className="story__step"
              >
                <span className="story__step-num">{String(i + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
