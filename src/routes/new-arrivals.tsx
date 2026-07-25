import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/products";

export const Route = createFileRoute("/new-arrivals")({
  component: NewArrivals,
  head: () => ({ meta: [{ title: "New Arrivals — PEHER" }, { name: "description", content: "New arrivals from the PEHER atelier." }] }),
});

function NewArrivals() {
  return (
    <div className="bg-white">
      <Navbar />
      <div className="pt-36 pb-16 container-luxe text-center">
        <p className="eyebrow">Just Arrived</p>
        <h1 className="font-serif text-5xl md:text-7xl mt-4">New Arrivals</h1>
        <p className="mt-6 text-muted-foreground max-w-md mx-auto">Freshly made, quietly released. Small numbers, hand-finished, ready to be worn.</p>
      </div>
      <div className="container-luxe pb-32 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      <Footer />
    </div>
  );
}
