import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/lib/use-catalog";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { z } from "zod";

export const Route = createFileRoute("/shop")({
  component: Shop,
  validateSearch: z.object({
    category: z.string().trim().max(100).optional(),
  }),
  head: () => ({
    meta: [
      { title: "Shop — PEHER" },
      {
        name: "description",
        content:
          "Shop the PEHER collection of handcrafted rings, necklaces, bracelets and earrings.",
      },
    ],
  }),
});

type FilterKey = "category" | "material" | "price" | "availability";

const sortOptions = ["Newest", "Best Selling", "Price: Low to High", "Price: High to Low"] as const;
type Sort = (typeof sortOptions)[number];

function matchesPrice(price: number, bucket: string) {
  if (bucket === "Under ₹1,500") return price < 1500;
  if (bucket === "₹1,500 – ₹2,500") return price >= 1500 && price <= 2500;
  if (bucket === "₹2,500 – ₹3,500") return price > 2500 && price <= 3500;
  if (bucket === "Above ₹3,500") return price > 3500;
  return true;
}

function inferCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("ring")) return "Rings";
  if (n.includes("necklace") || n.includes("pendant")) return "Necklaces";
  if (n.includes("bracelet") || n.includes("cuff") || n.includes("chain bracelet"))
    return "Bracelets";
  if (n.includes("earring") || n.includes("hoop")) return "Earrings";
  return "";
}

