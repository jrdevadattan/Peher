import { createFileRoute } from "@tanstack/react-router";
import { getProducts, getSeoPages, getStorefrontSettings } from "@/lib/catalog-api";
import { absoluteUrl } from "@/lib/seo";

function singleLine(value: unknown) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function markdownLink(label: string, url: string, description: string) {
  const safeLabel = singleLine(label).replace(/[[\]]/g, "");
  const safeDescription = singleLine(description);
  return `- [${safeLabel}](${url})${safeDescription ? `: ${safeDescription}` : ""}`;
}

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () => {
        const [products, pages, settings] = await Promise.all([
          getProducts(),
          getSeoPages(),
          getStorefrontSettings(),
        ]);
        const corePages = pages
          .filter((page) => page.includeInLlms)
          .map((page) =>
            markdownLink(page.title, absoluteUrl(settings, page.path), page.description),
          );
        const productPages = products.map((product) =>
          markdownLink(
            product.name,
            absoluteUrl(settings, `/product/${product.id}`),
            product.shortDescription || product.description,
          ),
        );
        const content = [
          `# ${singleLine(settings.storeName)}`,
          "",
          `> ${singleLine(settings.metaDescription || settings.tagline)}`,
          "",
          `${singleLine(settings.storeName)} is an online jewellery atelier serving customers across India. Product prices, stock, specifications, shipping information, and approved customer reviews are maintained in Supabase and rendered on the canonical product pages below.`,
          "",
          "## Core pages",
          "",
          ...corePages,
          "",
          "## Products",
          "",
          ...productPages,
          "",
          "## Machine-readable resources",
          "",
          markdownLink(
            "XML sitemap",
            absoluteUrl(settings, "/sitemap.xml"),
            "Canonical public pages and published products with accurate last-modified dates.",
          ),
          markdownLink(
            "Merchant product feed",
            absoluteUrl(settings, "/merchant-feed.xml"),
            "Live product, variant, price, stock, shipping, and identifier data.",
          ),
          markdownLink(
            "Crawler policy",
            absoluteUrl(settings, "/robots.txt"),
            "All standards-compliant crawlers are allowed.",
          ),
          "",
          "## Contact",
          "",
          `- Email: ${singleLine(settings.contactEmail)}`,
          `- Website: ${settings.publicSiteUrl}`,
          "",
        ].join("\n");

        return new Response(content, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=300, s-maxage=3600",
          },
        });
      },
    },
  },
});
