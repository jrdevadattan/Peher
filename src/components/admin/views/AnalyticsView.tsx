import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAnalyticsReport } from "@/lib/admin-api";
import { AdminOverviewSkeleton } from "@/components/loading-skeletons";

function dateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function AnalyticsView() {
  const [range, setRange] = useState("12m");
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - (range === "30d" ? 1 : range === "90d" ? 3 : 12));
  const filters = { from: dateInput(start), to: dateInput(today) };
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "analytics", filters],
    queryFn: () => getAnalyticsReport(filters),
  });

  if (isLoading || !data) return <AdminOverviewSkeleton />;

  return (
    <div className="space-y-8 fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight md:text-4xl">Sales Analytics</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Server-computed performance from live Supabase orders.
          </p>
        </div>
        <select
          value={range}
          onChange={(event) => setRange(event.target.value)}
          className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold"
        >
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="12m">Last 12 months</option>
        </select>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">Analytics could not be loaded.</p>}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Gross revenue" value={`₹${Math.round(data.summary.grossRevenue).toLocaleString("en-IN")}`} />
        <Metric title="Net revenue" value={`₹${Math.round(data.summary.netRevenue).toLocaleString("en-IN")}`} />
        <Metric title="Orders" value={data.summary.orderCount.toLocaleString("en-IN")} />
        <Metric title="Average order" value={`₹${Math.round(data.summary.averageOrderValue).toLocaleString("en-IN")}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-border bg-card p-6 shadow-xs lg:col-span-8">
          <h2 className="mb-5 font-serif text-2xl">Revenue trend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.series}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]} />
                <Area dataKey="revenue" stroke="#111" fill="#D8E7D2" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-xl border border-border bg-card p-6 shadow-xs lg:col-span-4">
          <h2 className="mb-5 font-serif text-2xl">Sales by region</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.regions} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="region" type="category" width={85} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => [`₹${Number(value).toLocaleString("en-IN")}`, "Sales"]} />
                <Bar dataKey="sales" fill="#D8E7D2" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <h2 className="border-b border-border p-5 font-serif text-2xl">Top products</h2>
        <div className="divide-y divide-border">
          {data.topProducts.map((product) => (
            <div key={product.productId} className="grid grid-cols-[1fr_auto_auto] gap-6 p-4 text-xs">
              <span className="font-semibold">{product.name}</span>
              <span>{product.units} units</span>
              <span className="font-semibold">₹{Math.round(product.revenue).toLocaleString("en-IN")}</span>
            </div>
          ))}
          {!data.topProducts.length && <p className="p-8 text-center text-xs text-muted-foreground">No sales in this period.</p>}
        </div>
      </section>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
      <p className="mt-2 font-serif text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-emerald-700">Live Supabase data</p>
    </div>
  );
}
