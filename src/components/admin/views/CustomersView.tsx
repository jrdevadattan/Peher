import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminCustomers,
  updateCustomerStatus,
  type AdminCustomer,
} from "@/lib/admin-api";
import { Search, UserCheck, ShieldAlert, Download, X, ShoppingBag } from "lucide-react";
import { AdminTableRowsSkeleton } from "@/components/loading-skeletons";

export function CustomersView() {
  const queryClient = useQueryClient();
  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: getAdminCustomers,
  });
  const [query, setQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.email.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.toLowerCase().includes(query.toLowerCase())
  );

  const handleToggleStatus = async (id: string) => {
    const customer = customers.find((item) => item.id === id);
    if (!customer) return;
    await updateCustomerStatus(
      customer,
      customer.status === "Active" ? "Blocked" : "Active",
    );
    await queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
  };

  return (
    <div className="space-y-6 fade-up">
      {error && <p className="text-xs text-red-600">Customers could not be loaded.</p>}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl tracking-tight">Customer Directory</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Buyer accounts, spending history, engagement tags, and status management.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by customer name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-xs outline-none focus:border-black bg-transparent"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Location</th>
                <th className="p-4">Orders</th>
                <th className="p-4">Lifetime Spend</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <AdminTableRowsSkeleton columns={7} rows={7} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">
                    No customer accounts match this search.
                  </td>
                </tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition">
                  <td className="p-4 font-medium">
                    <p className="font-semibold text-xs text-foreground">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.email}</p>
                  </td>
                  <td className="p-4 font-mono text-[11px]">{c.phone}</td>
                  <td className="p-4">{c.address}</td>
                  <td className="p-4 font-semibold">{c.totalOrders} order(s)</td>
                  <td className="p-4 font-serif text-sm font-semibold">₹{c.totalSpent.toLocaleString("en-IN")}</td>
                  <td className="p-4">
                    <span
                      className={`uppercase tracking-wider font-semibold text-[9px] px-2.5 py-1 rounded-full ${
                        c.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="px-3 py-1.5 border border-border rounded-lg text-[11px] font-semibold uppercase tracking-wider hover:bg-neutral-900 hover:text-white transition"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => handleToggleStatus(c.id)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition ${
                          c.status === "Active"
                            ? "bg-red-50 text-red-700 hover:bg-red-600 hover:text-white"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                        }`}
                      >
                        {c.status === "Active" ? "Block" : "Unblock"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end overflow-y-auto">
          <div className="bg-card w-full max-w-md min-h-screen p-6 space-y-6 shadow-2xl border-l border-border overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Customer Profile</p>
                <h2 className="font-serif text-2xl font-bold mt-0.5">{selectedCustomer.name}</h2>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 rounded-full hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 border border-border rounded-xl space-y-2 bg-muted/20">
                <p><span className="text-muted-foreground">Email:</span> {selectedCustomer.email}</p>
                <p><span className="text-muted-foreground">Phone:</span> {selectedCustomer.phone}</p>
                <p><span className="text-muted-foreground">Location:</span> {selectedCustomer.address}</p>
                <p><span className="text-muted-foreground">Joined:</span> {selectedCustomer.registrationDate}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-border rounded-xl">
                  <p className="text-muted-foreground uppercase tracking-wider text-[10px]">Total Orders</p>
                  <p className="font-serif text-2xl font-bold mt-1">{selectedCustomer.totalOrders}</p>
                </div>
                <div className="p-4 border border-border rounded-xl">
                  <p className="text-muted-foreground uppercase tracking-wider text-[10px]">Lifetime Spend</p>
                  <p className="font-serif text-2xl font-bold mt-1">₹{selectedCustomer.totalSpent.toLocaleString("en-IN")}</p>
                </div>
              </div>

              <div className="border border-border rounded-xl p-4 space-y-2">
                <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Customer Tags</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.tags.map((t) => (
                    <span key={t} className="bg-[#D8E7D2] text-black px-2.5 py-1 rounded-full font-semibold text-[10px]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
