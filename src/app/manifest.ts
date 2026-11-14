import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { THEME_COLORS } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: THEME_COLORS.light,
    theme_color: site.themeColor,
    icons: [
      { src: "/icon.png", sizes: "1024x1024", type: "image/png" },
      { src: "/logo.png", sizes: "256x256", type: "image/png" },
    ],
  };
}
