import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronDown,
  Heart,
  Loader2,
  Minus,
  Plus,
  Star,
} from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useNavigate } from "@tanstack/react-router";
import { useProducts } from "@/lib/use-catalog";
import { ProductDetailSkeleton, ProductGridSkeleton } from "@/components/loading-skeletons";
import {
  getProductBySlug,
  getProductReviews,
  getStorefrontSettings,
  submitProductReview,
} from "@/lib/catalog-api";
import {
  absoluteUrl,
  buildProductBreadcrumbJsonLd,
  buildProductJsonLd,
  serializeJsonLd,
} from "@/lib/seo";
import { useAuth } from "@/lib/auth-context";
import { getProductBadges, type ProductBadge } from "@/lib/product-badges";

const badgeToneClass: Record<ProductBadge["tone"], string> = {
  dark: "border-black bg-black text-white",
  fresh: "border-[#D8E7D2] bg-[#D8E7D2] text-black",
  sale: "border-black/15 bg-white text-black",
  sold: "border-black bg-black text-white",
  warning: "border-amber-200 bg-[#fff2cc] text-black",
};

export const Route = createFileRoute("/product/$id")({
  validateSearch: (search: Record<string, unknown>) => ({
    variant: typeof search.variant === "string" ? search.variant : undefined,
  }),
  component: ProductPage,
  pendingComponent: ProductPending,
  loader: async ({ params }) => {
    const product = await getProductBySlug(params.id);
    const [reviews, settings] = await Promise.all([
      getProductReviews(product.databaseId),
      getStorefrontSettings(),
    ]);
    return { product, reviews, settings };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "PEHER Product" },
          {
            name: "description",
            content: "A handcrafted jewellery piece from PEHER.",
          },
        ],
      };
    }
    const { product, reviews, settings } = loaderData;
    const title = product.seoTitle || `${product.name} | ${settings.storeName}`;
    const description =
      product.seoDescription || product.shortDescription || product.description.slice(0, 160);
    const canonical = absoluteUrl(settings, `/product/${product.id}`);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: canonical },
        { property: "og:image", content: product.image },
        { property: "product:price:amount", content: product.price.toFixed(2) },
        { property: "product:price:currency", content: settings.currencyCode },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: product.image },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: serializeJsonLd(buildProductJsonLd(product, reviews, settings)),
        },
        {
          type: "application/ld+json",
          children: serializeJsonLd(buildProductBreadcrumbJsonLd(product, settings)),
        },
      ],
    };
  },
});

function ProductPending() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <ProductDetailSkeleton />
    </div>
  );
}

function RatingStars({ value, size = "w-4 h-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex gap-1" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={`${size} ${
            index < Math.round(value)
              ? "fill-amber-400 stroke-amber-400"
              : "fill-transparent stroke-black/20"
          }`}
          strokeWidth={1.25}
        />
      ))}
    </span>
  );
}

function ReviewForm({ productId }: { productId: string }) {
  const { user, loading } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin" aria-label="Checking sign-in status" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="border border-black/10 bg-white p-8 text-center">
        <h3 className="font-serif text-2xl">Share your experience.</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Sign in with your PEHER account to leave a product review.
        </p>
        <Link to="/login" className="btn-peher mt-6 inline-flex">
          Sign in to review
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="border border-[#D8E7D2] bg-white p-8 text-center">
        <BadgeCheck className="mx-auto h-6 w-6 text-emerald-700" />
        <h3 className="mt-3 font-serif text-2xl">Thank you for reviewing this piece.</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your review is awaiting moderation and will appear here once approved.
        </p>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await submitProductReview({ productId, rating, title, comment });
      setSubmitted(true);
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Your review could not be submitted.";
      setError(
        message.includes("duplicate") || message.includes("already")
          ? "You have already reviewed this product."
          : message,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-black/10 bg-white p-6 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="eyebrow">Write a review</p>
          <h3 className="mt-2 font-serif text-3xl">How did this piece feel?</h3>
        </div>
        <div>
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em]">
            Your rating
          </span>
          <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, index) => {
              const star = index + 1;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  aria-label={`Rate ${star} out of 5`}
                  className="p-1"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating
                        ? "fill-amber-400 stroke-amber-400"
                        : "fill-transparent stroke-black/25"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-7 grid gap-5">
        <label>
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em]">
            Review title
          </span>
          <input
            required
            minLength={3}
            maxLength={120}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="A short summary"
            className="w-full border border-black/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-black"
          />
        </label>
        <label>
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em]">
            Your review
          </span>
          <textarea
            required
            minLength={20}
            maxLength={2000}
            rows={5}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Tell other customers about quality, fit, finish, and your experience."
            className="w-full resize-none border border-black/15 bg-transparent px-4 py-3 text-sm leading-relaxed outline-none focus:border-black"
          />
          <span className="mt-1 block text-right text-[10px] text-muted-foreground">
            {comment.length}/2000
          </span>
        </label>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-peher mt-5 min-w-44 disabled:opacity-50">
        {busy ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );
}

