import { createFileRoute } from "@tanstack/react-router";
import { getStorefrontSettings } from "@/lib/catalog-api";
import { absoluteUrl } from "@/lib/seo";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const settings = await getStorefrontSettings();
        const robots = [
          "# PEHER permits all standards-compliant search and AI crawlers.",
          "User-agent: *",
          "Allow: /",
          "",
          `Sitemap: ${absoluteUrl(settings, "/sitemap.xml")}`,
          `# AI-readable site guide: ${absoluteUrl(settings, "/llms.txt")}`,
          "",
        ].join("\n");

        return new Response(robots, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=300, s-maxage=3600",
          },
        });
      },
    },
  },
});
