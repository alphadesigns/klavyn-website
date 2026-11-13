import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

type Crumb = { name: string; path: string };

/** Visible breadcrumb plus matching BreadcrumbList data. The last crumb is the current page. */
export function Breadcrumb({ trail }: { trail: readonly Crumb[] }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol>
        {trail.map((crumb, index) =>
          index === trail.length - 1 ? (
            <li key={crumb.path} aria-current="page">
              {crumb.name}
            </li>
          ) : (
            <li key={crumb.path}>
              <Link href={crumb.path}>{crumb.name}</Link>
            </li>
          ),
        )}
      </ol>
      <JsonLd data={breadcrumbJsonLd(trail)} />
    </nav>
  );
}
