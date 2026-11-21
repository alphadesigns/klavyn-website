import { STATUS_LABELS, platformLink, type Platform } from "@/content/download";

/**
 * The status pill on a platform card. A platform that can be had today gets
 * a link, since its label ("Download now", "Join on TestFlight") reads as an
 * action: to the releases page for an installer, to the invitation for a
 * TestFlight beta. The other statuses are plain text because there is
 * nothing to fetch. A link carries its platform id for the download-click count.
 */
export function PlatformStatus({ platform }: { platform: Pick<Platform, "id" | "name" | "status" | "link"> }) {
  const label = STATUS_LABELS[platform.status];
  const href = platformLink(platform);
  if (href === null) {
    return <span className="platform__status">{label}</span>;
  }
  return (
    <a href={href} className="platform__status" data-download-platform={platform.id}>
      {label}
      {/* Two cards can carry the same label; the name tells the links apart. */}
      <span className="visually-hidden"> for {platform.name}</span>
    </a>
  );
}
