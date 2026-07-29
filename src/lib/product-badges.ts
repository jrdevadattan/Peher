import type { Product } from "@/lib/catalog-api";

export type ProductBadge = {
  label: string;
  tone: "dark" | "fresh" | "warning" | "sale" | "sold";
};

const LOW_STOCK_LIMIT = 10;
const ALMOST_GONE_LIMIT = 3;
const MAX_STOREFRONT_BADGES = 1;

function normalizeLabel(label: string) {
  return label.trim().replace(/\s+/g, " ");
}

function pushUnique(badges: ProductBadge[], badge: ProductBadge) {
  const label = normalizeLabel(badge.label);
  if (!label || badges.some((item) => item.label.toLowerCase() === label.toLowerCase())) return;
  badges.push({ ...badge, label });
}

export function getProductBadges(product: Product): ProductBadge[] {
  const badges: ProductBadge[] = [];
  const hasStock = product.stock !== undefined && product.stock !== null;
  const stock = Number(product.stock ?? 0);

  if (product.outOfStock || (hasStock && stock <= 0)) {
    return [{ label: "Out of Stock", tone: "sold" }];
  }

  if (product.originalPrice && product.originalPrice > product.price) {
    const save = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    pushUnique(badges, { label: `Save ${save}%`, tone: "sale" });
  }

  if (hasStock && stock <= ALMOST_GONE_LIMIT) {
    pushUnique(badges, { label: `Only ${stock} left`, tone: "warning" });
  } else if (hasStock && stock <= LOW_STOCK_LIMIT) {
    pushUnique(badges, { label: "Low Stock", tone: "warning" });
  }

  if (product.isBestseller) {
    pushUnique(badges, { label: "Highly Selling", tone: "dark" });
  }

  if (product.isTrending) {
    pushUnique(badges, { label: "Selling Fast", tone: "fresh" });
  }

  if (product.badge) {
    pushUnique(badges, { label: product.badge, tone: "fresh" });
  }

  for (const tag of product.tags ?? []) {
    pushUnique(badges, { label: tag, tone: "dark" });
    if (badges.length >= MAX_STOREFRONT_BADGES) break;
  }

  return badges.slice(0, MAX_STOREFRONT_BADGES);
}
