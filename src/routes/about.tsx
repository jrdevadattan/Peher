import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import craft from "@/assets/craft.jpg";
import editorial1 from "@/assets/editorial1.jpg";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({ meta: [{ title: "About — PEHER" }, { name: "description", content: "PEHER is a jewellery house by Vasudha Tiwari, founded on quiet craft and lasting emotion." }] }),
});

function About() {
  return (
    <div className="bg-white">
      <Navbar />
      <section className="pt-40 pb-24 container-luxe">
        <p className="eyebrow">Our Story</p>
        <h1 className="font-serif text-5xl md:text-8xl mt-6 leading-[0.95] max-w-4xl">
          Extra is our <br /><em className="italic">love language.</em>
        </h1>
      </section>

      <section className="container-luxe grid grid-cols-1 lg:grid-cols-12 gap-12 pb-32 items-center">
        <div className="lg:col-span-6 aspect-[4/5] overflow-hidden">
          <img src={editorial1} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <p className="eyebrow">Founder</p>
          <h2 className="font-serif text-4xl md:text-5xl mt-4">Vasudha Tiwari</h2>
          <div className="mt-8 space-y-5 text-foreground/75 leading-relaxed">
            <p>PEHER was born from a quiet obsession — pieces of jewellery that carry the softness of memory. Objects that feel less like accessories and more like keepsakes.</p>
            <p>Every piece is drawn by hand, sculpted in wax, cast in fine metals, and finished slowly by a small team of artisans. There are no shortcuts. There is no rush.</p>
            <p>We believe extra isn't excess. It's care. It's the small unnecessary gestures that make something feel loved.</p>
          </div>
        </div>
      </section>

      <section className="bg-[#f9f9f7] py-24 md:py-32">
        <div className="container-luxe grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="eyebrow">Craftsmanship</p>
            <h2 className="font-serif text-4xl md:text-6xl mt-5">Made slowly, on purpose.</h2>
            <div className="mt-8 space-y-5 text-foreground/75 leading-relaxed max-w-lg">
              <p>Our atelier works in small batches. Each ring, chain, and earring passes through several hands before it reaches yours — carved, cast, filed, polished, and set with quiet precision.</p>
              <p>We source responsibly: recycled 18k gold, ethically farmed pearls, and stones with traceable histories.</p>
            </div>
          </div>
          <div className="aspect-[4/5] overflow-hidden">
            <img src={craft} alt="Craft" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 container-luxe">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 border-t border-black/10 pt-16">
          {[["01", "Drawn"], ["02", "Carved"], ["03", "Cast"], ["04", "Finished"]].map(([n, l]) => (
            <div key={n}>
              <div className="eyebrow">{n}</div>
              <div className="font-serif text-2xl md:text-3xl mt-3">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-32">
        <div className="aspect-[16/9] max-h-[80vh] overflow-hidden">
          <img src={hero} alt="" className="w-full h-full object-cover" />
        </div>
      </section>

      <Footer />
    </div>
  );
}
