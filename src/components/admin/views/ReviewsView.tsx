import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminReviews, updateReview, type AdminReview } from "@/lib/admin-api";
import { BadgeCheck, Star, MessageSquare } from "lucide-react";
import { AdminCardListSkeleton } from "@/components/loading-skeletons";

export function ReviewsView() {
  const queryClient = useQueryClient();
  const { data: reviews = [], isLoading, error } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: getAdminReviews,
  });
  const [replyText, setReplyText] = useState<{ [id: string]: string }>({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [rating, setRating] = useState("All");
  const filteredReviews = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reviews.filter(
      (review) =>
        (!query ||
          [review.productName, review.customerName, review.customerEmail, review.comment]
            .join(" ")
            .toLowerCase()
            .includes(query)) &&
        (status === "All" || review.status === status) &&
        (rating === "All" || review.rating === Number(rating)),
    );
  }, [rating, reviews, search, status]);

  const handleStatus = async (id: string, status: "Approved" | "Rejected") => {
    const review = reviews.find((item) => item.id === id);
    if (!review) return;
    await updateReview(review, { status });
    await queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
  };

  const handleReplySubmit = async (id: string) => {
    const text = replyText[id];
    if (!text) return;
    const review = reviews.find((item) => item.id === id);
    if (!review) return;
    await updateReview(review, { reply: text });
    await queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    setReplyText((prev) => ({ ...prev, [id]: "" }));
  };

  return (
    <div className="space-y-6 fade-up">
      {error && <p className="text-xs text-red-600">Reviews could not be loaded.</p>}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight">Customer Product Reviews</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Moderate verified buyer feedback, publish customer testimonials, and compose official responses.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_180px_160px]">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, customer, or review..." className="rounded-lg border border-border bg-transparent p-2.5 text-xs" />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-border bg-transparent p-2.5 text-xs"><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option></select>
        <select value={rating} onChange={(event) => setRating(event.target.value)} className="rounded-lg border border-border bg-transparent p-2.5 text-xs"><option>All</option>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}</select>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <AdminCardListSkeleton count={4} />
        ) : filteredReviews.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No product reviews have been submitted.
          </p>
        ) : filteredReviews.map((r) => (
          <div key={r.id} className="bg-card border border-border p-6 rounded-xl shadow-xs space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{r.productName}</span>
                <div className="flex items-center gap-1 text-amber-500 mt-1">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                  ))}
                </div>
                {r.verifiedPurchase && (
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified purchase
                  </span>
                )}
              </div>
              <span
                className={`uppercase tracking-wider font-semibold text-[9px] px-2.5 py-1 rounded-full ${
                  r.status === "Approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                {r.status}
              </span>
            </div>

            {r.title && <h3 className="font-serif text-xl">{r.title}</h3>}
            <blockquote className="font-serif italic text-lg leading-relaxed text-foreground/90">"{r.comment}"</blockquote>

            <div className="text-xs text-muted-foreground flex items-center justify-between border-t border-border pt-3">
              <span>By {r.customerName} ({r.customerEmail}) on {r.date}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStatus(r.id, "Approved")}
                  className="px-3 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatus(r.id, "Rejected")}
                  className="px-3 py-1 bg-red-600 text-white rounded text-[11px] font-semibold hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>

            {r.reply && (
              <div className="bg-[#D8E7D2]/25 border border-[#D8E7D2] p-3 rounded-lg text-xs space-y-1">
                <p className="font-semibold text-black flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> PEHER Atelier Response:
                </p>
                <p className="italic text-foreground/80">{r.reply}</p>
              </div>
            )}

            {!r.reply && (
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Type official atelier response..."
                  value={replyText[r.id] || ""}
                  onChange={(e) => setReplyText({ ...replyText, [r.id]: e.target.value })}
                  className="flex-1 border border-border rounded-lg px-3 py-1.5 text-xs outline-none bg-transparent"
                />
                <button
                  onClick={() => handleReplySubmit(r.id)}
                  className="px-4 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider"
                >
                  Reply
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
