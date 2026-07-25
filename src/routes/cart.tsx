import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { X } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export const Route = createFileRoute("/cart")({
  component: Cart,
  head: () => ({ meta: [{ title: "Cart — PEHER" }] }),
});

function Cart() {
  const { items, removeItem, updateQty, subtotal } = useCart();
  const navigate = useNavigate();

  return (
    <div className="bg-white">
      <Navbar />
      <section className="pt-40 pb-16 container-luxe">
        <p className="eyebrow">Your Bag</p>
        <h1 className="font-serif text-5xl md:text-7xl mt-4">Cart</h1>
      </section>

      {items.length === 0 ? (
        <div className="container-luxe pb-32 text-center py-24">
          <p className="font-serif text-2xl">Your bag is empty.</p>
          <Link to="/shop" className="mt-6 inline-block text-[11px] tracking-[0.22em] uppercase font-semibold underline underline-offset-4">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="container-luxe pb-32 grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 divide-y divide-black/10 border-y border-black/10">
            {items.map((i) => (
              <div key={`${i.id}-${i.size}`} className="py-8 flex gap-6">
                <div className="w-28 h-32 bg-[#f9f9f7] overflow-hidden shrink-0">
                  <img src={i.image} alt={i.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="eyebrow">{i.material}{i.size ? ` · Size ${i.size}` : ""}</p>
                      <h3 className="font-serif text-2xl mt-1">{i.name}</h3>
                    </div>
                    <button aria-label="Remove" onClick={() => removeItem(i.id, i.size)}>
                      <X className="w-4 h-4" strokeWidth={1.25} />
                    </button>
                  </div>
                  <div className="mt-auto flex items-end justify-between">
                    <div className="flex items-center border border-black/15">
                      <button onClick={() => updateQty(i.id, i.size, i.qty - 1)} className="w-9 h-9">−</button>
                      <span className="w-8 text-center text-sm">{i.qty}</span>
                      <button onClick={() => updateQty(i.id, i.size, i.qty + 1)} className="w-9 h-9">+</button>
                    </div>
                    <p className="text-sm">₹{(i.price * i.qty).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <aside className="lg:col-span-5">
            <div className="bg-[#D8E7D2]/25 border border-[#D8E7D2] p-8 md:p-10 rounded-md">
              <h2 className="font-serif text-3xl">Order Summary</h2>
              <dl className="mt-8 space-y-4 text-sm">
                <Row k="Subtotal" v={`₹${subtotal.toLocaleString("en-IN")}`} />
                <Row k="Shipping" v="Complimentary" />
                <Row k="Estimated Tax" v="Calculated at checkout" />
              </dl>
              <div className="border-t border-black/10 mt-6 pt-6 flex items-center justify-between">
                <span className="eyebrow !text-foreground">Total</span>
                <span className="font-serif text-2xl">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <input placeholder="Gift code" className="mt-6 w-full px-4 py-3 border border-black/10 bg-white text-sm outline-none focus:border-black" />
              <button onClick={() => navigate({ to: "/checkout" })} className="btn-peher w-full mt-5">
                Proceed to Checkout
              </button>
              <div className="mt-6 flex items-center justify-center gap-5 text-[10px] tracking-[0.24em] uppercase text-muted-foreground">
                <span>Secure Checkout</span><span>·</span><span>Free Returns</span><span>·</span><span>Lifetime Care</span>
              </div>
            </div>
            <div className="text-center mt-6">
              <Link to="/shop" className="text-[11px] tracking-[0.2em] uppercase border-b border-black pb-1">Continue Shopping</Link>
            </div>
          </aside>
        </div>
      )}
      <Footer />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

