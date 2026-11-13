import type { MetadataRoute } from "next";
import { absoluteUrl, routes } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, changeFrequency, priority }) => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
  }));
}
