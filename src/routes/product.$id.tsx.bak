import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/products";
import { ArrowLeft, Heart, ChevronDown, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
  loader: ({ params }) => {
    const product = products.find((p) => p.id === params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} â€” PEHER` },
          { name: "description", content: `${loaderData.product.name} Â· ${loaderData.product.material}` },
        ]
      : [{ title: "Not found â€” PEHER" }, { name: "robots", content: "noindex" }],
  }),
});

const sizes = ["5", "6", "7", "8", "9"];

function ProductPage() {
  const { product } = Route.useLoaderData();
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

  const handleAddToBag = () => {
    addItem(product, size, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    addItem(product, size, qty);
    navigate({ to: "/cart" });
  };
  const gallery = [product.image, product.imageHover ?? product.image, product.image];
  const recommended = products.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="bg-white">
      <Navbar />

      <div className="pt-32 pb-4 container-luxe flex items-center justify-between">
        <Link to="/shop" className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase font-medium hover:opacity-60 transition">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.25} /> Back
        </Link>
        <div className="text-center">
          <p className="font-serif tracking-[0.3em] text-sm">PEHER</p>
          <p className="text-[9px] tracking-[0.28em] text-muted-foreground mt-0.5">NEW COLLECTION</p>
        </div>
        <button aria-label="Wishlist" className="w-10 h-10 grid place-items-center rounded-full hover:bg-muted transition">
          <Heart className="w-[18px] h-[18px]" strokeWidth={1.25} />
        </button>
      </div>

      <section className="container-luxe grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 pt-4 pb-24">
        {/* Sticky gallery */}
        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-28 space-y-4">
            <div className="aspect-[4/5] bg-[#f9f9f7] overflow-hidden">
              <img src={gallery[0]} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {gallery.map((g, i) => (
                <div key={i} className="aspect-square bg-[#f9f9f7] overflow-hidden cursor-pointer">
                  <img src={g} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-5">
          <p className="eyebrow">{product.material}</p>
          <h1 className="font-serif text-4xl md:text-5xl mt-4 leading-[1.05]">{product.name}</h1>
          <p className="mt-6 text-2xl font-serif">${product.price}</p>

          <p className="mt-8 font-serif italic text-lg leading-relaxed text-foreground/80 max-w-md">
            Formed by time and pressure, each piece carries a quiet history. Organic lines shaped by hand â€” no two are ever the same.
          </p>

          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <p className="eyebrow !text-foreground">Select Size</p>
              <button className="text-[11px] tracking-[0.18em] uppercase underline underline-offset-4 text-muted-foreground hover:text-foreground">Size Guide</button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`py-3 text-sm border transition ${
                    size === s ? "border-black bg-black text-white" : "border-black/15 hover:border-black"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border border-black/15">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-11 h-11 grid place-items-center">
                <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="w-11 h-11 grid place-items-center">
                <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
            <button onClick={handleAddToBag} className="btn-peher-outline flex-1">{added ? "Added ✓" : "Add to Bag"}</button>
          </div>
          <button onClick={handleBuyNow} className="btn-peher w-full mt-3">Buy Now</button>

          <div className="mt-6 flex items-center justify-center gap-5 text-[10px] tracking-[0.24em] uppercase text-muted-foreground">
            <span>Complimentary Shipping</span><span>Â·</span><span>Free Returns</span>
          </div>

          <div className="mt-12 border-t border-black/10">
            {[
              { t: "Description", c: `Handcrafted in ${product.material.toLowerCase()}, this piece is finished slowly in our atelier. Weight and proportions are refined by hand.` },
              { t: "Shipping", c: "Complimentary worldwide shipping. Orders are dispatched within 3â€“5 business days from our Delhi atelier." },
              { t: "Returns", c: "30-day easy returns on all pieces. Custom and engraved orders are final sale." },
              { t: "Care Guide", c: "Store in the pouch provided. Wipe with a soft cloth. Avoid contact with perfume and water for longest wear." },
              { t: "Size Guide", c: "Ring sizes follow US standards. If between sizes, we suggest sizing up." },
            ].map((row) => (
              <details key={row.t} className="group border-b border-black/10 py-5">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="eyebrow !text-foreground">{row.t}</span>
                  <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" strokeWidth={1.25} />
                </summary>
                <p className="mt-4 text-sm text-foreground/75 leading-relaxed">{row.c}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-[#f9f9f7] py-24">
        <div className="container-luxe">
          <div className="text-center mb-14">
            <p className="eyebrow">Customer Reviews</p>
            <h2 className="font-serif text-4xl md:text-5xl mt-4">Held close.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {[
              { q: "Even more beautiful in person. Feels like a keepsake.", a: "Ananya S." },
              { q: "The finish is quiet and considered. I wear it every day.", a: "Rhea M." },
              { q: "A gift for myself I never take off.", a: "Ishita K." },
            ].map((t) => (
              <figure key={t.a} className="text-center">
                <div className="text-[#D8E7D2] font-serif text-5xl leading-none mb-3">"</div>
                <blockquote className="font-serif italic text-lg leading-relaxed text-foreground/85">{t.q}</blockquote>
                <figcaption className="mt-5 eyebrow">â€” {t.a}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended */}
      <section className="py-24 container-luxe">
        <div className="text-center mb-14">
          <p className="eyebrow">You may also love</p>
          <h2 className="font-serif text-4xl md:text-5xl mt-4">Pieces to pair.</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {recommended.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

