import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import editorial1 from "@/assets/editorial1.jpg";
import craft from "@/assets/craft.jpg";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/journal")({
  component: Journal,
  head: () => ({ meta: [{ title: "Journal — PEHER" }, { name: "description", content: "Notes from the PEHER atelier — craft, lookbooks, and quiet essays." }] }),
});

const posts = [
  { title: "A season of soft light", excerpt: "On the Autumn edit and the pieces we return to.", cat: "Lookbook", image: editorial1 },
  { title: "The slow hands", excerpt: "Inside the atelier where every piece is made.", cat: "Craft", image: craft },
  { title: "On wearing pearls", excerpt: "The oldest ornament, quietly reimagined.", cat: "Notes", image: hero },
];

function Journal() {
  return (
    <div className="bg-white">
      <Navbar />
      <section className="pt-40 pb-20 container-luxe text-center">
        <p className="eyebrow">The Journal</p>
        <h1 className="font-serif text-5xl md:text-7xl mt-4">Quiet notes.</h1>
      </section>
      <div className="container-luxe pb-32 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
        {posts.map((p) => (
          <Link to="/journal" key={p.title} className="group">
            <div className="aspect-[4/5] overflow-hidden bg-[#f9f9f7]">
              <img src={p.image} alt={p.title} className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.04]" />
            </div>
            <p className="eyebrow mt-6">{p.cat}</p>
            <h2 className="font-serif text-3xl mt-3 group-hover:italic transition">{p.title}</h2>
            <p className="mt-3 text-muted-foreground text-sm">{p.excerpt}</p>
          </Link>
        ))}
      </div>
      <Footer />
    </div>
  );
}
