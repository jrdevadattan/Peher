import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MapPin, Mail, Phone, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { getStorefrontSettings } from "@/lib/catalog-api";

export const Route = createFileRoute("/contact")({
  loader: () => getStorefrontSettings(),
  component: Contact,
  head: () => ({
    meta: [
      { title: "Contact - PEHER" },
      { name: "description", content: "Visit the PEHER atelier, or write to us." },
    ],
  }),
});

const atelierAddress =
  "Raheja Complex, behind Times of India Press, off Western Express Highway, Malad East, Mumbai, Maharashtra 400097, India";
const atelierMapLabel = "Malad East, Mumbai";
const atelierPhone = "7400160573";

function Contact() {
  const settings = Route.useLoaderData();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-white">
      <Navbar />
      <section className="container-luxe pb-16 pt-40 text-center">
        <p className="eyebrow">Contact</p>
        <h1 className="mt-4 font-serif text-5xl md:text-7xl">Say hello.</h1>
        <p className="mx-auto mt-6 max-w-md text-muted-foreground">
          We'd love to hear from you about a piece, a custom order, or simply the weather.
        </p>
      </section>

      <section className="container-luxe grid grid-cols-1 gap-16 pb-24 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-5">
          {[
            { icon: MapPin, title: "The Atelier", body: atelierAddress },
            { icon: Mail, title: "Email", body: settings.contactEmail || "peher.in.official@gmail.com" },
            { icon: Phone, title: "Phone", body: atelierPhone },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#D8E7D2]/50">
                <Icon className="h-4 w-4" strokeWidth={1.25} />
              </div>
              <div>
                <p className="eyebrow !text-foreground">{title}</p>
                <p className="mt-2 whitespace-pre-line leading-relaxed text-foreground/80">{body}</p>
              </div>
            </div>
          ))}
          <div>
            <p className="eyebrow !text-foreground">Hours</p>
            <p className="mt-2 text-foreground/80">
              Tuesday - Saturday · 11am - 7pm
              <br />
              By appointment on Sundays.
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center rounded-md border border-[#D8E7D2] bg-[#D8E7D2]/25 p-12 text-center lg:col-span-7">
            <CheckCircle2 className="mb-4 h-12 w-12 text-[#5b7a52]" strokeWidth={1.5} />
            <h3 className="font-serif text-3xl">Thank you for writing to us.</h3>
            <p className="mt-3 max-w-md text-foreground/75">
              We have received your message. A member of our atelier team will respond to your query shortly.
            </p>
            <button onClick={() => setSubmitted(false)} className="btn-peher-outline mt-8">
              Send Another Message
            </button>
          </div>
        ) : (
          <form className="space-y-6 lg:col-span-7" onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Name" required />
              <Field label="Email" type="email" required />
            </div>
            <Field label="Subject" required />
            <div>
              <label className="eyebrow !text-foreground mb-3 block">Message</label>
              <textarea
                required
                rows={6}
                className="w-full resize-none border-b border-black/20 bg-transparent pb-3 outline-none focus:border-black"
              />
            </div>
            <button type="submit" className="btn-peher">
              Send Message
            </button>
          </form>
        )}
      </section>

      <div className="grid aspect-[16/6] place-items-center border-y border-black/5 bg-[#f9f9f7]">
        <span className="eyebrow">Google Map · {atelierMapLabel}</span>
      </div>

      <Footer />
    </div>
  );
}

function Field({
  label,
  type = "text",
  required,
}: {
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="eyebrow !text-foreground mb-3 block">{label}</label>
      <input
        required={required}
        type={type}
        className="w-full border-b border-black/20 bg-transparent pb-3 outline-none focus:border-black"
      />
    </div>
  );
}
