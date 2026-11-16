import { STATUS_LABELS, releasesUrl, type Platform } from "@/content/download";

/**
 * The status pill on a platform card. A platform with an installer gets a
 * link to the releases page, since its label ("Download now") reads as an
 * action; the other statuses are plain text because there is nothing to fetch.
 */
export function PlatformStatus({ platform }: { platform: Pick<Platform, "name" | "status"> }) {
  const label = STATUS_LABELS[platform.status];
  if (platform.status !== "available") {
    return <span className="platform__status">{label}</span>;
  }
  return (
    <a href={releasesUrl} className="platform__status">
      {label}
      {/* Two cards can carry the same label; the name tells the links apart. */}
      <span className="visually-hidden"> for {platform.name}</span>
    </a>
  );
}
