import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Percent, Save } from "lucide-react";
import { getStoreSettings, saveStoreSettings, type StoreSettings } from "@/lib/admin-api";
import { Skeleton } from "@/components/ui/skeleton";

export function TaxesView() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["admin", "store-settings"], queryFn: getStoreSettings });
  const [form, setForm] = useState<StoreSettings | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setForm(data); }, [data]);
  if (isLoading || !form) return <div className="space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-64 w-full" /></div>;
  return (
    <div className="space-y-6 fade-up">
      <div><h1 className="font-serif text-3xl md:text-4xl">Taxes</h1><p className="mt-1 text-xs text-muted-foreground">GST is calculated from trusted product and store rates during server-side checkout pricing.</p></div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">Tax settings could not be loaded.</p>}
      <section className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-xs">
        <h2 className="flex items-center gap-2 font-serif text-2xl"><Percent className="h-5 w-5" /> India GST configuration</h2>
        <label className="block max-w-sm text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Default GST rate (%)<input type="number" min="0" max="100" step="0.01" value={form.gstPercentage} onChange={(e) => setForm({ ...form, gstPercentage: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-border bg-transparent p-3 text-sm font-semibold text-foreground" /></label>
        <button type="button" onClick={() => setForm({ ...form, pricesIncludeTax: !form.pricesIncludeTax })} className="flex w-full items-center justify-between rounded-lg border border-border p-4 text-xs font-semibold"><span>Catalogue prices include GST</span><span className={`h-6 w-11 rounded-full p-1 ${form.pricesIncludeTax ? "bg-emerald-600" : "bg-neutral-300"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${form.pricesIncludeTax ? "translate-x-5" : ""}`} /></span></button>
        <p className="text-xs leading-relaxed text-muted-foreground">A product-specific tax rate takes precedence. The default rate applies when a product has no rate. Included tax is recorded as a breakdown without being added twice.</p>
      </section>
      <div className="flex justify-end"><button disabled={busy} onClick={async () => { setBusy(true); try { await saveStoreSettings(form); await queryClient.invalidateQueries({ queryKey: ["admin", "store-settings"] }); } finally { setBusy(false); } }} className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white"><Save className="h-4 w-4" /> Save tax rules</button></div>
    </div>
  );
}
