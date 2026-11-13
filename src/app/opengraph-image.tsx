import { ImageResponse } from "next/og";
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
          background: "radial-gradient(circle at 85% 10%, #134b45 0%, #0b1211 55%)",
          color: "#e8f0ee",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#0f766e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 26, height: 26, borderRadius: 13, border: "6px solid #fff" }} />
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>{site.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            Your passwords. Your server.
          </div>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, color: "#2fc4b2" }}>
            Nobody else’s keys.
          </div>
        </div>
        <div style={{ display: "flex", gap: 32, fontSize: 26, color: "#9fb3ae" }}>
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
