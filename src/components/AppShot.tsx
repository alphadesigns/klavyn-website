import Image from "next/image";
import type { CaptionedScreenshot, Screenshot } from "@/content/screenshots";

type AppShotProps = {
  shot: Screenshot;
  /**
   * How wide the picture is drawn at each viewport width, as a `sizes` value.
   * It decides which resolution the browser downloads, so it should match the
   * layout the picture sits in.
   */
  sizes: string;
  /** Load straight away. Only for a picture visible when the page opens. */
  priority?: boolean;
  className?: string;
};

/**
 * One app screenshot in a frame: a window edge for the desktop app, a phone
 * body for the phone apps.
 */
export function AppShot({ shot, sizes, priority = false, className }: AppShotProps) {
  const frame = shot.platform === "desktop" ? "shot--desktop" : "shot--phone";
  return (
    <span className={["shot", frame, className].filter(Boolean).join(" ")}>
      <Image src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} sizes={sizes} priority={priority} />
    </span>
  );
}

/** A framed screenshot with its caption underneath. */
export function AppFigure({ item, sizes, className }: { item: CaptionedScreenshot; sizes: string; className?: string }) {
  return (
    <figure className={["shot-figure", className].filter(Boolean).join(" ")}>
      <AppShot shot={item.shot} sizes={sizes} />
      <figcaption>{item.caption}</figcaption>
    </figure>
  );
}
