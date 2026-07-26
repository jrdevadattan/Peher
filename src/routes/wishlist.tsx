import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/products";
import { useWishlist } from "@/lib/wishlist-context";

export const Route = createFileRoute("/wishlist")({
  component: Wishlist,
  head: () => ({ meta: [{ title: "Wishlist — PEHER" }] }),
});

function Wishlist() {
  const { items } = useWishlist();
  const wishlistedProducts = products.filter((p) => items.includes(p.id));

  return (
    <div className="bg-white">
      <Navbar />
      <section className="pt-40 pb-16 container-luxe text-center">
        <p className="eyebrow">Saved for you</p>
        <h1 className="font-serif text-5xl md:text-7xl mt-4">Wishlist</h1>
      </section>

      {wishlistedProducts.length === 0 ? (
        <div className="container-luxe pb-32 text-center">
          <p className="text-muted-foreground">
            You haven't saved anything yet. Tap the heart on any product to add it here.
          </p>
        </div>
      ) : (
        <div className="container-luxe pb-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {wishlistedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <div className="text-center pb-32">
        <Link to="/shop" className="btn-peher-outline">Continue Browsing</Link>
      </div>
      <Footer />
    </div>
  );
}
