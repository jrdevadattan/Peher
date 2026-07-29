import type {
  AdminProduct,
  ProductReview,
  StorefrontSettings,
} from "@/lib/catalog-api";

export const PUBLIC_ROUTES = [
  "",
  "/shop",
  "/new-arrivals",
  "/collections",
  "/about",
  "/journal",
  "/contact",
  "/shipping",
  "/returns",
  "/size-guide",
] as const;

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

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.name,
    description: product.description || product.shortDescription,
    image: product.images,
    url: productUrl,
    sku: product.sku,
    ...(product.gtin ? { gtin: product.gtin } : {}),
    ...(product.mpn ? { mpn: product.mpn } : {}),
    brand: {
      "@type": "Brand",
      name: product.brand || settings.storeName,
    },
    category: product.category,
    material: product.material,
    offers: {
      "@type": "Offer",
      url: productUrl,
      price: product.price.toFixed(2),
      priceCurrency: settings.currencyCode,
      availability: product.outOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
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
    },
    ...(reviews.length
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(ratingValue.toFixed(2)),
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
      : {}),
  };
}

export function buildProductBreadcrumbJsonLd(
  product: AdminProduct,
  settings: StorefrontSettings,
) {
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
