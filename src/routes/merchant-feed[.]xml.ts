import { createFileRoute } from "@tanstack/react-router";
import { getProducts, getStorefrontSettings } from "@/lib/catalog-api";
import { absoluteUrl, escapeXml } from "@/lib/seo";

export const Route = createFileRoute("/merchant-feed.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [products, settings] = await Promise.all([getProducts(), getStorefrontSettings()]);
        const items = products.flatMap((product) => {
          const productUrl = absoluteUrl(settings, `/product/${product.id}`);
          const additionalImages = product.images
            .filter((image) => image !== product.image)
            .slice(0, 10)
            .map(
              (image) => `<g:additional_image_link>${escapeXml(image)}</g:additional_image_link>`,
            )
            .join("");
          const productDetails = [
            ["Material", product.material],
            ["Weight", product.weight],
            ["Dimensions", product.dimensions],
          ]
            .filter(([, value]) => value)
            .map(
              ([name, value]) =>
                "<g:product_detail>" +
                "<g:section_name>Specifications</g:section_name>" +
                `<g:attribute_name>${escapeXml(name)}</g:attribute_name>` +
                `<g:attribute_value>${escapeXml(value)}</g:attribute_value>` +
                "</g:product_detail>",
            )
            .join("");
          const feedVariants = product.variants.length
            ? product.variants
            : [
                {
                  id: undefined,
                  sku: product.sku,
                  price: product.price,
                  stock: product.stock,
                  size: undefined,
                  color: undefined,
                },
              ];

          return feedVariants.map((variant) => {
            const variantLabel = [variant.size, variant.color].filter(Boolean).join(" / ");
            const variantUrl = variant.id
              ? `${productUrl}?variant=${encodeURIComponent(variant.id)}`
              : productUrl;
            const shippingPrice =
              variant.price >= settings.freeShippingThreshold ? 0 : settings.standardShippingRate;
            // Parent identifiers cannot truthfully identify several distinct variants.
            const hasIdentifiers = !product.variants.length && Boolean(product.gtin || product.mpn);
            const identifiers = [
              hasIdentifiers && product.gtin ? `<g:gtin>${escapeXml(product.gtin)}</g:gtin>` : "",
              hasIdentifiers && product.mpn ? `<g:mpn>${escapeXml(product.mpn)}</g:mpn>` : "",
              `<g:identifier_exists>${hasIdentifiers ? "yes" : "no"}</g:identifier_exists>`,
            ].join("");

            return [
              "<item>",
              `<g:id>${escapeXml(variant.sku)}</g:id>`,
              `<title>${escapeXml(variantLabel ? `${product.name} - ${variantLabel}` : product.name)}</title>`,
              `<link>${escapeXml(variantUrl)}</link>`,
              `<description>${escapeXml(product.description || product.shortDescription)}</description>`,
              `<g:image_link>${escapeXml(product.image)}</g:image_link>`,
              additionalImages,
              `<g:availability>${variant.stock <= 0 ? "out_of_stock" : "in_stock"}</g:availability>`,
              "<g:condition>new</g:condition>",
              `<g:price>${variant.price.toFixed(2)} ${escapeXml(settings.currencyCode)}</g:price>`,
              `<g:brand>${escapeXml(product.brand || settings.storeName)}</g:brand>`,
              identifiers,
              product.variants.length
                ? `<g:item_group_id>${escapeXml(product.sku)}</g:item_group_id>`
                : "",
              variant.size ? `<g:size>${escapeXml(variant.size)}</g:size>` : "",
              variant.color
                ? `<g:color>${escapeXml(variant.color)}</g:color>`
                : product.material
                  ? `<g:color>${escapeXml(product.material)}</g:color>`
                  : "",
              `<g:google_product_category>${escapeXml("Apparel & Accessories > Jewelry")}</g:google_product_category>`,
              `<g:product_type>${escapeXml(`Jewellery > ${product.category}`)}</g:product_type>`,
              "<g:age_group>adult</g:age_group>",
              "<g:gender>unisex</g:gender>",
              product.material ? `<g:material>${escapeXml(product.material)}</g:material>` : "",
              product.shortDescription
                ? `<g:product_highlight>${escapeXml(product.shortDescription)}</g:product_highlight>`
                : "",
              productDetails,
              "<g:shipping>",
              "<g:country>IN</g:country>",
              "<g:service>Standard</g:service>",
              `<g:price>${shippingPrice.toFixed(2)} ${escapeXml(settings.currencyCode)}</g:price>`,
              "</g:shipping>",
              "</item>",
            ].join("");
          });
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
