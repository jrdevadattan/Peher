import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getStoreSettings,
  saveStoreSettings,
  type StoreSettings,
} from "@/lib/admin-api";
import { Skeleton } from "@/components/ui/skeleton";

export function SeoView() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "store-settings"],
    queryFn: getStoreSettings,
  });
  const [form, setForm] = useState<StoreSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || !form) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const handleSave = async () => {
    setBusy(true);
    setSaved(false);
    try {
      await saveStoreSettings(form);
      await queryClient.invalidateQueries({ queryKey: ["admin", "store-settings"] });
      setSaved(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 fade-up">
      {error && <p className="text-xs text-red-600">SEO settings could not be loaded.</p>}
      <div>
        <h1 className="font-serif text-3xl tracking-tight md:text-4xl">
          SEO & Search Indexing
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Global search metadata persisted in Supabase store settings.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-xs">
        <h3 className="font-serif text-2xl">Global Search Metadata</h3>
        <label className="block text-xs">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Global SEO Title
          </span>
          <input
            value={form.metaTitle}
            onChange={(event) => setForm({ ...form, metaTitle: event.target.value })}
            className="w-full rounded-lg border border-border bg-transparent p-2.5 font-serif text-sm outline-none"
          />
        </label>
        <label className="block text-xs">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Global Meta Description
          </span>
          <textarea
            rows={3}
            value={form.metaDescription}
            onChange={(event) => setForm({ ...form, metaDescription: event.target.value })}
            className="w-full resize-none rounded-lg border border-border bg-transparent p-2.5 outline-none"
          />
        </label>
        <label className="block text-xs">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Public Site URL
          </span>
          <input
            type="url"
            value={form.publicSiteUrl}
            onChange={(event) => setForm({ ...form, publicSiteUrl: event.target.value })}
            className="w-full rounded-lg border border-border bg-transparent p-2.5 outline-none"
          />
        </label>

        <div className="space-y-1 rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">
            Search Result Preview
          </p>
          <p className="text-sm font-medium text-blue-700">{form.metaTitle}</p>
          <p className="text-[11px] text-emerald-700">{form.publicSiteUrl}</p>
          <p className="text-xs text-foreground/80">{form.metaDescription}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <a
            href={`${form.publicSiteUrl.replace(/\/+$/, "")}/sitemap.xml`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-border p-4 transition hover:bg-muted/30"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Google Search Console
            </p>
            <p className="mt-2 font-serif text-lg">Dynamic sitemap</p>
            <p className="mt-1 break-all text-[11px] text-blue-700">
              {form.publicSiteUrl.replace(/\/+$/, "")}/sitemap.xml
            </p>
          </a>
          <a
            href={`${form.publicSiteUrl.replace(/\/+$/, "")}/merchant-feed.xml`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-border p-4 transition hover:bg-muted/30"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Google Merchant Center
            </p>
            <p className="mt-2 font-serif text-lg">RSS product feed</p>
            <p className="mt-1 break-all text-[11px] text-blue-700">
              {form.publicSiteUrl.replace(/\/+$/, "")}/merchant-feed.xml
            </p>
          </a>
        </div>

        <div className="rounded-lg border border-[#D8E7D2] bg-[#D8E7D2]/20 p-4 text-xs leading-relaxed">
          Product metadata, live price, stock, shipping, MPN/GTIN, and approved customer
          reviews are generated from Supabase. Add only real identifiers in Product Catalogue
          and approve only genuine reviews.
        </div>

        {saved && <p className="text-xs font-semibold text-emerald-600">SEO settings saved to Supabase.</p>}
        <div className="flex justify-end">
          <button
            onClick={() => void handleSave()}
            disabled={busy}
            className="rounded-lg bg-neutral-900 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#D8E7D2] hover:text-black disabled:opacity-50"
          >
            {busy ? "Saving..." : "Save Meta Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
