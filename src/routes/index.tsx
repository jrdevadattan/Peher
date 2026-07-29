import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories, useProducts } from "@/lib/use-catalog";
import { getHomepageBanners } from "@/lib/catalog-api";
import { ArrowRight, Instagram } from "lucide-react";
import { useState } from "react";
import hero from "@/assets/hero.jpg";
import editorial1 from "@/assets/editorial1.jpg";
import rings from "@/assets/rings.jpg";
import necklaces from "@/assets/necklaces.jpg";
import bracelets from "@/assets/bracelets.jpg";
import earrings from "@/assets/earrings.jpg";

const INSTAGRAM_URL = "https://www.instagram.com/peher.online?igsh=MTA3cmNhOWFsZ3V1OA==";

export const Route = createFileRoute("/")({
  component: HomePage,
  pendingComponent: HomePending,
  loader: () => getHomepageBanners(),
  head: () => ({
    meta: [
      { title: "PEHER — Extra is our love language." },
      {
        name: "description",
        content:
          "Handcrafted luxury jewellery by Vasudha Tiwari. Bestselling rings, necklaces, bracelets & earrings — shipped across India.",
      },
    ],
  }),
});

function safeBannerUrl(url: string) {
  const trimmed = url.trim();
  return trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed) ? trimmed : "/shop";
}

