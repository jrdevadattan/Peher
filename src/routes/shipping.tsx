import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Truck, Clock, Wallet, PackageCheck } from "lucide-react";
import { getStorefrontSettings } from "@/lib/catalog-api";

export const Route = createFileRoute("/shipping")({
  component: Shipping,
  loader: () => getStorefrontSettings(),
  head: () => ({ meta: [{ title: "Shipping — PEHER" }, { name: "description", content: "Shipping timelines, costs, and coverage for PEHER orders." }] }),
});

function Shipping() {
  const settings = Route.useLoaderData();
  return (
    <div className="bg-white">
      <Navbar />
      <section className="pt-40 pb-16 container-luxe text-center">
        <p className="eyebrow">Shipping</p>
        <h1 className="font-serif text-5xl md:text-7xl mt-4">On its way to you.</h1>
        <p className="mt-6 text-muted-foreground max-w-md mx-auto">
          Every order is packed with care and sent on its way as quickly as possible.
        </p>
      </section>

      <section className="container-luxe pb-24 grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
        {[
          { icon: PackageCheck, title: "Processing Time", body: "Orders are processed within 1–3 business days after confirmation." },
          { icon: Truck, title: "Delivery Time", body: "Standard delivery usually takes 7–8 business days, depending on your location." },
          { icon: Wallet, title: "Payment & Charges", body: `We accept prepaid orders only — Cash on Delivery (COD) is not available. Standard shipping is ₹${settings.standardShippingRate.toLocaleString("en-IN")}; shipping is free on orders of ₹${settings.freeShippingThreshold.toLocaleString("en-IN")} or more.` },
          { icon: Clock, title: "Coverage & Delays", body: "We currently ship across India. Delivery timelines may vary during festivals, sales, or due to unforeseen courier delays." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-5">
            <div className="w-11 h-11 grid place-items-center bg-[#D8E7D2]/50 rounded-full shrink-0">
              <Icon className="w-4 h-4" strokeWidth={1.25} />
            </div>
            <div>
              <p className="eyebrow !text-foreground">{title}</p>
              <p className="mt-2 text-foreground/80 leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </section>

      <Footer />
    </div>
  );
}
