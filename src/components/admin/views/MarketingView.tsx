import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import {
  getMarketingDashboard,
  queueMarketingCampaign,
  updateMarketingCampaign,
} from "@/lib/admin-api";
import { Skeleton } from "@/components/ui/skeleton";

export function MarketingView() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "marketing"],
    queryFn: getMarketingDashboard,
  });
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [queuedAudience, setQueuedAudience] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");

  const handleQueue = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!subject.trim() || !content.trim()) return;
    setBusy(true);
    try {
      const audience = await queueMarketingCampaign(subject.trim(), content.trim());
      setQueuedAudience(audience);
      setSubject("");
      setContent("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "marketing"] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 fade-up">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          Marketing data could not be loaded from Supabase.
        </p>
      )}
      <div>
        <h1 className="font-serif text-3xl tracking-tight md:text-4xl">
          Marketing Campaigns
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Consent-based audience totals and campaign history stored in Supabase.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Metric
          loading={isLoading}
          title="Newsletter Subscribers"
          value={(data?.subscriberCount ?? 0).toLocaleString("en-IN")}
          caption="Profiles with marketing opt-in"
        />
        <Metric
          loading={isLoading}
          title="Queued Campaigns"
          value={(data?.campaigns.filter((campaign) => campaign.status === "Queued").length ?? 0).toString()}
          caption="Awaiting a delivery worker"
        />
        <Metric
          loading={isLoading}
          title="Campaign History"
          value={(data?.campaigns.length ?? 0).toString()}
          caption="Latest records in Supabase"
        />
      </div>

      <form
        onSubmit={handleQueue}
        className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-xs"
      >
        <h3 className="font-serif text-2xl">Queue Email Campaign</h3>
        <p className="text-xs text-muted-foreground">
          This creates a campaign record for the opted-in audience. Delivery requires an email worker.
        </p>
        {!data?.deliveryConfigured && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Email delivery is not configured. Campaigns can be prepared and queued, but cannot be sent until a server delivery worker and provider key are configured.
          </p>
        )}
        <input
          required
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="Campaign subject"
          className="w-full rounded-lg border border-border bg-transparent p-3 text-xs outline-none focus:border-black"
        />
        <textarea
          rows={5}
          required
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Campaign announcement"
          className="w-full resize-none rounded-lg border border-border bg-transparent p-3 font-serif text-sm outline-none focus:border-black"
        />
        {queuedAudience !== null && (
          <div className="rounded-lg bg-emerald-100 p-3 text-xs font-semibold text-emerald-800">
            Campaign queued in Supabase for {queuedAudience.toLocaleString("en-IN")} opted-in subscribers.
          </div>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#D8E7D2] hover:text-black disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> {busy ? "Queuing..." : "Queue Campaign"}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b border-border p-4">
          <span className="font-serif text-xl">Recent Campaigns</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-border bg-transparent px-3 py-2 text-xs">
            <option>All</option><option>Queued</option><option>Cancelled</option><option>Sent</option>
          </select>
        </div>
        {isLoading ? (
          <div className="space-y-4 p-5">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : data?.campaigns.length ? (
          <div className="divide-y divide-border">
            {data.campaigns
              .filter((campaign) => statusFilter === "All" || campaign.status === statusFilter)
              .map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between gap-4 p-4 text-xs">
                <div>
                  <p className="font-semibold">{campaign.subject}</p>
                  <p className="mt-1 text-muted-foreground">
                    {new Date(campaign.createdAt).toLocaleString("en-IN")} · {campaign.audienceCount} recipients
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#D8E7D2] px-2.5 py-1 text-[9px] font-semibold uppercase">{campaign.status}</span>
                  {campaign.status === "Queued" && <button onClick={async () => { await updateMarketingCampaign(campaign.id, "Cancelled"); await queryClient.invalidateQueries({ queryKey: ["admin", "marketing"] }); }} className="text-[10px] font-semibold uppercase text-red-600">Cancel</button>}
                  {campaign.status === "Cancelled" && <button onClick={async () => { await updateMarketingCampaign(campaign.id, "Queued"); await queryClient.invalidateQueries({ queryKey: ["admin", "marketing"] }); }} className="text-[10px] font-semibold uppercase text-emerald-700">Requeue</button>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-8 text-center text-xs text-muted-foreground">
            No campaigns have been created.
          </p>
        )}
      </div>
    </div>
  );
}

function Metric({
  loading,
  title,
  value,
  caption,
}: {
  loading: boolean;
  title: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
      {loading ? <Skeleton className="mt-3 h-9 w-24" /> : <p className="mt-2 font-serif text-3xl font-bold">{value}</p>}
      <p className="mt-1 text-xs text-emerald-700">{caption}</p>
    </div>
  );
}
