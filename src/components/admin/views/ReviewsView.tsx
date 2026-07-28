import { useState } from "react";
import { AdminStore, type AdminReview } from "@/lib/admin-store";
import { Star, CheckCircle, XCircle, Trash2, MessageSquare } from "lucide-react";

export function ReviewsView() {
  const [reviews, setReviews] = useState<AdminReview[]>(AdminStore.reviews);
  const [replyText, setReplyText] = useState<{ [id: string]: string }>({});

  const handleStatus = (id: string, status: "Approved" | "Rejected") => {
    const updated = reviews.map((r) => (r.id === id ? { ...r, status } : r));
    setReviews(updated);
    AdminStore.reviews = updated;
  };

  const handleReplySubmit = (id: string) => {
    const text = replyText[id];
    if (!text) return;
    const updated = reviews.map((r) => (r.id === id ? { ...r, reply: text } : r));
    setReviews(updated);
    AdminStore.reviews = updated;
    setReplyText((prev) => ({ ...prev, [id]: "" }));
  };

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight">Customer Product Reviews</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Moderate verified buyer feedback, publish customer testimonials, and compose official responses.
        </p>
      </div>

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="bg-card border border-border p-6 rounded-xl shadow-xs space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{r.productName}</span>
                <div className="flex items-center gap-1 text-amber-500 mt-1">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                  ))}
                </div>
              </div>
              <span
                className={`uppercase tracking-wider font-semibold text-[9px] px-2.5 py-1 rounded-full ${
                  r.status === "Approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                {r.status}
              </span>
            </div>

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
