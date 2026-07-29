import { createFileRoute } from "@tanstack/react-router";
import { getStorefrontSettings } from "@/lib/catalog-api";
import { absoluteUrl } from "@/lib/seo";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const settings = await getStorefrontSettings();
        const robots = [
          "User-agent: *",
          "Allow: /",
          "Disallow: /admin",
          "Disallow: /dashboard",
          "Disallow: /checkout",
          "Disallow: /cart",
          "Disallow: /wishlist",
          "Disallow: /login",
          "Disallow: /signup",
          "",
          `Sitemap: ${absoluteUrl(settings, "/sitemap.xml")}`,
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
