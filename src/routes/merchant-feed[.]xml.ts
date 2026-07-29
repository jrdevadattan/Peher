import { createFileRoute } from "@tanstack/react-router";
import { getProducts, getStorefrontSettings } from "@/lib/catalog-api";
import { absoluteUrl, escapeXml } from "@/lib/seo";

export const Route = createFileRoute("/merchant-feed.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [products, settings] = await Promise.all([
          getProducts(),
          getStorefrontSettings(),
        ]);
        const items = products.map((product) => {
          const productUrl = absoluteUrl(settings, `/product/${product.id}`);
          const shippingPrice =
            product.price >= settings.freeShippingThreshold
              ? 0
              : settings.standardShippingRate;
          const identifiers = [
            product.gtin ? `<g:gtin>${escapeXml(product.gtin)}</g:gtin>` : "",
            product.mpn ? `<g:mpn>${escapeXml(product.mpn)}</g:mpn>` : "",
            `<g:identifier_exists>${product.gtin || product.mpn ? "yes" : "no"}</g:identifier_exists>`,
          ].join("");
          const additionalImages = product.images
            .filter((image) => image !== product.image)
            .slice(0, 10)
            .map((image) => `<g:additional_image_link>${escapeXml(image)}</g:additional_image_link>`)
            .join("");

          return [
            "<item>",
            `<g:id>${escapeXml(product.sku)}</g:id>`,
            `<title>${escapeXml(product.name)}</title>`,
            `<link>${escapeXml(productUrl)}</link>`,
            `<description>${escapeXml(product.description || product.shortDescription)}</description>`,
            `<g:image_link>${escapeXml(product.image)}</g:image_link>`,
            additionalImages,
            `<g:availability>${product.outOfStock ? "out_of_stock" : "in_stock"}</g:availability>`,
            "<g:condition>new</g:condition>",
            `<g:price>${product.price.toFixed(2)} ${escapeXml(settings.currencyCode)}</g:price>`,
            `<g:brand>${escapeXml(product.brand || settings.storeName)}</g:brand>`,
            identifiers,
            `<g:product_type>${escapeXml(`Jewellery > ${product.category}`)}</g:product_type>`,
            product.material ? `<g:material>${escapeXml(product.material)}</g:material>` : "",
            "<g:shipping>",
            "<g:country>IN</g:country>",
            "<g:service>Standard</g:service>",
            `<g:price>${shippingPrice.toFixed(2)} ${escapeXml(settings.currencyCode)}</g:price>`,
            "</g:shipping>",
            "</item>",
          ].join("");
        });

        const feed = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
          "<channel>",
          `<title>${escapeXml(`${settings.storeName} product feed`)}</title>`,
          `<link>${escapeXml(settings.publicSiteUrl)}</link>`,
          `<description>${escapeXml(settings.metaDescription)}</description>`,
          ...items,
          "</channel>",
          "</rss>",
        ].join("");

        return new Response(feed, {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=300, s-maxage=3600",
          },
        });
      },
    },
  },
});
