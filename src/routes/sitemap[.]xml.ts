import { createFileRoute } from "@tanstack/react-router";
import { getProducts, getSeoPages, getStorefrontSettings } from "@/lib/catalog-api";
import { absoluteUrl, escapeXml } from "@/lib/seo";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [products, pages, settings] = await Promise.all([
          getProducts(),
          getSeoPages(),
          getStorefrontSettings(),
        ]);
        const pageUrls = pages
          .filter((page) => page.includeInSitemap)
          .map(
            (page) =>
              `<url><loc>${escapeXml(absoluteUrl(settings, page.path))}</loc>` +
              `<lastmod>${escapeXml(page.updatedAt.slice(0, 10))}</lastmod></url>`,
          );
        const productUrls = products.map((product) => {
          const images = product.images
            .slice(0, 1000)
            .map(
              (image) =>
                `<image:image><image:loc>${escapeXml(image)}</image:loc>` +
                `<image:title>${escapeXml(product.name)}</image:title></image:image>`,
            )
            .join("");
          return (
            `<url><loc>${escapeXml(absoluteUrl(settings, `/product/${product.id}`))}</loc>` +
            `<lastmod>${escapeXml(product.updatedAt.slice(0, 10))}</lastmod>${images}</url>`
          );
        });
        const sitemap =
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
          'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' +
          [...pageUrls, ...productUrls].join("") +
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
