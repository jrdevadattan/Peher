import { useState } from "react";
import { AdminStore, type AdminCoupon } from "@/lib/admin-store";
import { Plus, Tag, Calendar, CheckCircle2, XCircle, Trash2 } from "lucide-react";

export function CouponsView() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>(AdminStore.coupons);
  const [newCode, setNewCode] = useState("");
  const [discountType, setDiscountType] = useState<"Percentage" | "Flat">("Percentage");
  const [value, setValue] = useState(10);
  const [minPurchase, setMinPurchase] = useState(1500);

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    const created: AdminCoupon = {
      id: `c-${Date.now()}`,
      code: newCode.toUpperCase().trim(),
      type: discountType,
      value,
      minPurchase,
      expiryDate: "2026-12-31",
      usageLimit: 500,
      usageCount: 0,
      status: "Active",
    };

    const updated = [created, ...coupons];
    setCoupons(updated);
    AdminStore.coupons = updated;
    setNewCode("");
  };

  const handleDelete = (id: string) => {
    const updated = coupons.filter((c) => c.id !== id);
    setCoupons(updated);
    AdminStore.coupons = updated;
  };

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight">Coupons & Discount Rules</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Create promotional codes, minimum spend triggers, and customer redemption limits.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleCreateCoupon} className="bg-card border border-border p-6 rounded-xl shadow-xs space-y-4">
        <h3 className="font-serif text-xl font-medium">Create New Promotional Code</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block uppercase tracking-wider text-[10px] text-muted-foreground mb-1 font-semibold">Coupon Code</label>
            <input
              type="text"
              required
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="e.g. FESTIVE20"
              className="w-full border border-border rounded-lg p-2.5 outline-none font-mono uppercase font-bold bg-transparent"
            />
          </div>

          <div>
            <label className="block uppercase tracking-wider text-[10px] text-muted-foreground mb-1 font-semibold">Discount Type</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as any)}
              className="w-full border border-border rounded-lg p-2.5 outline-none bg-transparent"
            >
              <option value="Percentage">Percentage (%)</option>
              <option value="Flat">Flat Amount (₹)</option>
            </select>
          </div>

          <div>
            <label className="block uppercase tracking-wider text-[10px] text-muted-foreground mb-1 font-semibold">Discount Value</label>
            <input
              type="number"
              required
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-full border border-border rounded-lg p-2.5 outline-none font-bold bg-transparent"
            />
          </div>

          <div>
            <label className="block uppercase tracking-wider text-[10px] text-muted-foreground mb-1 font-semibold">Min Purchase (₹)</label>
            <input
              type="number"
              required
              value={minPurchase}
              onChange={(e) => setMinPurchase(Number(e.target.value))}
              className="w-full border border-border rounded-lg p-2.5 outline-none bg-transparent"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#D8E7D2] hover:text-black transition">
            + Generate Coupon
          </button>
        </div>
      </form>

      {/* Coupons Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border uppercase text-[10px] text-muted-foreground tracking-wider">
            <tr>
              <th className="p-4">Code</th>
              <th className="p-4">Discount</th>
              <th className="p-4">Min Spend</th>
              <th className="p-4">Expiry</th>
              <th className="p-4">Redemptions</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td className="p-4 font-mono font-bold text-sm text-foreground">{c.code}</td>
                <td className="p-4 font-semibold">
                  {c.type === "Percentage" ? `${c.value}% OFF` : c.type === "Flat" ? `₹${c.value} OFF` : "Free Shipping"}
                </td>
                <td className="p-4">₹{c.minPurchase.toLocaleString("en-IN")}</td>
                <td className="p-4 text-muted-foreground">{c.expiryDate}</td>
                <td className="p-4 font-medium">{c.usageCount} / {c.usageLimit}</td>
                <td className="p-4">
                  <span className="bg-[#D8E7D2] text-black px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase">
                    {c.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-100 text-red-600 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
