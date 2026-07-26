import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/size-guide")({
  component: SizeGuide,
  head: () => ({ meta: [{ title: "Size Guide — PEHER" }, { name: "description", content: "Find your perfect bangle size with PEHER's size guide." }] }),
});

const bangleSizes = [
  { size: "2-2", cm: "5.4", mm: "54", inches: "2.125" },
  { size: "2-4", cm: "5.7", mm: "57.2", inches: "2.25" },
  { size: "2-6", cm: "6.0", mm: "60.3", inches: "2.375" },
  { size: "2-8", cm: "6.3", mm: "63.5", inches: "2.5" },
  { size: "2-10", cm: "6.6", mm: "66.7", inches: "2.625" },
  { size: "2-12", cm: "7.0", mm: "69.9", inches: "2.75" },
  { size: "2-14", cm: "7.3", mm: "73", inches: "2.87" },
  { size: "3", cm: "7.6", mm: "76.3", inches: "3" },
];

function SizeGuide() {
  return (
    <div className="bg-white">
      <Navbar />
      <section className="pt-40 pb-16 container-luxe text-center">
        <p className="eyebrow">Size Guide</p>
        <h1 className="font-serif text-5xl md:text-7xl mt-4">Find your fit.</h1>
        <p className="mt-6 text-muted-foreground max-w-md mx-auto">
          Use a soft measuring tape or a scale to measure the inner diameter of a bangle
          you already own, then compare it with the chart below.
        </p>
      </section>

      <section className="container-luxe pb-24 max-w-3xl mx-auto space-y-12">
        <div>
          <p className="eyebrow !text-foreground mb-3">How to Measure</p>
          <p className="text-foreground/80 leading-relaxed">
            Lay a bangle you already own flat on a table and measure the inner diameter —
            the straight-line distance across the inside of the circle, not around the edge.
            Compare your measurement to the "Inner Diameter" columns below to find your size.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-black/20">
                <th className="eyebrow !text-foreground py-4 pr-4">Indian Bangle Size</th>
                <th className="eyebrow !text-foreground py-4 pr-4">Inner Diameter (cm)</th>
                <th className="eyebrow !text-foreground py-4 pr-4">Inner Diameter (mm)</th>
                <th className="eyebrow !text-foreground py-4">Inner Diameter (in)</th>
              </tr>
            </thead>
            <tbody>
              {bangleSizes.map((row) => (
                <tr key={row.size} className="border-b border-black/10">
                  <td className="py-4 pr-4 font-medium text-foreground">{row.size}</td>
                  <td className="py-4 pr-4 text-foreground/80">{row.cm}</td>
                  <td className="py-4 pr-4 text-foreground/80">{row.mm}</td>
                  <td className="py-4 text-foreground/80">{row.inches}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-muted-foreground">
          Still unsure of your size? <a href="/contact" className="underline underline-offset-4">Get in touch</a> and
          we'll help you find the right fit.
        </p>
      </section>

      <Footer />
    </div>
  );
}
