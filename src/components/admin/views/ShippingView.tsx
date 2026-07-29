import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2, Truck } from "lucide-react";
import {
  deleteShippingMethod,
  getShippingMethods,
  saveShippingMethod,
  type ShippingMethod,
} from "@/lib/admin-api";
import { AdminCardListSkeleton } from "@/components/loading-skeletons";

const blankMethod: ShippingMethod = {
  id: "",
  name: "Standard insured delivery",
  code: "standard",
  rate: 99,
  freeThreshold: 1500,
  estimatedDaysMin: 3,
  estimatedDaysMax: 7,
  isActive: true,
  sortOrder: 0,
};

export function ShippingView() {
  const queryClient = useQueryClient();
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin", "shipping"],
    queryFn: getShippingMethods,
  });
  const [drafts, setDrafts] = useState<Record<string, ShippingMethod>>({});
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState("");
  const methods = adding ? [...data, blankMethod] : data;

  const current = (method: ShippingMethod) => drafts[method.id || "new"] || method;
  const change = (method: ShippingMethod, changes: Partial<ShippingMethod>) => {
    const key = method.id || "new";
    setDrafts((value) => ({ ...value, [key]: { ...current(method), ...changes } }));
  };
  const save = async (method: ShippingMethod) => {
    const value = current(method);
    setBusy(method.id || "new");
    try {
      await saveShippingMethod(value);
      setDrafts({});
      setAdding(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "shipping"] });
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-6 fade-up">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl">Shipping</h1>
          <p className="mt-1 text-xs text-muted-foreground">Active rates and free-delivery thresholds are enforced during server pricing.</p>
        </div>
        <button onClick={() => setAdding(true)} disabled={adding} className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-40"><Plus className="h-4 w-4" /> Add method</button>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">Shipping methods could not be loaded.</p>}
      {isLoading ? <AdminCardListSkeleton count={3} /> : (
        <div className="grid gap-4">
          {methods.map((method) => {
            const value = current(method);
            return (
              <section key={method.id || "new"} className="rounded-xl border border-border bg-card p-5 shadow-xs">
                <div className="grid gap-4 md:grid-cols-6">
                  <Field label="Method"><input value={value.name} onChange={(e) => change(method, { name: e.target.value })} /></Field>
                  <Field label="Code"><input value={value.code} onChange={(e) => change(method, { code: e.target.value })} /></Field>
                  <Field label="Rate"><input type="number" min="0" value={value.rate} onChange={(e) => change(method, { rate: Number(e.target.value) })} /></Field>
                  <Field label="Free above"><input type="number" min="0" value={value.freeThreshold ?? ""} onChange={(e) => change(method, { freeThreshold: e.target.value ? Number(e.target.value) : null })} /></Field>
                  <Field label="Min days"><input type="number" min="0" value={value.estimatedDaysMin} onChange={(e) => change(method, { estimatedDaysMin: Number(e.target.value) })} /></Field>
                  <Field label="Max days"><input type="number" min="0" value={value.estimatedDaysMax} onChange={(e) => change(method, { estimatedDaysMax: Number(e.target.value) })} /></Field>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <button onClick={() => change(method, { isActive: !value.isActive })} className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase ${value.isActive ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
                    {value.isActive ? "Active at checkout" : "Disabled"}
                  </button>
                  <div className="flex gap-2">
                    {method.id && <button onClick={async () => { if (confirm(`Delete ${method.name}?`)) { await deleteShippingMethod(method.id); await queryClient.invalidateQueries({ queryKey: ["admin", "shipping"] }); } }} className="rounded-lg border border-red-200 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button>}
                    <button onClick={() => void save(method)} disabled={busy === (method.id || "new")} className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"><Save className="h-4 w-4" /> Save</button>
                  </div>
                </div>
              </section>
            );
          })}
          {!methods.length && <p className="rounded-xl border border-border p-10 text-center text-sm text-muted-foreground"><Truck className="mx-auto mb-3 h-7 w-7" />No shipping methods configured.</p>}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactElement<{ className?: string }> }) {
  return <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><span className="mb-1 block">{label}</span><div className="[&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-border [&_input]:bg-transparent [&_input]:p-2.5 [&_input]:text-xs [&_input]:text-foreground">{children}</div></label>;
}
