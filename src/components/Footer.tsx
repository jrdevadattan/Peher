import { Link } from "@tanstack/react-router";
import { Instagram } from "lucide-react";
import { PeherLogo } from "@/components/PeherLogo";

export function Footer() {
  return (
    <footer className="bg-[#0f0f0f] text-white/80 mt-32">
      <div className="container-luxe py-20 grid grid-cols-2 md:grid-cols-4 gap-12">
        <div className="col-span-2 md:col-span-1">
          <PeherLogo tone="light" className="h-10 w-40" />
          <p className="text-[10px] tracking-[0.28em] mt-2 text-white/60">BY VASUDHA TIWARI</p>
          <p className="mt-8 text-sm font-serif italic text-white/70 leading-relaxed max-w-[220px]">
            "Extra is our love language."
          </p>
        </div>
        <FooterCol
          title="Shop"
          items={[
            { label: "Rings", to: "/shop" },
            { label: "Necklaces", to: "/shop" },
            { label: "Bracelets", to: "/shop" },
            { label: "Earrings", to: "/shop" },
            { label: "New Arrivals", to: "/new-arrivals" },
          ]}
        />
        <FooterCol
          title="Company"
          items={[
            { label: "About", to: "/about" },
            { label: "Journal", to: "/journal" },          ]}
        />
        <FooterCol
          title="Customer Care"
          items={[
            { label: "Contact", to: "/contact" },
            { label: "Shipping", to: "/shipping" },
            { label: "Returns", to: "/returns" },
            { label: "Size Guide", to: "/size-guide" },          ]}
        />
      </div>
      <div className="border-t border-white/10">
        <div className="container-luxe py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] tracking-[0.16em] uppercase text-white/50">
          <p>© {new Date().getFullYear()} PEHER. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" aria-label="Instagram" className="hover:text-white transition">
              <Instagram className="w-4 h-4" strokeWidth={1.25} />
            </a>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { label: string; to: string }[] }) {
  return (
    <div>
      <h4 className="eyebrow !text-white/70 font-sans !font-medium">{title}</h4>
      <ul className="mt-5 space-y-3">
        {items.map((i) => (
          <li key={i.label}>
            <Link to={i.to} className="text-sm text-white/70 hover:text-white transition">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
