import { useState } from "react";
import { Mail, ShoppingCart, Send, Gift, Users } from "lucide-react";

export function MarketingView() {
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
    setBroadcastMessage("");
  };

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight">Marketing & Customer Campaigns</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Abandoned cart recovery, newsletter broadcasts, VIP loyalty perks, and promotional drops.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-card border border-border p-5 rounded-xl shadow-xs">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Abandoned Carts (24h)</p>
          <p className="font-serif text-3xl font-bold mt-2">14 Carts</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">Auto-reminder emails active</p>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl shadow-xs">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Newsletter Subscribers</p>
          <p className="font-serif text-3xl font-bold mt-2">3,420</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">+120 new this week</p>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl shadow-xs">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Referral Conversions</p>
          <p className="font-serif text-3xl font-bold mt-2">₹42,800</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">15% discount for advocate</p>
        </div>
      </div>

      {/* Broadcast Email Campaign Box */}
      <form onSubmit={handleBroadcast} className="bg-card border border-border p-6 rounded-xl shadow-xs space-y-4">
        <h3 className="font-serif text-2xl">Broadcast Email Drop</h3>
        <p className="text-xs text-muted-foreground">Send an atelier newsletter announcement to all subscribers.</p>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Subject & Announcement Content
          </label>
          <textarea
            rows={4}
            required
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            placeholder="e.g. Introducing MASTANI · New Heritage Launch is now live..."
            className="w-full border border-border rounded-lg p-3 text-xs outline-none focus:border-black bg-transparent resize-none font-serif"
          />
        </div>

        {sentSuccess && (
          <div className="p-3 bg-emerald-100 text-emerald-800 text-xs rounded-lg font-semibold">
            ✓ Broadcast queued! Email dispatch initialized for 3,420 subscribers.
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#D8E7D2] hover:text-black transition"
          >
            <Send className="w-4 h-4" /> Send Campaign
          </button>
        </div>
      </form>
    </div>
  );
}
