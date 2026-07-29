import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminProducts, updateProductStock } from "@/lib/catalog-api";
import { Package, AlertTriangle, RefreshCw, Warehouse } from "lucide-react";
import { AdminTableRowsSkeleton } from "@/components/loading-skeletons";

export function InventoryView() {
  const queryClient = useQueryClient();
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: getAdminProducts,
  });
  const [busyId, setBusyId] = useState("");

  const handleAdjustStock = async (id: string, delta: number) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    setBusyId(id);
    try {
      await updateProductStock(product, delta);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
        queryClient.invalidateQueries({ queryKey: ["catalog"] }),
      ]);
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight">Real-Time Inventory & Warehouse</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Monitor stock levels across atelier vaults, supplier reorders, and stock movements.
        </p>
      </div>
      {error && <p className="text-xs text-red-600">Inventory could not be loaded.</p>}

      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border font-serif text-xl font-medium">Stock Matrix</div>
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border uppercase text-[10px] text-muted-foreground tracking-wider">
            <tr>
              <th className="p-4">Item</th>
              <th className="p-4">SKU</th>
              <th className="p-4">Supplier</th>
              <th className="p-4">Current Stock</th>
              <th className="p-4">Reorder Status</th>
              <th className="p-4 text-right">Adjust Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <AdminTableRowsSkeleton columns={6} rows={7} />
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                  No inventory items have been created.
                </td>
              </tr>
            ) : products.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="p-4 font-semibold">{p.name}</td>
                <td className="p-4 font-mono text-[11px]">{p.sku}</td>
                <td className="p-4">{p.supplier}</td>
                <td className="p-4 font-bold text-sm">{p.stock} units</td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider ${
                      p.stock > 10
                        ? "bg-emerald-100 text-emerald-800"
                        : p.stock > 0
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {p.stock > 10 ? "Optimal" : p.stock > 0 ? "Low Stock Alert" : "Out of Stock"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleAdjustStock(p.id, -5)}
                      disabled={busyId === p.id}
                      className="px-2.5 py-1 border border-border rounded hover:bg-neutral-200 font-bold"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => handleAdjustStock(p.id, 5)}
                      disabled={busyId === p.id}
                      className="px-2.5 py-1 border border-border rounded hover:bg-neutral-200 font-bold text-emerald-700"
                    >
                      +5
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