function Shop() {
  const { data: products = [], isLoading, error } = useProducts();
  const { category: categorySlug } = Route.useSearch();
  const [selected, setSelected] = useState<Record<FilterKey, string[]>>({
    category: [],
    material: [],
    price: [],
    availability: [],
  });
  const [sort, setSort] = useState<Sort>("Newest");

  useEffect(() => {
    if (!categorySlug) return;
    const categoryName = products.find(
      (product) => product.categorySlug === categorySlug,
    )?.category;
    if (!categoryName) return;
    setSelected((current) => ({
      ...current,
      category: [categoryName],
    }));
  }, [categorySlug, products]);

  const filterConfig = useMemo(
    (): { key: FilterKey; title: string; items: string[] }[] => [
      {
        key: "category",
        title: "Category",
        items: Array.from(
          new Set(products.map((product) => product.category).filter(Boolean)),
        ) as string[],
      },
      {
        key: "material",
        title: "Material",
        items: Array.from(new Set(products.map((product) => product.material))).filter(Boolean),
      },
      {
        key: "price",
        title: "Price",
        items: ["Under ₹1,500", "₹1,500 – ₹2,500", "₹2,500 – ₹3,500", "Above ₹3,500"],
      },
      {
        key: "availability",
        title: "Availability",
        items: ["In Stock", "Made to Order"],
      },
    ],
    [products],
  );

  const toggle = (key: FilterKey, value: string) => {
    setSelected((s) => ({
      ...s,
      [key]: s[key].includes(value) ? s[key].filter((v) => v !== value) : [...s[key], value],
    }));
  };

  const clearAll = () => setSelected({ category: [], material: [], price: [], availability: [] });

  const activeCount = Object.values(selected).reduce((a, b) => a + b.length, 0);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (
        selected.category.length &&
        !selected.category.includes(p.category || inferCategory(p.name))
      )
        return false;
      if (
        selected.material.length &&
        !selected.material.some((m) => p.material.toLowerCase().includes(m.toLowerCase()))
      )
        return false;
      if (selected.price.length && !selected.price.some((b) => matchesPrice(p.price, b)))
        return false;
      if (selected.availability.length) {
        const inStock = !p.outOfStock;
        const wantsInStock = selected.availability.includes("In Stock");
        const wantsMTO = selected.availability.includes("Made to Order");
        if (wantsInStock && !wantsMTO && !inStock) return false;
        if (wantsMTO && !wantsInStock && inStock) return false;
      }
      return true;
    });

    if (sort === "Price: Low to High") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "Price: High to Low") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, selected, sort]);

  return (
    <div className="bg-white">
      <Navbar />
      <div className="pt-36 pb-10 container-luxe">
        <p className="eyebrow">Shop</p>
        <h1 className="font-serif text-5xl md:text-7xl mt-4">The Collection</h1>
        <p className="mt-5 text-muted-foreground max-w-md">
          A quiet catalogue of hand-finished pieces, made in small numbers.
        </p>
      </div>

      {/* Inline filter bar */}
      <div className="sticky top-[92px] z-30 bg-white/95 backdrop-blur border-y border-black/10">
        <div className="container-luxe py-3 flex items-center gap-2 md:gap-3 overflow-x-auto">
          {/* Mobile: single filter sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="md:hidden shrink-0 inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase font-semibold border border-black px-4 py-2.5 rounded-full">
                <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.75} />
                Filter{" "}
                {activeCount > 0 && (
                  <span className="ml-1 bg-black text-white rounded-full w-5 h-5 inline-flex items-center justify-center text-[10px]">
                    {activeCount}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[86%] sm:w-[380px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="font-serif text-2xl text-left">Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {filterConfig.map((f) => (
                  <details key={f.key} open className="group border-b border-black/10 pb-4">
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                      <span className="eyebrow !text-foreground">{f.title}</span>
                      <ChevronDown
                        className="w-4 h-4 transition-transform group-open:rotate-180"
                        strokeWidth={1.25}
                      />
                    </summary>
                    <ul className="mt-4 space-y-3">
                      {f.items.map((i) => {
                        const active = selected[f.key].includes(i);
                        return (
                          <li key={i}>
                            <label className="flex items-center gap-3 text-sm text-foreground/80 cursor-pointer">
                              <span
                                onClick={() => toggle(f.key, i)}
                                className={`w-4 h-4 border inline-flex items-center justify-center transition ${active ? "bg-black border-black" : "border-black/40"}`}
                              >
                                {active && <span className="w-1.5 h-1.5 bg-white" />}
                              </span>
                              <span onClick={() => toggle(f.key, i)}>{i}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                ))}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={clearAll}
                    className="flex-1 border border-black py-3 text-[11px] tracking-[0.22em] uppercase font-semibold"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop: inline filter dropdowns */}
          <div className="hidden md:flex items-center gap-2">
            {filterConfig.map((f) => {
              const count = selected[f.key].length;
              return (
                <Popover key={f.key}>
                  <PopoverTrigger asChild>
                    <button
                      className={`inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase font-semibold px-4 py-2.5 rounded-full border transition ${
                        count > 0
                          ? "bg-black text-white border-black"
                          : "border-black/20 hover:border-black"
                      }`}
                    >
                      {f.title}
                      {count > 0 && <span className="opacity-80">({count})</span>}
                      <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 p-4">
                    <ul className="space-y-2.5">
                      {f.items.map((i) => {
                        const active = selected[f.key].includes(i);
                        return (
                          <li key={i}>
                            <button
                              onClick={() => toggle(f.key, i)}
                              className="w-full flex items-center gap-3 text-sm text-foreground/80 hover:text-foreground text-left"
                            >
                              <span
                                className={`w-4 h-4 border inline-flex items-center justify-center transition ${active ? "bg-black border-black" : "border-black/40"}`}
                              >
                                {active && <span className="w-1.5 h-1.5 bg-white" />}
                              </span>
                              {i}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </PopoverContent>
                </Popover>
              );
            })}
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.2em] uppercase font-medium text-muted-foreground hover:text-foreground ml-1"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} /> Clear
              </button>
            )}
          </div>

          <div className="flex-1" />

          <div className="shrink-0 flex items-center gap-3">
            <span className="hidden sm:inline text-[11px] tracking-[0.22em] uppercase text-muted-foreground">
              Sort
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="bg-transparent border border-black/20 hover:border-black rounded-full py-2 pl-4 pr-8 text-[11px] tracking-[0.2em] uppercase font-semibold outline-none cursor-pointer"
            >
              {sortOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active chips row */}
        {activeCount > 0 && (
          <div className="container-luxe pb-3 flex flex-wrap gap-2">
            {(Object.keys(selected) as FilterKey[]).flatMap((k) =>
              selected[k].map((v) => (
                <button
                  key={`${k}-${v}`}
                  onClick={() => toggle(k, v)}
                  className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.14em] uppercase bg-[#D8E7D2] text-black px-3 py-1.5 rounded-full hover:bg-black hover:text-white transition"
                >
                  {v}
                  <X className="w-3 h-3" strokeWidth={2} />
                </button>
              )),
            )}
          </div>
        )}
      </div>

      <div className="container-luxe py-10 pb-32">
        {error && (
          <p className="mb-8 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            The collection could not be loaded. Please try again.
          </p>
        )}
        {isLoading ? (
          <Skeleton className="mb-8 h-4 w-24" />
        ) : (
          <p className="mb-8 text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
          </p>
        )}
        {isLoading ? (
          <ProductGridSkeleton
            count={8}
            className="gap-6 md:grid-cols-3 md:gap-10 lg:grid-cols-4"
          />
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif text-2xl">No pieces match these filters.</p>
            <button
              onClick={clearAll}
              className="mt-5 text-[11px] tracking-[0.22em] uppercase font-semibold underline underline-offset-4"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
