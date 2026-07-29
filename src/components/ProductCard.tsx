import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { Minus, Plus, Heart } from "lucide-react";
import type { Product } from "@/lib/catalog-api";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductCard({ product }: { product: Product }) {
  const { items, addItem, updateQty, removeItem } = useCart();
  const { isWishlisted, toggleItem } = useWishlist();
  const cartItem = items.find((i) => i.id === product.id && i.size === null);
  const liked = isWishlisted(product.id);
  const [imageLoaded, setImageLoaded] = useState(false);

  const save =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, null, 1);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product.id);
  };

  const increment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQty(product.id, null, (cartItem?.qty ?? 0) + 1);
  };

  const decrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cartItem) return;
    if (cartItem.qty <= 1) removeItem(product.id, null);
    else updateQty(product.id, null, cartItem.qty - 1);
  };

  return (
    <article className="group">
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className="block relative overflow-hidden bg-[#D8E7D2]/20 aspect-[4/5] rounded-md border border-black/[0.06] shadow-[var(--shadow-soft)] transition-all duration-500 group-hover:shadow-[var(--shadow-luxe)] group-hover:border-[#D8E7D2]"
      >
        {!imageLoaded && <Skeleton className="absolute inset-0 rounded-none" />}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-[1200ms] ease-out group-hover:scale-[1.04] ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
        {product.imageHover && (
          <img
            src={product.imageHover}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          />
        )}
        {product.outOfStock ? (
          <span className="absolute top-3 left-3 bg-black text-white text-[10px] tracking-[0.2em] uppercase font-semibold px-3 py-1.5 rounded-full">
            Out of Stock
          </span>
        ) : save ? (
          <span className="absolute top-3 left-3 bg-black text-white text-[10px] tracking-[0.16em] uppercase font-semibold px-3 py-1.5 rounded-full">
            Save {save}%
          </span>
        ) : product.badge ? (
          <span className="absolute top-3 left-3 bg-[#D8E7D2] text-black text-[10px] tracking-[0.16em] uppercase font-semibold px-3 py-1.5 rounded-full">
            {product.badge}
          </span>
        ) : null}

        <button
          onClick={handleWishlist}
          aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur grid place-items-center shadow-sm hover:scale-110 transition-transform"
        >
          <Heart
            className="w-4 h-4"
            strokeWidth={1.75}
            fill={liked ? "#111" : "none"}
            stroke="#111"
          />
        </button>
      </Link>

      <div className="pt-4">
        <Link to="/product/$id" params={{ id: product.id }}>
          <h3 className="font-serif text-xl leading-tight transition-colors duration-300 group-hover:text-[#5b7a52]">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex items-baseline gap-2.5">
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ₹{product.originalPrice.toLocaleString("en-IN")}
            </span>
          )}
          <span className="text-sm font-medium">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
        </div>

        {product.outOfStock ? (
          <button
            disabled
            className="mt-3 w-full bg-black text-white text-[11px] tracking-[0.22em] uppercase font-semibold py-3 rounded-sm opacity-60 cursor-not-allowed"
          >
            Out of Stock
          </button>
        ) : cartItem ? (
          <div className="mt-3 w-full flex items-center justify-between border border-black rounded-sm overflow-hidden">
            <button
              onClick={decrement}
              aria-label="Decrease quantity"
              className="w-11 h-11 grid place-items-center hover:bg-[#D8E7D2] transition-colors"
            >
              <Minus className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
            <span className="text-sm font-semibold tracking-wide">{cartItem.qty}</span>
            <button
              onClick={increment}
              aria-label="Increase quantity"
              className="w-11 h-11 grid place-items-center hover:bg-[#D8E7D2] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            className="mt-3 w-full bg-black text-white text-[11px] tracking-[0.22em] uppercase font-semibold py-3 rounded-sm transition-all duration-300 hover:bg-[#D8E7D2] hover:text-black hover:-translate-y-0.5"
          >
            Add to Cart
          </button>
        )}
      </div>
    </article>
  );
}
