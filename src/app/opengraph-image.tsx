import { ImageResponse } from "next/og";
import { logo } from "@/lib/logo";
import { site } from "@/lib/site";

export const alt = `${site.name}: the password manager you host yourself`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social card, generated at build time so it always matches the brand. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "radial-gradient(circle at 85% 10%, #1d5a52 0%, #123f3a 55%)",
          color: "#f2efe7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width={64} height={64} viewBox={logo.viewBox}>
            <rect width={300} height={300} rx={logo.tileRadius} fill={logo.colors.evergreen} />
            <path d={logo.paths.castle} fill={logo.colors.ivory} />
            <path d={logo.paths.arch} fill={logo.colors.evergreen} />
            <path d={logo.paths.portcullis} fill={logo.colors.ivory} />
          </svg>
          <div style={{ fontSize: 40, fontWeight: 700 }}>{site.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            Your passwords. Your server.
          </div>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, color: "#a6dcca" }}>
            Nobody else’s keys.
          </div>
        </div>
        <div style={{ display: "flex", gap: 32, fontSize: 26, color: "#b3c4bd" }}>
          <span>End-to-end encrypted</span>
          <span>·</span>
          <span>Self-hosted</span>
          <span>·</span>
          <span>Free & open source</span>
        </div>
      </div>
    ),
    size,
  );
}
