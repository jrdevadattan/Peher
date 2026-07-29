import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/lib/use-catalog";

export const Route = createFileRoute("/collections")({
  component: Collections,
  head: () => ({
    meta: [
      { title: "Collections - PEHER" },
      {
        name: "description",
        content: "Explore the live PEHER jewellery collections.",
      },
    ],
  }),
});

function Collections() {
  const { data: categories = [], isLoading, error } = useCategories();

  return (
    <div className="bg-white">
      <Navbar />
      <div className="container-luxe pb-16 pt-36 text-center">
        <p className="eyebrow">Collections</p>
        <h1 className="mt-4 font-serif text-5xl md:text-7xl">A quiet edit.</h1>
      </div>
      <div className="container-luxe grid grid-cols-1 gap-6 pb-32 md:grid-cols-2 md:gap-10">
        {isLoading &&
          Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-4">
              <Skeleton className="aspect-[4/5] rounded-none" />
              <Skeleton className="h-8 w-1/2" />
            </div>
          ))}
        {error && (
          <p className="md:col-span-2 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Collections could not be loaded.
          </p>
        )}
        {!isLoading &&
          categories.map((category) => (
            <Link
              key={category.id}
              to="/shop"
              search={{ category: category.slug }}
              className="group block"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#f9f9f7]">
                <img
                  src={category.image}
                  alt={category.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1400ms] group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/45 via-transparent to-transparent p-8 md:p-12">
                  <div className="text-white drop-shadow">
                    <h2 className="font-serif text-3xl md:text-5xl">{category.name}</h2>
                    <p className="mt-2 max-w-xs text-sm">{category.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
      </div>
      <Footer />
    </div>
  );
}
