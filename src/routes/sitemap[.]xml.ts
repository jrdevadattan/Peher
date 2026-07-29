import { createFileRoute } from "@tanstack/react-router";
import { getProducts, getStorefrontSettings } from "@/lib/catalog-api";
import { absoluteUrl, escapeXml, PUBLIC_ROUTES } from "@/lib/seo";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [products, settings] = await Promise.all([
          getProducts(),
          getStorefrontSettings(),
        ]);
        const staticUrls = PUBLIC_ROUTES.map(
          (path) => `<url><loc>${escapeXml(absoluteUrl(settings, path))}</loc></url>`,
        );
        const productUrls = products.map(
          (product) =>
            `<url><loc>${escapeXml(absoluteUrl(settings, `/product/${product.id}`))}</loc>` +
            `<lastmod>${escapeXml(product.updatedAt.slice(0, 10))}</lastmod></url>`,
        );
        const sitemap =
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
          [...staticUrls, ...productUrls].join("") +
          "</urlset>";

        return new Response(sitemap, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=300, s-maxage=3600",
          },
        });
      },
    },
  },
});
