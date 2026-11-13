/**
 * Text "decrypt" effect: one frame of a string turning into another. Characters
 * left of the moving boundary already show the target, a short band at the
 * boundary shows random glyphs, and the rest still shows the source.
 */

export const SCRAMBLE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** How many characters at the boundary show noise while the text resolves. */
const NOISE_BAND = 4;

/**
 * @param progress 0 shows `from`, 1 shows `to`; values outside are clamped.
 * @param random returns a number in [0, 1); injectable so tests are stable.
 */
export function scrambleFrame(
  from: string,
  to: string,
  progress: number,
  random: () => number = Math.random,
): string {
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  if (p === 0) return from;
  if (p === 1) return to;

  const length = Math.max(from.length, to.length);
  // The boundary sweeps past the end so the noise band clears before p = 1.
  const resolved = Math.floor(p * (length + NOISE_BAND));
  let out = "";
  for (let i = 0; i < length; i++) {
    if (i < resolved) out += to[i] ?? "";
    else if (i < resolved + NOISE_BAND) out += SCRAMBLE_GLYPHS[Math.floor(random() * SCRAMBLE_GLYPHS.length)];
    else out += from[i] ?? "";
  }
  return out;
}
