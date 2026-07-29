import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Save, ShieldCheck } from "lucide-react";
import { getPaymentSettings, savePaymentSettings, type PaymentSettings } from "@/lib/admin-api";
import { Skeleton } from "@/components/ui/skeleton";

export function PaymentsView() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["admin", "payments"], queryFn: getPaymentSettings });
  const [form, setForm] = useState<PaymentSettings | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setForm(data); }, [data]);
  if (isLoading || !form) return <div className="space-y-4"><Skeleton className="h-12 w-72" /><Skeleton className="h-72 w-full" /></div>;
  const toggle = (key: keyof PaymentSettings) => setForm({ ...form, [key]: !form[key] });
  const options: [keyof PaymentSettings, string][] = [
    ["isEnabled", "Online checkout enabled"],
    ["testMode", "Test mode"],
    ["allowCards", "Cards"],
    ["allowUpi", "UPI"],
    ["allowNetbanking", "Net banking"],
    ["allowWallets", "Wallets"],
    ["automaticCapture", "Automatic capture"],
  ];
  return (
    <div className="space-y-6 fade-up">
      <div><h1 className="font-serif text-3xl md:text-4xl">Payments</h1><p className="mt-1 text-xs text-muted-foreground">Razorpay controls stored in Supabase; credentials remain server-only.</p></div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">Payment configuration could not be loaded.</p>}
      <section className={`rounded-xl border p-5 ${form.credentialsConfigured ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/60"}`}>
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5" /><div><p className="text-sm font-semibold">{form.credentialsConfigured ? "Server credentials configured" : "Server credentials required"}</p><p className="mt-1 text-xs text-muted-foreground">{form.credentialsConfigured ? `Razorpay key ${form.keyHint}. Secret values are never exposed.` : "Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the backend environment before enabling live checkout."}</p></div></div>
      </section>
      <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <h2 className="flex items-center gap-2 font-serif text-2xl"><CreditCard className="h-5 w-5" /> Checkout methods</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {options.map(([key, label]) => <button key={key} type="button" onClick={() => toggle(key)} className="flex items-center justify-between rounded-lg border border-border p-4 text-left text-xs font-semibold"><span>{label}</span><span className={`h-6 w-11 rounded-full p-1 transition ${form[key] ? "bg-emerald-600" : "bg-neutral-300"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${form[key] ? "translate-x-5" : ""}`} /></span></button>)}
        </div>
      </section>
      <div className="flex justify-end"><button disabled={busy} onClick={async () => { setBusy(true); try { await savePaymentSettings(form); await queryClient.invalidateQueries({ queryKey: ["admin", "payments"] }); } finally { setBusy(false); } }} className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-40"><Save className="h-4 w-4" /> {busy ? "Saving..." : "Save payment settings"}</button></div>
    </div>
  );
}
