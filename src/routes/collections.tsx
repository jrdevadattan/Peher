import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import rings from "@/assets/rings.jpg";
import necklaces from "@/assets/necklaces.jpg";
import bracelets from "@/assets/bracelets.jpg";
import earrings from "@/assets/earrings.jpg";
import editorial1 from "@/assets/editorial1.jpg";

export const Route = createFileRoute("/collections")({
  component: Collections,
  head: () => ({ meta: [{ title: "Collections — PEHER" }, { name: "description", content: "Explore PEHER collections — Rings, Necklaces, Bracelets, Earrings." }] }),
});

const items = [
  { name: "Rings", desc: "Sculpted circles, hand-carved in wax.", image: rings },
  { name: "Necklaces", desc: "Chains and pendants shaped by hand.", image: necklaces },
  { name: "Bracelets", desc: "Weight for the wrist, quietly gold.", image: bracelets },
  { name: "Earrings", desc: "Small dictations of light and pearl.", image: earrings },
  { name: "The Lookbook", desc: "A season of soft light.", image: editorial1, span: true },
];

function Collections() {
  return (
    <div className="bg-white">
      <Navbar />
      <div className="pt-36 pb-16 container-luxe text-center">
        <p className="eyebrow">Collections</p>
        <h1 className="font-serif text-5xl md:text-7xl mt-4">A quiet edit.</h1>
      </div>
      <div className="container-luxe pb-32 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {items.map((c) => (
          <Link key={c.name} to="/shop" className={`group block ${c.span ? "md:col-span-2" : ""}`}>
            <div className={`relative overflow-hidden bg-[#f9f9f7] ${c.span ? "aspect-[16/10]" : "aspect-[4/5]"}`}>
              <img src={c.image} alt={c.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-[1400ms] group-hover:scale-[1.05]" />
              <div className="absolute inset-0 flex items-end p-8 md:p-12">
                <div className="text-white drop-shadow">
                  <h3 className="font-serif text-3xl md:text-5xl">{c.name}</h3>
                  <p className="mt-2 text-sm max-w-xs">{c.desc}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Footer />
    </div>
  );
}
