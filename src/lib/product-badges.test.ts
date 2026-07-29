import { describe, expect, it } from "bun:test";
import { getProductBadges } from "./product-badges";
import type { Product } from "./catalog-api";

const baseProduct = {
  id: "moon-ring",
  databaseId: "product-id",
  name: "Moon Ring",
  price: 1200,
  material: "Gold Vermeil",
  image: "/ring.jpg",
  images: ["/ring.jpg"],
  updatedAt: "2026-07-29T00:00:00.000Z",
} satisfies Product;

describe("product storefront badges", () => {
  it("prioritizes out of stock over marketing labels", () => {
    expect(
      getProductBadges({
        ...baseProduct,
        stock: 0,
        outOfStock: true,
        badge: "Limited Drop",
        tags: ["Selling Fast"],
      }),
    ).toEqual([{ label: "Out of Stock", tone: "sold" }]);
  });

  it("shows an exact almost-gone badge for very low stock", () => {
    expect(getProductBadges({ ...baseProduct, stock: 2 })[0]).toEqual({
      label: "Only 2 left",
      tone: "warning",
    });
  });

  it("shows low stock for products under the stock threshold", () => {
    expect(getProductBadges({ ...baseProduct, stock: 8 })[0]).toEqual({
      label: "Low Stock",
      tone: "warning",
    });
  });

  it("combines admin badge fields and avoids duplicate labels", () => {
    const badges = getProductBadges({
      ...baseProduct,
      stock: 20,
      isTrending: true,
      isBestseller: true,
      badge: "Limited Drop",
      tags: ["Limited Drop", "Gift Pick"],
    });

    expect(badges.map((badge) => badge.label)).toEqual([
      "Highly Selling",
      "Selling Fast",
      "Limited Drop",
      "Gift Pick",
    ]);
  });
});
