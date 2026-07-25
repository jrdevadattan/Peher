import { Link } from "@tanstack/react-router";
import { Search, User, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

const primaryLinks = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop by Product", hasCaret: true },
  { to: "/collections", label: "Shop by Collection", hasCaret: true },
  { to: "/new-arrivals", label: "New Arrivals" },
  { to: "/shop", label: "Bestsellers" },
  { to: "/shop", label: "Milestone 70% Sale", accent: true },
  { to: "/journal", label: "Influencer's Favourite" },
] as const;

const marqueeItems = [
  "Free Gifts on Orders Above ₹2000",
  "Handcrafted in India",
  "Extra is our love language",
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      {/* Announcement marquee */}
      <div className="bg-[#D8E7D2] text-black overflow-hidden py-2">
        <div className="flex whitespace-nowrap marquee-track">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-10 pr-10 shrink-0">
              {marqueeItems.map((t) => (
                <span key={t} className="text-[11px] tracking-[0.24em] uppercase font-medium flex items-center gap-10">
                  {t} <span className="opacity-60">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Nav bar */}
      <div
        className={`transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md border-b border-black/5" : "bg-white"
        }`}
      >
        {/* Wordmark row */}
        <div className="container-luxe pt-4 pb-2 flex items-center justify-center border-b border-black/5">
          <Link to="/" className="text-center select-none">
            <div className="font-serif text-3xl md:text-[32px] tracking-[0.42em] bg-gradient-to-r from-black via-neutral-700 to-black bg-clip-text text-transparent">PEHER</div>
            <div className="text-[9px] tracking-[0.32em] text-muted-foreground mt-0.5">
              BY VASUDHA TIWARI
            </div>
          </Link>
        </div>

        <div className="container-luxe flex items-center justify-between gap-6 py-3">
          {/* Left: nav */}
          <nav className="hidden lg:flex items-center gap-6 flex-1">
            {primaryLinks.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className={`inline-flex items-center gap-1 text-[12px] font-medium tracking-[0.06em] transition ${
                  "accent" in l && l.accent
                    ? "text-black underline decoration-[#D8E7D2] decoration-[3px] underline-offset-4 hover:decoration-black"
                    : "text-foreground/80 hover:text-foreground"
                }`}
              >
                {l.label}
                {"hasCaret" in l && l.hasCaret && (
                  <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />
                )}
              </Link>
            ))}
          </nav>

          {/* Mobile: menu button */}
          <button
            className="lg:hidden -ml-1"
            aria-label="Menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="w-6 h-6" strokeWidth={1.5} />
          </button>

          {/* Right: icons */}
          <div className="flex items-center gap-5">
            <button aria-label="Search" className="hover:opacity-70 transition">
              <Search className="w-[19px] h-[19px]" strokeWidth={1.5} />
            </button>
            <Link to="/wishlist" aria-label="Account" className="hover:opacity-70 transition">
              <User className="w-[19px] h-[19px]" strokeWidth={1.5} />
            </Link>
            <Link to="/cart" aria-label="Cart" className="hover:opacity-70 transition">
              <ShoppingBag className="w-[19px] h-[19px]" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="fixed inset-0 bg-white z-[60] lg:hidden">
          <div className="flex items-center justify-between px-6 py-6 border-b border-black/5">
            <span className="font-serif text-xl tracking-[0.32em]">PEHER</span>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
          <nav className="flex flex-col gap-4 px-8 mt-10">
            {primaryLinks.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                className="font-serif text-2xl tracking-wide border-b border-black/5 pb-4"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}


