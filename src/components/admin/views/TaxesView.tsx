import { useQuery } from "@tanstack/react-query";
import { BadgeIndianRupee, CircleCheck } from "lucide-react";
import { getStoreSettings } from "@/lib/admin-api";
import { Skeleton } from "@/components/ui/skeleton";

export function TaxesView() {
  const { data, isLoading, error } = useQuery({ queryKey: ["admin", "store-settings"], queryFn: getStoreSettings });
  if (isLoading || !data) return <div className="space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-64 w-full" /></div>;
  return (
    <div className="space-y-6 fade-up">
      <div><h1 className="font-serif text-3xl md:text-4xl">Taxes</h1><p className="mt-1 text-xs text-muted-foreground">PEHER prices are final. Checkout does not calculate or add a separate tax amount.</p></div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">Tax settings could not be loaded.</p>}
      <section className="space-y-5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-xs">
        <h2 className="flex items-center gap-2 font-serif text-2xl"><BadgeIndianRupee className="h-5 w-5" /> No tax added at checkout</h2>
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-white/70 p-4">
          <CircleCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
          <div><p className="text-sm font-semibold">Server-enforced zero tax</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Product tax rates and the store default are set to 0%. The payment total contains only products, delivery and valid discounts.</p></div>
        </div>
      </section>
    </div>
  );
}