function HomePage() {
  const heroSlides = Route.useLoaderData();
  const [slide, setSlide] = useState(0);
  const active = heroSlides.length ? heroSlides[slide % heroSlides.length] : null;
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  return (
    <div className="bg-white text-foreground">
      <Navbar />

      {/* HERO — full width slider */}
      {active ? (
        <section className="relative pt-[132px] md:pt-[148px]">
          <div className="relative h-[70vh] w-full overflow-hidden bg-[#D8E7D2]/40 md:h-[86vh]">
            <img
              key={active.id}
              src={active.imageUrl}
              alt={active.imageAlt || active.title}
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover fade-up"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/25" />
            <div className="relative z-10 h-full container-luxe flex flex-col justify-center items-start md:items-center text-left md:text-center pt-10">
              <h1 className="font-serif text-[64px] md:text-[128px] lg:text-[160px] leading-[0.9] mt-6 text-white tracking-[-0.02em] drop-shadow-md">
                {active.title}
              </h1>
              <p className="mt-5 md:mt-6 font-serif italic text-lg md:text-2xl text-white/95 max-w-xl drop-shadow">
                {active.subtitle}
              </p>
              <a
                href={safeBannerUrl(active.ctaUrl)}
                className="mt-8 md:mt-10 inline-flex items-center gap-3 bg-white text-black px-8 py-4 text-[11px] tracking-[0.24em] uppercase font-semibold rounded-full hover:bg-[#D8E7D2] transition"
              >
                {active.ctaLabel} <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </a>
            </div>

            {heroSlides.length > 1 && (
              <div className="absolute bottom-6 md:bottom-8 inset-x-0 flex items-center justify-center gap-2 z-10">
                {heroSlides.map((banner, i) => (
                  <button
                    key={banner.id}
                    onClick={() => setSlide(i)}
                    aria-label={`Slide ${i + 1}`}
                    aria-current={i === slide % heroSlides.length}
                    className={`h-1.5 rounded-full transition-all ${
                      i === slide % heroSlides.length ? "w-8 bg-white" : "w-1.5 bg-white/60"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <div className="pt-[132px] md:pt-[148px]" />
      )}

      {/* BESTSELLERS */}
      <section className="py-20 md:py-28">
        <div className="container-luxe">
          <h2 className="text-center font-serif text-4xl md:text-5xl tracking-[0.12em] uppercase mb-3">
            Bestsellers
          </h2>
          <p className="text-center text-sm text-muted-foreground max-w-md mx-auto mb-14">
            The pieces our circle keeps coming back for.
          </p>
          {isLoading ? (
            <ProductGridSkeleton count={8} className="gap-5 md:gap-7" />
          ) : (
            <div className="grid grid-cols-2 gap-5 md:gap-7 lg:grid-cols-4">
              {products.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
          <div className="mt-14 text-center">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-black text-white px-10 py-3.5 text-[11px] tracking-[0.24em] uppercase font-semibold rounded-full hover:bg-[#D8E7D2] hover:text-black transition"
            >
              View All
            </Link>
          </div>
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="py-20 md:py-24 bg-[#D8E7D2]/25">
        <div className="container-luxe">
          <h2 className="text-center font-serif text-4xl md:text-5xl mb-14 tracking-tight">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {categoriesLoading &&
              Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="space-y-4">
                  <Skeleton className="aspect-square rounded-none" />
                  <Skeleton className="h-7 w-2/3" />
                </div>
              ))}
            {!categoriesLoading &&
              categories
                .filter((c) => c.image)
                .map((c) => (
                  <Link key={c.id} to="/shop" search={{ category: c.slug }} className="group block">
                    <div className="relative aspect-square overflow-hidden bg-white">
                      <img
                        src={c.image}
                        alt={c.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
                      />
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <h3 className="font-serif text-xl md:text-2xl">{c.name}</h3>
                      <ArrowRight
                        className="w-4 h-4 opacity-60 group-hover:translate-x-1 group-hover:opacity-100 transition"
                        strokeWidth={1.5}
                      />
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* NEW LAUNCHES */}
      <section className="py-20 md:py-28">
        <div className="container-luxe">
          <h2 className="text-center font-serif text-4xl md:text-5xl mb-14 tracking-tight">
            New Launches
          </h2>
          {isLoading ? (
            <ProductGridSkeleton count={8} className="gap-5 md:gap-7" />
          ) : (
            <div className="grid grid-cols-2 gap-5 md:gap-7 lg:grid-cols-4">
              {[...products]
                .reverse()
                .slice(0, 8)
                .map((p) => (
                  <ProductCard key={`${p.id}-new-launch`} product={p} />
                ))}
            </div>
          )}
          <div className="mt-14 text-center">
            <Link
              to="/new-arrivals"
              className="inline-flex items-center gap-2 bg-black text-white px-10 py-3.5 text-[11px] tracking-[0.24em] uppercase font-semibold rounded-full hover:bg-[#D8E7D2] hover:text-black transition"
            >
              View All
            </Link>
          </div>
        </div>
      </section>

      {/* INSTAGRAM */}
      <section className="py-20 md:py-24 bg-[#D8E7D2]/30">
        <div className="container-luxe">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-4xl md:text-5xl tracking-tight">
              Our Instagram is amazing
            </h2>
            <p className="mt-5 text-foreground/75 leading-relaxed">
              If you don&apos;t follow us already, you&apos;re missing out. We promise to make you
              laugh with our reels and swoon with every drop.
            </p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-6 text-[11px] tracking-[0.24em] uppercase font-semibold border-b border-black pb-1 hover:gap-3 transition-all"
            >
              <Instagram className="w-4 h-4" strokeWidth={1.5} /> @peher.online
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {[rings, necklaces, bracelets, earrings, hero, editorial1].map((img, i) => (
              <a
                key={i}
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-square overflow-hidden bg-white"
              >
                <img
                  src={img}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors grid place-items-center">
                  <Instagram
                    className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition"
                    strokeWidth={1.5}
                  />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function HomePending() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="pt-[132px] md:pt-[148px]">
        <Skeleton className="h-[70vh] w-full rounded-none md:h-[86vh]" />
      </section>
      <div className="container-luxe py-20 md:py-28">
        <Skeleton className="mx-auto h-12 w-64" />
        <ProductGridSkeleton count={8} className="mt-14 gap-5 md:gap-7" />
      </div>
    </div>
  );
}
