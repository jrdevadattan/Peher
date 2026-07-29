import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Store, Truck } from "lucide-react";
import { getStoreSettings, saveStoreSettings, type StoreSettings } from "@/lib/admin-api";
import { Skeleton } from "@/components/ui/skeleton";
import { HomepageBannersEditor } from "@/components/admin/HomepageBannersEditor";

export function SettingsView() {
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

  const update = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
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

  if (isLoading || !form) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-52 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-up">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          Store settings could not be loaded from Supabase.
        </p>
      )}
      <div>
        <h1 className="font-serif text-3xl tracking-tight md:text-4xl">System & Store Settings</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Persisted brand, tax, shipping, and storefront controls.
        </p>
      </div>

      <HomepageBannersEditor />

      <form onSubmit={handleSave} className="space-y-6">
        <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-xs">
          <h3 className="flex items-center gap-2 font-serif text-2xl">
            <Store className="h-5 w-5" /> Brand Identity & Contact
          </h3>
          <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
            <Field
              label="Store Name"
              value={form.storeName}
              onChange={(value) => update("storeName", value)}
            />
            <Field
              label="Tagline"
              value={form.tagline}
              onChange={(value) => update("tagline", value)}
            />
            <Field
              label="Support Email"
              type="email"
              value={form.contactEmail}
              onChange={(value) => update("contactEmail", value)}
            />
            <Field
              label="Currency Code"
              value={form.currencyCode}
              onChange={(value) => update("currencyCode", value.toUpperCase())}
            />
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-xs">
          <h3 className="flex items-center gap-2 font-serif text-2xl">
            <Truck className="h-5 w-5" /> Tax & Shipping Rules
          </h3>
          <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
            <NumberField
              label="GST Rate (%)"
              value={form.gstPercentage}
              onChange={(value) => update("gstPercentage", value)}
            />
            <NumberField
              label="Free Shipping Order Minimum"
              value={form.freeShippingThreshold}
              onChange={(value) => update("freeShippingThreshold", value)}
            />
            <NumberField
              label="Standard Shipping Rate"
              value={form.standardShippingRate}
              onChange={(value) => update("standardShippingRate", value)}
            />
          </div>
        </section>

        <section className="flex items-center justify-between rounded-xl border border-border bg-card p-6 shadow-xs">
          <div>
            <h3 className="font-serif text-xl">Store Maintenance Mode</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              This state is stored in Supabase for storefront enforcement.
            </p>
          </div>
          <button
            type="button"
            onClick={() => update("maintenanceMode", !form.maintenanceMode)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
              form.maintenanceMode
                ? "bg-amber-600 text-white"
                : "border border-border hover:bg-neutral-100"
            }`}
          >
            {form.maintenanceMode ? "Maintenance Active" : "Store Online"}
          </button>
        </section>

        {saved && (
          <p className="rounded-lg bg-emerald-100 p-3 text-xs font-semibold text-emerald-800">
            Store settings saved to Supabase.
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#D8E7D2] hover:text-black disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {busy ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label>
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-transparent p-2.5 outline-none focus:border-black"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        required
        min={0}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-lg border border-border bg-transparent p-2.5 font-bold outline-none focus:border-black"
      />
    </label>
  );
}
