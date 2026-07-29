import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { getAnalyticsReport } from "@/lib/admin-api";
import { AdminTableRowsSkeleton } from "@/components/loading-skeletons";

const today = new Date().toISOString().slice(0, 10);
const initialFrom = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

export function SalesReportsView() {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(today);
  const [deliveryStatus, setDeliveryStatus] = useState("All");
  const [paymentStatus, setPaymentStatus] = useState("All");
  const filters = { from, to, deliveryStatus, paymentStatus };
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "sales-report", filters],
    queryFn: () => getAnalyticsReport(filters),
  });

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ["Order", "Date", "Customer", "Payment", "Delivery", "Subtotal", "Shipping", "Tax", "Discount", "Total"],
      ...data.orders.map((order) => [
        order.order_number,
        order.created_at,
        order.customer_email,
        order.payment_status,
        order.delivery_status,
        order.subtotal,
        order.shipping_cost,
        order.tax_amount,
        order.discount_amount,
        order.total,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `peher-sales-${from}-${to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl">Sales Reports</h1>
          <p className="mt-1 text-xs text-muted-foreground">Filter server-side order data and export the exact result.</p>
        </div>
        <button onClick={exportCsv} disabled={!data?.orders.length} className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-40">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
        <Filter label="From"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" /></Filter>
        <Filter label="To"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" /></Filter>
        <Filter label="Delivery"><select value={deliveryStatus} onChange={(e) => setDeliveryStatus(e.target.value)} className="input"><option>All</option>{["Pending","Confirmed","Packed","Shipped","Delivered","Cancelled","Refunded"].map((v) => <option key={v}>{v}</option>)}</select></Filter>
        <Filter label="Payment"><select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="input"><option>All</option>{["Paid","Pending","Refunded","Failed"].map((v) => <option key={v}>{v}</option>)}</select></Filter>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">Report could not be loaded.</p>}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider"><tr><th className="p-4">Order</th><th>Date</th><th>Customer</th><th>Payment</th><th>Delivery</th><th className="pr-4 text-right">Total</th></tr></thead>
          <tbody className="divide-y divide-border">
            {isLoading ? <AdminTableRowsSkeleton columns={6} rows={7} /> : data?.orders.map((order) => (
              <tr key={order.id}><td className="p-4 font-semibold">{order.order_number}</td><td>{new Date(order.created_at).toLocaleDateString("en-IN")}</td><td>{order.customer_email}</td><td>{order.payment_status}</td><td>{order.delivery_status}</td><td className="pr-4 text-right font-semibold">₹{Number(order.total).toLocaleString("en-IN")}</td></tr>
            ))}
          </tbody>
        </table>
        {!isLoading && !data?.orders.length && <p className="p-10 text-center text-sm text-muted-foreground">No orders match these filters.</p>}
      </div>
    </div>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><span className="mb-1 block">{label}</span>{children}</label>;
}
