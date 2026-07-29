import type { AdminProduct, ProductReview, StorefrontSettings } from "@/lib/catalog-api";

export function absoluteUrl(settings: StorefrontSettings, path = "") {
  const normalizedPath = path && !path.startsWith("/") ? `/${path}` : path;
  return `${settings.publicSiteUrl}${normalizedPath}`;
}

export function buildOrganizationJsonLd(settings: StorefrontSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${settings.publicSiteUrl}/#store`,
    name: settings.storeName,
    url: settings.publicSiteUrl,
    email: settings.contactEmail,
    description: settings.metaDescription,
    currenciesAccepted: settings.currencyCode,
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "IN",
      returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
      merchantReturnLink: absoluteUrl(settings, "/returns"),
    },
  };
}

export function buildWebsiteJsonLd(settings: StorefrontSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${settings.publicSiteUrl}/#website`,
    url: settings.publicSiteUrl,
    name: settings.storeName,
    description: settings.tagline,
    publisher: { "@id": `${settings.publicSiteUrl}/#store` },
    inLanguage: "en-IN",
  };
}

export function buildProductJsonLd(
  product: AdminProduct,
  reviews: ProductReview[],
  settings: StorefrontSettings,
) {
  const productUrl = absoluteUrl(settings, `/product/${product.id}`);
  const shippingPrice =
    product.price >= settings.freeShippingThreshold ? 0 : settings.standardShippingRate;
  const ratingValue = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : 0;
  const specifications = [
    ["Material", product.material],
    ["Subcategory", product.subcategory],
    ["Weight", product.weight],
    ["Dimensions", product.dimensions],
  ]
    .filter(([, value]) => value)
    .map(([name, value]) => ({
      "@type": "PropertyValue",
      name,
      value,
    }));
  const ratingMarkup = reviews.length
    ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: Number(ratingValue.toFixed(2)),
          ratingCount: reviews.length,
          reviewCount: reviews.length,
          bestRating: 5,
          worstRating: 1,
        },
        review: reviews.slice(0, 20).map((review) => ({
          "@type": "Review",
          name: review.title || undefined,
          reviewBody: review.comment,
          datePublished: review.date.slice(0, 10),
          author: {
            "@type": "Person",
            name: review.customerName,
          },
          reviewRating: {
            "@type": "Rating",
            ratingValue: review.rating,
            bestRating: 5,
            worstRating: 1,
          },
        })),
      }
    : {};
  const sharedProductMarkup = {
    name: product.name,
    description: product.description || product.shortDescription,
    image: product.images,
    url: productUrl,
    brand: {
      "@type": "Brand",
      name: product.brand || settings.storeName,
    },
    category: product.category,
    material: product.material,
    audience: {
      "@type": "PeopleAudience",
      suggestedGender: "unisex",
      suggestedAge: {
        "@type": "QuantitativeValue",
        minValue: 13,
        unitCode: "ANN",
      },
    },
    ...(specifications.length ? { additionalProperty: specifications } : {}),
    ...ratingMarkup,
  };
  const buildOffer = (price: number, stock: number, url = productUrl) => ({
    "@type": "Offer",
    url,
    price: price.toFixed(2),
    priceCurrency: settings.currencyCode,
    availability: stock <= 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@id": `${settings.publicSiteUrl}/#store` },
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: "IN",
      },
      shippingRate: {
        "@type": "MonetaryAmount",
        value: shippingPrice.toFixed(2),
        currency: settings.currencyCode,
      },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: {
          "@type": "QuantitativeValue",
          minValue: 1,
          maxValue: 3,
          unitCode: "DAY",
        },
        transitTime: {
          "@type": "QuantitativeValue",
          minValue: 7,
          maxValue: 8,
          unitCode: "DAY",
        },
      },
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "IN",
      returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
      merchantReturnLink: absoluteUrl(settings, "/returns"),
    },
  });

  if (product.variants.length) {
    const variesBy = [
      product.variants.some((variant) => variant.size) ? "https://schema.org/size" : "",
      product.variants.some((variant) => variant.color) ? "https://schema.org/color" : "",
    ].filter(Boolean);

    return {
      "@context": "https://schema.org",
      "@type": "ProductGroup",
      "@id": `${productUrl}#product-group`,
      productGroupID: product.sku,
      ...sharedProductMarkup,
      ...(variesBy.length ? { variesBy } : {}),
      hasVariant: product.variants.map((variant) => {
        const variantUrl = `${productUrl}?variant=${encodeURIComponent(variant.id || variant.sku)}`;
        const variantLabel = [variant.size, variant.color].filter(Boolean).join(" / ");
        return {
          "@type": "Product",
          "@id": `${variantUrl}#product`,
          name: variantLabel ? `${product.name} - ${variantLabel}` : product.name,
          description: product.description || product.shortDescription,
          image: product.images,
          url: variantUrl,
          sku: variant.sku,
          ...(variant.size ? { size: variant.size } : {}),
          ...(variant.color ? { color: variant.color } : {}),
          material: product.material,
          brand: sharedProductMarkup.brand,
          offers: buildOffer(variant.price, variant.stock, variantUrl),
        };
      }),
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    ...sharedProductMarkup,
    sku: product.sku,
    ...(product.gtin ? { gtin: product.gtin } : {}),
    ...(product.mpn ? { mpn: product.mpn } : {}),
    offers: buildOffer(product.price, product.stock),
  };
}

export function buildProductBreadcrumbJsonLd(product: AdminProduct, settings: StorefrontSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: settings.publicSiteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: absoluteUrl(settings, "/shop"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: absoluteUrl(settings, `/product/${product.id}`),
      },
    ],
  };
}

export function escapeXml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
