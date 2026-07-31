import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import aboutPortrait from "@/assets/about-peher-portrait.jpg";
import craft from "@/assets/craft.jpg";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({ meta: [{ title: "About — PEHER" }, { name: "description", content: "Peher exists for the people who've never understood the phrase less is more." }] }),
});

function About() {
  return (
    <div className="bg-white">
      <Navbar />
      <section className="pt-40 pb-24 container-luxe">
        <p className="eyebrow">About Us</p>
        <h1 className="font-serif text-5xl md:text-8xl mt-6 leading-[0.95] max-w-4xl">
          Extra has always <br />been our <em className="italic">love language.</em>
        </h1>
      </section>

      <section className="container-luxe grid grid-cols-1 lg:grid-cols-12 gap-12 pb-32 items-center">
        <div className="lg:col-span-6 aspect-[4/5] overflow-hidden">
          <img src={aboutPortrait} alt="PEHER jewellery styled with stacked bangles" className="w-full h-full object-cover" />
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <div className="space-y-5 text-foreground/75 leading-relaxed">
            <p className="text-foreground text-lg font-medium">
              Peher exists for the people who've never understood the phrase "less is more."
            </p>
            <p>We're firmly on team "one more bangle won't hurt."</p>
            <p>
              Born from a love for Indian craftsmanship, fashion, colour, nostalgia, and a
              healthy obsession with accessories, Peher creates pieces that don't whisper —
              they celebrate. Loudly.
            </p>
            <p>
              We grew up watching our mothers save jewellery for "special occasions." We grew
              up asking, why wait?
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#f9f9f7] py-24 md:py-32">
        <div className="container-luxe grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="eyebrow">Our Philosophy</p>
            <h2 className="font-serif text-4xl md:text-6xl mt-5">Maximalism, worn well.</h2>
            <div className="mt-8 space-y-5 text-foreground/75 leading-relaxed max-w-lg">
              <p>
                So we mix heirloom energy with modern styling, traditional craftsmanship with
                playful chaos, and everyday outfits with main-character confidence. The result?
                Accessories that feel equal parts timeless and unexpected.
              </p>
              <p>
                At Peher, maximalism isn't about wearing more. It's about expressing more.
                More colour. More personality. More memories. More you.
              </p>
            </div>
          </div>
          <div className="aspect-[4/5] overflow-hidden">
            <img src={craft} alt="Craft" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 container-luxe max-w-3xl">
        <p className="eyebrow">Made To Be Worn</p>
        <div className="mt-6 space-y-5 text-foreground/75 leading-relaxed text-lg">
          <p>
            Every piece is designed to be stacked, layered, mixed, mismatched, borrowed,
            stolen by your sister, complimented by strangers, and eventually become
            "Where did you get that from?"
          </p>
          <p>
            Wear the statement earrings to brunch. Stack six bangles on a Tuesday. Pair
            heritage with streetwear. Wear gold with silver. Wear colour with confidence.
          </p>
          <p className="text-foreground font-medium">Life's too short for boring accessories.</p>
          <p>And around here? Extra has always been our love language.</p>
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
