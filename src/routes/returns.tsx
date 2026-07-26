import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/returns")({
  component: Returns,
  head: () => ({ meta: [{ title: "Returns & Exchanges — PEHER" }, { name: "description", content: "PEHER's returns and exchanges policy." }] }),
});

function Returns() {
  return (
    <div className="bg-white">
      <Navbar />
      <section className="pt-40 pb-16 container-luxe text-center">
        <p className="eyebrow">Returns & Exchanges</p>
        <h1 className="font-serif text-5xl md:text-7xl mt-4">Packed with care.</h1>
        <p className="mt-6 text-muted-foreground max-w-md mx-auto">
          Every order is packed with care. Here's what to know if something isn't right.
        </p>
      </section>

      <section className="container-luxe pb-24 max-w-2xl mx-auto space-y-10">
        <p className="text-foreground/80 leading-relaxed">
          Due to the nature of our products, we currently do not accept returns or exchanges
          unless the item received is damaged, defective, or incorrect.
        </p>

        <p className="text-foreground/80 leading-relaxed">
          If you receive a damaged or incorrect product, please contact us within 48 hours of
          delivery with your order number and clear photos of the item. Our team will review
          your request and arrange a replacement or appropriate resolution.
        </p>

        <div>
          <p className="eyebrow !text-foreground mb-4">Please Note</p>
          <ul className="space-y-3 text-foreground/80 leading-relaxed list-disc list-inside">
            <li>Items must be unused and in their original packaging.</li>
            <li>
              Minor variations in colour or finish may occur due to photography and the
              handcrafted nature of some products, and are not considered defects.
            </li>
            <li>Sale items are not eligible for return or exchange.</li>
          </ul>
        </div>
      </section>

      <Footer />
    </div>
  );
}
