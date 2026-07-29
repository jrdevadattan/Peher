import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { deleteCoupon, getAdminCoupons, saveCoupon, type AdminCoupon } from "@/lib/admin-api";
import { AdminTableRowsSkeleton } from "@/components/loading-skeletons";

const newCoupon = (): AdminCoupon => ({
  id: "",
  code: "",
  type: "Percentage",
  value: 10,
  minPurchase: 1500,
  expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  usageLimit: 500,
  usageCount: 0,
  maxRedemptionsPerCustomer: 1,
  maxDiscountAmount: 0,
  status: "Active",
});

export function CouponsView() {
  const queryClient = useQueryClient();
  const {
    data: coupons = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: getAdminCoupons,
  });
  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setMessage("");
    try {
      await saveCoupon(editing);
      await refresh();
      setMessage(editing.id ? "Coupon updated." : "Coupon created and ready for checkout.");
      setEditing(null);
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Coupon could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (coupon: AdminCoupon) => {
    if (!window.confirm(`Delete or disable coupon ${coupon.code}?`)) return;
    setBusy(true);
    setMessage("");
    try {
      await deleteCoupon(coupon);
      await refresh();
      setMessage("Coupon removed. Redeemed coupons are disabled to preserve order history.");
    } catch (deleteError) {
      setMessage(
        deleteError instanceof Error ? deleteError.message : "Coupon could not be removed.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-serif text-3xl tracking-tight md:text-4xl">
            Coupons & Discount Rules
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Server-validated promotions with global and per-customer redemption limits.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(newCoupon())}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#D8E7D2] hover:text-black"
        >
          <Plus className="h-4 w-4" /> New Coupon
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          Coupons could not be loaded from the secure API.
        </p>
      )}
      {message && (
        <p className="rounded-lg border border-border bg-neutral-50 p-3 text-xs" aria-live="polite">
          {message}
        </p>
      )}

      {editing && (
        <form
          onSubmit={handleSave}
          className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">
              {editing.id ? `Edit ${editing.code}` : "Create Promotional Code"}
            </h2>
            <button
              type="button"
              aria-label="Close coupon editor"
              onClick={() => setEditing(null)}
              className="rounded-lg border border-border p-2 hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2 xl:grid-cols-4">
            <CouponField
              label="Coupon Code"
              value={editing.code}
              required
              onChange={(code) =>
                setEditing({ ...editing, code: code.toUpperCase().replace(/\s+/g, "") })
              }
            />
            <label>
              <CouponLabel>Discount Type</CouponLabel>
              <select
                value={editing.type}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    type: event.target.value as AdminCoupon["type"],
                    value: event.target.value === "FreeShipping" ? 0 : editing.value || 10,
                  })
                }
                className="w-full rounded-lg border border-border bg-transparent p-2.5 outline-none"
              >
                <option value="Percentage">Percentage</option>
                <option value="Flat">Flat amount</option>
                <option value="FreeShipping">Free shipping</option>
              </select>
            </label>
            <CouponNumber
              label={editing.type === "Percentage" ? "Discount Percent" : "Discount Amount"}
              value={editing.value}
              min={editing.type === "FreeShipping" ? 0 : 1}
              max={editing.type === "Percentage" ? 100 : undefined}
              disabled={editing.type === "FreeShipping"}
              onChange={(value) => setEditing({ ...editing, value })}
            />
            <CouponNumber
              label="Minimum Purchase"
              value={editing.minPurchase}
              min={0}
              onChange={(minPurchase) => setEditing({ ...editing, minPurchase })}
            />
            <label>
              <CouponLabel>Expiry Date</CouponLabel>
              <input
                type="date"
                required
                value={editing.expiryDate}
                onChange={(event) => setEditing({ ...editing, expiryDate: event.target.value })}
                className="w-full rounded-lg border border-border bg-transparent p-2.5 outline-none"
              />
            </label>
            <CouponNumber
              label="Global Redemption Limit"
              value={editing.usageLimit}
              min={1}
              onChange={(usageLimit) => setEditing({ ...editing, usageLimit })}
            />
            <CouponNumber
              label="Uses Per Customer"
              value={editing.maxRedemptionsPerCustomer}
              min={1}
              onChange={(maxRedemptionsPerCustomer) =>
                setEditing({ ...editing, maxRedemptionsPerCustomer })
              }
            />
            {editing.type === "Percentage" && (
              <CouponNumber
                label="Maximum Discount (0 = none)"
                value={editing.maxDiscountAmount}
                min={0}
                onChange={(maxDiscountAmount) => setEditing({ ...editing, maxDiscountAmount })}
              />
            )}
            <label>
              <CouponLabel>Status</CouponLabel>
              <select
                value={editing.status}
                onChange={(event) =>
                  setEditing({ ...editing, status: event.target.value as AdminCoupon["status"] })
                }
                className="w-full rounded-lg border border-border bg-transparent p-2.5 outline-none"
              >
                <option value="Active">Active</option>
                <option value="Disabled">Disabled</option>
                <option value="Expired">Expired</option>
              </select>
            </label>
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50"
            >
              <Tag className="h-4 w-4" /> {busy ? "Saving..." : "Save Coupon"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4">Code</th>
              <th className="p-4">Discount</th>
              <th className="hidden p-4 md:table-cell">Minimum</th>
              <th className="hidden p-4 lg:table-cell">Expiry</th>
              <th className="p-4">Uses</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <AdminTableRowsSkeleton columns={7} rows={5} />
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-sm text-muted-foreground">
                  No coupon rules have been created.
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-muted/30">
                  <td className="p-4 font-mono text-sm font-bold">{coupon.code}</td>
                  <td className="p-4 font-semibold">
                    {coupon.type === "Percentage"
                      ? `${coupon.value}% off`
                      : coupon.type === "Flat"
                        ? `₹${coupon.value.toLocaleString("en-IN")} off`
                        : "Free shipping"}
                  </td>
                  <td className="hidden p-4 md:table-cell">
                    ₹{coupon.minPurchase.toLocaleString("en-IN")}
                  </td>
                  <td className="hidden p-4 text-muted-foreground lg:table-cell">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> {coupon.expiryDate || "No expiry"}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold">
                      {coupon.usageCount} / {coupon.usageLimit || "∞"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {coupon.maxRedemptionsPerCustomer} per customer
                    </p>
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase ${
                        coupon.status === "Active"
                          ? "bg-[#D8E7D2] text-black"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {coupon.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        aria-label={`Edit ${coupon.code}`}
                        onClick={() => setEditing(coupon)}
                        className="rounded-lg border border-border p-2 hover:bg-neutral-100"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${coupon.code}`}
                        disabled={busy}
                        onClick={() => void handleDelete(coupon)}
                        className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CouponLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}

function CouponField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label>
      <CouponLabel>{label}</CouponLabel>
      <input
        type="text"
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-transparent p-2.5 font-mono font-bold uppercase outline-none"
      />
    </label>
  );
}

function CouponNumber({
  label,
  value,
  onChange,
  min,
  max,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <label>
      <CouponLabel>{label}</CouponLabel>
      <input
        type="number"
        required
        min={min}
        max={max}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-lg border border-border bg-transparent p-2.5 font-semibold outline-none disabled:bg-neutral-100 disabled:text-neutral-400"
      />
    </label>
  );
}
