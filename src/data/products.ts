import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import rings from "@/assets/rings.jpg";
import necklaces from "@/assets/necklaces.jpg";
import bracelets from "@/assets/bracelets.jpg";
import earrings from "@/assets/earrings.jpg";
import type { Product } from "@/components/ProductCard";

export const products: Product[] = [
  { id: "tide-emerald", name: "Tide Emerald Ring", price: 2400, originalPrice: 3200, material: "18k Gold · Emerald", image: p1, imageHover: rings, badge: "New" },
  { id: "pearl-embrace", name: "Pearl Embrace Pendant", price: 1800, originalPrice: 2600, material: "Silver · Pearl", image: p2, imageHover: necklaces },
  { id: "linen-chain", name: "Linen Chain Bracelet", price: 1600, material: "18k Gold Vermeil", image: p3, imageHover: bracelets },
  { id: "halo-hoops", name: "Halo Hoop Earrings", price: 1400, originalPrice: 2000, material: "18k Gold", image: p4, imageHover: earrings },
  { id: "sable-ring", name: "Sable Signet Ring", price: 2900, material: "Sterling Silver", image: rings, imageHover: p1, badge: "Bestseller" },
  { id: "verse-chain", name: "Verse Chain Necklace", price: 2200, originalPrice: 3000, material: "18k Gold", image: necklaces, imageHover: p2 },
  { id: "mira-cuff", name: "Mira Cuff", price: 3400, material: "Brass · Enamel", image: bracelets, imageHover: p3 },
  { id: "dew-drops", name: "Dew Drop Earrings", price: 1500, originalPrice: 2100, material: "Silver · Pearl", image: earrings, imageHover: p4 },
];