function ProductPage() {
  const { product, reviews, settings } = Route.useLoaderData();
  const { variant: requestedVariant } = Route.useSearch();
  const { data: products = [], isLoading: recommendationsLoading } = useProducts();
  const [size, setSize] = useState<string | null>(
    () =>
      product.variants.find(
        (variant) => variant.id === requestedVariant || variant.sku === requestedVariant,
      )?.size ?? null,
  );
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

  const handleAddToBag = () => {
    addItem(product, size, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    addItem(product, size, qty);
    navigate({ to: "/cart" });
  };
  const gallery = product.images.length ? product.images : [product.image];
  const recommended = products.filter((p) => p.id !== product.id).slice(0, 4);
  const sizes = product.variants?.map((variant) => variant.size).filter(Boolean) as string[];
  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : 0;
  const badges = getProductBadges(product);

  return (
    <div className="bg-white">
      <Navbar />

      <div className="pt-32 pb-4 container-luxe flex items-center justify-between">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase font-medium hover:opacity-60 transition"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.25} /> Back
        </Link>
        <div className="text-center">
          <p className="font-serif tracking-[0.3em] text-sm">PEHER</p>
          <p className="text-[9px] tracking-[0.28em] text-muted-foreground mt-0.5">
            NEW COLLECTION
          </p>
        </div>
        <button
          aria-label="Wishlist"
          className="w-10 h-10 grid place-items-center rounded-full hover:bg-muted transition"
        >
          <Heart className="w-[18px] h-[18px]" strokeWidth={1.25} />
        </button>
      </div>

      <section className="container-luxe grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 pt-4 pb-24">
        {/* Sticky gallery */}
        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-28 space-y-4">
            <div className="aspect-[4/5] bg-[#f9f9f7] overflow-hidden">
              <img src={gallery[0]} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {gallery.map((g, i) => (
                <div key={i} className="aspect-square bg-[#f9f9f7] overflow-hidden cursor-pointer">
                  <img src={g} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-5">
          <p className="eyebrow">{product.material}</p>
          {badges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span
                  key={badge.label}
                  className={`inline-flex max-w-full items-center rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${badgeToneClass[badge.tone]}`}
                >
                  <span className="truncate whitespace-nowrap">{badge.label}</span>
                </span>
              ))}
            </div>
          )}
          <h1 className="font-serif text-4xl md:text-5xl mt-4 leading-[1.05]">{product.name}</h1>
          {reviews.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <RatingStars value={averageRating} />
              <a href="#reviews" className="text-xs underline underline-offset-4">
                {averageRating.toFixed(1)} from {reviews.length}{" "}
                {reviews.length === 1 ? "review" : "reviews"}
              </a>
            </div>
          )}
          <p className="mt-6 text-2xl font-serif">₹{product.price.toLocaleString("en-IN")}</p>

          <p className="mt-8 font-serif italic text-lg leading-relaxed text-foreground/80 max-w-md">
            {product.description ||
              "Formed by time and pressure, each piece carries a quiet history. Organic lines shaped by hand — no two are ever the same."}
          </p>

          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <p className="eyebrow !text-foreground">Select Size</p>
              <button className="text-[11px] tracking-[0.18em] uppercase underline underline-offset-4 text-muted-foreground hover:text-foreground">
                Size Guide
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`py-3 text-sm border transition ${
                    size === s
                      ? "border-black bg-black text-white"
                      : "border-black/15 hover:border-black"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border border-black/15">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-11 h-11 grid place-items-center"
              >
                <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="w-11 h-11 grid place-items-center">
                <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
            <button onClick={handleAddToBag} className="btn-peher-outline flex-1">
              {added ? "Added ✓" : "Add to Bag"}
            </button>
          </div>
          <button onClick={handleBuyNow} className="btn-peher w-full mt-3">
            Buy Now
          </button>

          <div className="mt-6 flex items-center justify-center gap-5 text-[10px] tracking-[0.24em] uppercase text-muted-foreground">
            <span>
              Free shipping over ₹{settings.freeShippingThreshold.toLocaleString("en-IN")}
            </span>
            <span>·</span>
            <span>Damage support</span>
          </div>

          <div className="mt-12 border-t border-black/10">
            {[
              {
                t: "Description",
                c: `Handcrafted in ${product.material.toLowerCase()}, this piece is finished slowly in our atelier. Weight and proportions are refined by hand.`,
              },
              {
                t: "Specifications",
                c: [
                  product.material && `Material: ${product.material}`,
                  product.weight && `Weight: ${product.weight}`,
                  product.dimensions && `Dimensions: ${product.dimensions}`,
                  product.subcategory && `Style: ${product.subcategory}`,
                ]
                  .filter(Boolean)
                  .join(" | "),
              },
              {
                t: "Shipping",
                c: `We currently ship across India. Orders are processed within 1–3 business days after confirmation. Standard delivery usually takes 7–8 business days depending on your location. Cash on Delivery (COD) is not available — we accept prepaid orders only. Standard shipping is ₹${settings.standardShippingRate.toLocaleString("en-IN")} per order. Shipping is free on orders of ₹${settings.freeShippingThreshold.toLocaleString("en-IN")} or more. Delivery timelines may vary during festivals, sales, or due to unforeseen courier delays.`,
              },
              {
                t: "Returns",
                c: "At Peher, every order is packed with care. Due to the nature of our products, we currently do not accept returns or exchanges unless the item received is damaged, defective, or incorrect. If you receive a damaged or incorrect product, please contact us within 48 hours of delivery with your order number and clear photos of the item. Our team will review your request and arrange a replacement or appropriate resolution. Items must be unused and in their original packaging. Minor variations in colour or finish may occur due to photography and the handcrafted nature of some products and are not considered defects. Sale items are not eligible for return or exchange.",
              },
              {
                t: "Care Guide",
                c: "Store in the pouch provided. Wipe with a soft cloth. Avoid contact with perfume and water for longest wear.",
              },
              {
                t: "Size Guide",
                c: "Ring sizes follow US standards. If between sizes, we suggest sizing up.",
              },
            ]
              .filter((row) => row.c)
              .map((row) => (
                <details key={row.t} className="group border-b border-black/10 py-5">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <span className="eyebrow !text-foreground">{row.t}</span>
                    <ChevronDown
                      className="w-4 h-4 transition-transform group-open:rotate-180"
                      strokeWidth={1.25}
                    />
                  </summary>
                  <p className="mt-4 text-sm text-foreground/75 leading-relaxed">{row.c}</p>
                </details>
              ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="scroll-mt-24 bg-[#f9f9f7] py-24">
        <div className="container-luxe">
          <div className="text-center mb-14">
            <p className="eyebrow">Customer Reviews</p>
            <h2 className="font-serif text-4xl md:text-5xl mt-4">Held close.</h2>
            {reviews.length > 0 && (
              <div className="mt-5 flex items-center justify-center gap-3">
                <RatingStars value={averageRating} size="h-5 w-5" />
                <span className="text-sm">
                  {averageRating.toFixed(1)} average from {reviews.length}{" "}
                  {reviews.length === 1 ? "review" : "reviews"}
                </span>
              </div>
            )}
          </div>
          <div className="mx-auto max-w-6xl">
            {reviews.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {reviews.map((review) => (
                  <article key={review.id} className="border border-black/10 bg-white p-6">
                    <RatingStars value={review.rating} />
                    {review.title && <h3 className="mt-4 font-serif text-xl">{review.title}</h3>}
                    <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                      {review.comment}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      <span>{review.customerName}</span>
                      <time dateTime={review.date}>
                        {new Date(review.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                      {review.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Verified purchase
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="md:col-span-3 text-center text-sm text-muted-foreground">
                This piece has not been reviewed yet.
              </p>
            )}
            <div className="mt-12">
              <ReviewForm productId={product.databaseId} />
            </div>
          </div>
        </div>
      </section>

      {/* Recommended */}
      <section className="py-24 container-luxe">
        <div className="text-center mb-14">
          <p className="eyebrow">You may also love</p>
          <h2 className="font-serif text-4xl md:text-5xl mt-4">Pieces to pair.</h2>
        </div>
        {recommendationsLoading ? (
          <ProductGridSkeleton count={4} className="gap-6 md:gap-8" />
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            {recommended.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
