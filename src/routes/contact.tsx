import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MapPin, Mail, Phone, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({ meta: [{ title: "Contact — PEHER" }, { name: "description", content: "Visit the PEHER atelier, or write to us." }] }),
});

function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-white">
      <Navbar />
      <section className="pt-40 pb-16 container-luxe text-center">
        <p className="eyebrow">Contact</p>
        <h1 className="font-serif text-5xl md:text-7xl mt-4">Say hello.</h1>
        <p className="mt-6 text-muted-foreground max-w-md mx-auto">We'd love to hear from you — about a piece, a custom order, or simply the weather.</p>
      </section>

      <section className="container-luxe pb-24 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-5 space-y-10">
          {[
            { icon: MapPin, title: "The Atelier", body: "Studio 04, Mehrauli\nNew Delhi 110030, India" },
            { icon: Mail, title: "Email", body: "hello@peher.studio" },
            { icon: Phone, title: "Phone", body: "+91 98 1234 5678" },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-5">
              <div className="w-11 h-11 grid place-items-center bg-[#D8E7D2]/50 rounded-full shrink-0">
                <Icon className="w-4 h-4" strokeWidth={1.25} />
              </div>
              <div>
                <p className="eyebrow !text-foreground">{title}</p>
                <p className="mt-2 text-foreground/80 whitespace-pre-line leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
          <div>
            <p className="eyebrow !text-foreground">Hours</p>
            <p className="mt-2 text-foreground/80">Tuesday – Saturday · 11am – 7pm<br />By appointment on Sundays.</p>
          </div>
        </div>

        {submitted ? (
          <div className="lg:col-span-7 flex flex-col items-center justify-center p-12 bg-[#D8E7D2]/25 border border-[#D8E7D2] rounded-md text-center">
            <CheckCircle2 className="w-12 h-12 text-[#5b7a52] mb-4" strokeWidth={1.5} />
            <h3 className="font-serif text-3xl">Thank you for writing to us.</h3>
            <p className="mt-3 text-foreground/75 max-w-md">
              We have received your message. A member of our atelier team will respond to your query shortly.
            </p>
            <button onClick={() => setSubmitted(false)} className="mt-8 btn-peher-outline">
              Send Another Message
            </button>
          </div>
        ) : (
          <form className="lg:col-span-7 space-y-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
              <Field label="Name" required />
              <Field label="Email" type="email" required />
            </div>
            <Field label="Subject" required />
            <div>
              <label className="eyebrow !text-foreground block mb-3">Message</label>
              <textarea required rows={6} className="w-full border-b border-black/20 pb-3 outline-none focus:border-black bg-transparent resize-none" />
            </div>
            <button type="submit" className="btn-peher">Send Message</button>
          </form>
        )}
      </section>

      <div className="aspect-[16/6] bg-[#f9f9f7] grid place-items-center border-y border-black/5">
        <span className="eyebrow">Google Map · Mehrauli, New Delhi</span>
      </div>

      <Footer />
    </div>
  );
}

function Field({ label, type = "text", required }: { label: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="eyebrow !text-foreground block mb-3">{label}</label>
      <input required={required} type={type} className="w-full border-b border-black/20 pb-3 outline-none focus:border-black bg-transparent" />
    </div>
  );
}
