import { useState } from "react";
import { AdminStore } from "@/lib/admin-store";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const revenueData = [
  { date: "Jul 21", revenue: 14200, orders: 4 },
  { date: "Jul 22", revenue: 18500, orders: 6 },
  { date: "Jul 23", revenue: 12100, orders: 3 },
  { date: "Jul 24", revenue: 24800, orders: 8 },
  { date: "Jul 25", revenue: 31000, orders: 11 },
  { date: "Jul 26", revenue: 22400, orders: 7 },
  { date: "Jul 27", revenue: 29500, orders: 9 },
  { date: "Jul 28", revenue: 36200, orders: 12 },
];

const categoryShare = [
  { name: "Rings", sales: 48500 },
  { name: "Necklaces", sales: 39200 },
  { name: "Bracelets", sales: 26100 },
  { name: "Earrings", sales: 31800 },
];

export function OverviewView({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "ytd">("7d");
  const products = AdminStore.products;
  const orders = AdminStore.orders;
  const customers = AdminStore.customers;

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter((o) => o.deliveryStatus === "Pending" || o.deliveryStatus === "Confirmed").length;
  const completedOrders = orders.filter((o) => o.deliveryStatus === "Delivered").length;
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= 10);
  const outOfStockProducts = products.filter((p) => p.stock === 0 || p.outOfStock);

  return (
    <div className="space-[#1a1a1a] space-y-8 fade-up">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-neutral-900 via-neutral-800 to-black p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D8E7D2]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs tracking-[0.2em] text-[#D8E7D2] uppercase font-semibold">
              <Sparkles className="w-4 h-4 text-[#D8E7D2]" /> PEHER Executive Suite
            </div>
            <h1 className="font-serif text-3xl md:text-5xl mt-2 tracking-tight">Atelier Dashboard</h1>
            <p className="mt-2 text-sm text-neutral-300 max-w-xl">
              Real-time performance metrics, orders lifecycle, and inventory intelligence for PEHER Luxury Jewellery.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur border border-white/15 rounded-lg p-1.5 flex gap-1 text-xs font-medium">
              {(["7d", "30d", "ytd"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1.5 rounded-md uppercase tracking-wider transition ${
                    timeframe === t ? "bg-white text-black font-semibold shadow-xs" : "text-white/70 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={() => onNavigate("orders")}
              className="bg-[#D8E7D2] text-black px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-[0.16em] hover:bg-white transition"
            >
              View Orders
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title="Total Revenue"
          value={`₹${totalSales.toLocaleString("en-IN")}`}
          change="+18.4%"
          isPositive={true}
          icon={DollarSign}
          subtext="vs previous period"
        />
        <KPICard
          title="Total Orders"
          value={orders.length.toString()}
          change="+12.2%"
          isPositive={true}
          icon={ShoppingBag}
          subtext={`${pendingOrders} pending delivery`}
        />
        <KPICard
          title="Total Customers"
          value={customers.length.toString()}
          change="+8.5%"
          isPositive={true}
          icon={Users}
          subtext="Active buyer profiles"
        />
        <KPICard
          title="Inventory Items"
          value={products.length.toString()}
          change={`${lowStockProducts.length} low stock`}
          isPositive={lowStockProducts.length === 0}
          icon={Package}
          subtext={`${outOfStockProducts.length} out of stock`}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Line/Area Chart */}
        <div className="lg:col-span-8 bg-card border border-border rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-2xl">Revenue & Sales Performance</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Daily gross revenue over time</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-3 rounded-full bg-neutral-900 inline-block" /> Revenue (₹)
              </span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111111" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#111111" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#888" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#888" }} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Revenue"]}
                  contentStyle={{ backgroundColor: "#111", color: "#fff", borderRadius: "8px", border: "none", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#111111" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="lg:col-span-4 bg-card border border-border rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-2xl">Sales by Category</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Revenue distribution</p>
          </div>
          <div className="h-[240px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryShare} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#333" }} />
                <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Sales"]} />
                <Bar dataKey="sales" fill="#D8E7D2" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Top Category</span>
            <span className="font-semibold">Rings (₹48,500)</span>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Orders & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 bg-card border border-border rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-2xl">Recent Atelier Orders</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Latest customer transactions</p>
            </div>
            <button onClick={() => onNavigate("orders")} className="text-xs font-semibold uppercase tracking-wider underline">
              View All Orders
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3">Order ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="hover:bg-muted/40 transition">
                    <td className="py-3.5 font-semibold text-xs">{o.orderNumber}</td>
                    <td className="py-3.5">
                      <p className="font-medium text-xs">{o.customerName}</p>
                      <p className="text-[10px] text-muted-foreground">{o.customerEmail}</p>
                    </td>
                    <td className="py-3.5 text-xs">{o.items.length} item(s)</td>
                    <td className="py-3.5 font-serif text-sm font-semibold">₹{o.total.toLocaleString("en-IN")}</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-neutral-100 rounded text-neutral-800">
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 bg-[#D8E7D2] rounded-full text-black">
                        {o.deliveryStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts & Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Stock Watchlist
              </h3>
              <button onClick={() => onNavigate("inventory")} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                Inventory
              </button>
            </div>
            <div className="space-y-3">
              {lowStockProducts.length === 0 ? (
                <p className="text-xs text-muted-foreground">All items have healthy stock levels.</p>
              ) : (
                lowStockProducts.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-9 h-11 object-cover rounded" />
                      <div>
                        <p className="font-medium text-foreground">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">SKU: {p.sku}</p>
                      </div>
                    </div>
                    <span className="font-bold text-amber-700 bg-amber-200/80 px-2 py-1 rounded-md">
                      {p.stock} left
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
            <h3 className="font-serif text-xl mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                onClick={() => onNavigate("products")}
                className="p-3 border border-border rounded-lg text-left hover:bg-neutral-900 hover:text-white transition font-medium"
              >
                + Add Product
              </button>
              <button
                onClick={() => onNavigate("coupons")}
                className="p-3 border border-border rounded-lg text-left hover:bg-neutral-900 hover:text-white transition font-medium"
              >
                + Create Coupon
              </button>
              <button
                onClick={() => onNavigate("analytics")}
                className="p-3 border border-border rounded-lg text-left hover:bg-neutral-900 hover:text-white transition font-medium"
              >
                📊 Export Reports
              </button>
              <button
                onClick={() => onNavigate("settings")}
                className="p-3 border border-border rounded-lg text-left hover:bg-neutral-900 hover:text-white transition font-medium"
              >
                ⚙️ Store Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  subtext,
}: {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: any;
  subtext: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-xs transition hover:border-black/30">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 grid place-items-center">
          <Icon className="w-4 h-4 text-foreground" strokeWidth={1.75} />
        </div>
      </div>
      <div className="mt-3">
        <p className="font-serif text-3xl font-semibold">{value}</p>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-0.5 font-medium ${isPositive ? "text-emerald-600" : "text-amber-600"}`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {change}
          </span>
          <span className="text-muted-foreground text-[11px]">{subtext}</span>
        </div>
      </div>
    </div>
  );
}
