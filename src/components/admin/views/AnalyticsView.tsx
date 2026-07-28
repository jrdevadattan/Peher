import { useState } from "react";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

const analyticsSales = [
  { month: "Jan", revenue: 120000, orders: 42 },
  { month: "Feb", revenue: 145000, orders: 58 },
  { month: "Mar", revenue: 190000, orders: 74 },
  { month: "Apr", revenue: 165000, orders: 61 },
  { month: "May", revenue: 210000, orders: 85 },
  { month: "Jun", revenue: 245000, orders: 98 },
  { month: "Jul", revenue: 298000, orders: 114 },
];

const trafficSources = [
  { name: "Direct / Brand Search", value: 45, color: "#111111" },
  { name: "Instagram & Reels", value: 35, color: "#5b7a52" },
  { name: "Organic Search", value: 12, color: "#D8E7D2" },
  { name: "Referrals", value: 8, color: "#888888" },
];

const stateSales = [
  { state: "Maharashtra", sales: 88500 },
  { state: "Karnataka", sales: 74200 },
  { state: "Delhi NCR", sales: 69400 },
  { state: "Telangana", sales: 42100 },
  { state: "Tamil Nadu", sales: 31800 },
];

export function AnalyticsView() {
  return (
    <div className="space-y-8 fade-up">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight">Sales & Traffic Analytics</h1>
        <p className="text-xs text-muted-foreground mt-1">
          In-depth revenue trends, customer acquisition channels, conversion rates, and regional demand.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-card border border-border p-5 rounded-xl shadow-xs">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Average Order Value (AOV)</p>
          <p className="font-serif text-3xl font-bold mt-2">₹2,840</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">+14.2% vs last month</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl shadow-xs">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Conversion Rate</p>
          <p className="font-serif text-3xl font-bold mt-2">3.48%</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">+0.6% vs benchmark</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl shadow-xs">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Return Rate</p>
          <p className="font-serif text-3xl font-bold mt-2">0.42%</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">Ultra-low exchange volume</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-card border border-border p-6 rounded-xl shadow-xs">
          <h3 className="font-serif text-2xl mb-4">Monthly Revenue Trajectory (YTD)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsSales}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Gross Sales"]} />
                <Area type="monotone" dataKey="revenue" stroke="#111111" fill="#D8E7D2" fillOpacity={0.4} strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-card border border-border p-6 rounded-xl shadow-xs">
          <h3 className="font-serif text-2xl mb-4">Traffic Acquisition</h3>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={trafficSources} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                  {trafficSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v}%`, "Traffic Share"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 pt-2 border-t border-border text-xs">
            {trafficSources.map((t) => (
              <div key={t.name} className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.name}
                </span>
                <span className="font-semibold">{t.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
