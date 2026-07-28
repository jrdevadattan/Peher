import { useState } from "react";
import { AdminStore, type AdminOrder } from "@/lib/admin-store";
import {
  Search,
  Printer,
  FileText,
  Truck,
  CheckCircle2,
  XCircle,
  X,
  Package,
  Calendar,
  User,
  CreditCard,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";

export function OrdersView() {
  const [orders, setOrders] = useState<AdminOrder[]>(AdminStore.orders);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const filtered = orders.filter((o) => {
    const matchesTab = activeTab === "All" || o.deliveryStatus === activeTab;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
      o.customerName.toLowerCase().includes(query.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(query.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleUpdateStatus = (orderId: string, newStatus: AdminOrder["deliveryStatus"]) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        const newTimeline = [
          ...o.timeline,
          { title: `Status updated to ${newStatus}`, timestamp: new Date().toISOString() },
        ];
        return { ...o, deliveryStatus: newStatus, timeline: newTimeline };
      }
      return o;
    });
    setOrders(updated);
    AdminStore.orders = updated;
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(updated.find((o) => o.id === orderId) || null);
    }
  };

  const statusOptions = ["All", "Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled", "Refunded"];

  return (
    <div className="space-y-6 fade-up">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl tracking-tight">Order Management</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track customer orders, manage fulfillment workflows, and print invoices.
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {statusOptions.map((status) => {
            const count = status === "All" ? orders.length : orders.filter((o) => o.deliveryStatus === status).length;
            return (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition ${
                  activeTab === status
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {status} <span className="ml-1 opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order #, customer name, or email..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-xs outline-none focus:border-black bg-transparent"
          />
        </div>
      </div>

      {/* Order Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4">Order ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Total</th>
                <th className="p-4">Fulfillment</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/30 transition">
                    <td className="p-4 font-bold text-xs font-mono">{o.orderNumber}</td>
                    <td className="p-4 text-muted-foreground text-[11px]">
                      {new Date(o.orderDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-foreground text-xs">{o.customerName}</p>
                      <p className="text-[10px] text-muted-foreground">{o.customerEmail}</p>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-semibold tracking-wider ${
                          o.paymentStatus === "Paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : o.paymentStatus === "Failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 font-serif text-sm font-semibold">₹{o.total.toLocaleString("en-IN")}</td>
                    <td className="p-4">
                      <span className="uppercase tracking-wider font-semibold text-[9px] px-2.5 py-1 bg-[#D8E7D2] rounded-full text-black">
                        {o.deliveryStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="px-3 py-1.5 border border-border rounded-lg text-[11px] font-semibold uppercase tracking-wider hover:bg-neutral-900 hover:text-white transition"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end overflow-y-auto">
          <div className="bg-card w-full max-w-2xl min-h-screen p-6 md:p-8 space-y-6 shadow-2xl border-l border-border overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Order Details</p>
                <h2 className="font-serif text-3xl font-bold mt-0.5">{selectedOrder.orderNumber}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="p-2 rounded-lg border border-border hover:bg-muted text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Invoice
                </button>
                <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-full hover:bg-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Status Workflow Action Buttons */}
            <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fulfillment Actions</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {(["Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                    disabled={selectedOrder.deliveryStatus === st}
                    className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider transition ${
                      selectedOrder.deliveryStatus === st
                        ? "bg-neutral-900 text-white opacity-60 cursor-not-allowed"
                        : "border border-border hover:bg-neutral-900 hover:text-white"
                    }`}
                  >
                    Mark {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer & Shipping Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 border border-border rounded-xl space-y-2">
                <p className="font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-foreground" /> Customer Info
                </p>
                <p className="font-bold text-sm">{selectedOrder.customerName}</p>
                <p>{selectedOrder.customerEmail}</p>
                <p>{selectedOrder.customerPhone}</p>
              </div>

              <div className="p-4 border border-border rounded-xl space-y-2">
                <p className="font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-foreground" /> Shipping Address
                </p>
                <p className="leading-relaxed">{selectedOrder.shippingAddress}</p>
                {selectedOrder.trackingNumber && (
                  <p className="pt-1 font-mono font-medium text-emerald-700">
                    Tracking: {selectedOrder.trackingNumber} ({selectedOrder.courierName})
                  </p>
                )}
              </div>
            </div>

            {/* Items List */}
            <div className="border border-border rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order Items</p>
              <div className="divide-y divide-border">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-12 h-14 object-cover rounded bg-muted" />
                      <div>
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.size ? `Size: ${item.size} · ` : ""}Qty: {item.qty}
                        </p>
                      </div>
                    </div>
                    <p className="font-serif text-sm font-semibold">₹{(item.price * item.qty).toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 space-y-1.5 text-xs text-right">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (3% GST)</span>
                  <span>₹{selectedOrder.taxAmount.toLocaleString("en-IN")}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount Coupon</span>
                    <span>-₹{selectedOrder.discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between font-serif text-lg font-bold text-foreground border-t border-border pt-2">
                  <span>Total Paid</span>
                  <span>₹{selectedOrder.total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="border border-border rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-foreground" /> Order Audit Timeline
              </p>
              <div className="space-y-3 pl-2 border-l-2 border-border">
                {selectedOrder.timeline.map((event, idx) => (
                  <div key={idx} className="relative pl-4 text-xs">
                    <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-neutral-900" />
                    <p className="font-semibold text-foreground">{event.title}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {showInvoiceModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white text-black w-full max-w-2xl rounded-xl p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowInvoiceModal(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100">
              <X className="w-5 h-5 text-black" />
            </button>

            <div className="border-b border-black/10 pb-6 flex justify-between items-start">
              <div>
                <h1 className="font-serif text-3xl tracking-[0.3em]">PEHER</h1>
                <p className="text-[9px] tracking-[0.28em] text-neutral-500 mt-0.5">BY VASUDHA TIWARI</p>
                <p className="text-xs mt-3 text-neutral-600">Studio 04, Mehrauli, New Delhi 110030</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold font-serif">INVOICE</p>
                <p className="text-xs font-mono text-neutral-600">{selectedOrder.orderNumber}</p>
                <p className="text-xs text-neutral-500 mt-1">{new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <p className="font-bold text-neutral-500 uppercase tracking-wider mb-1">Billed To</p>
                <p className="font-semibold text-sm">{selectedOrder.customerName}</p>
                <p>{selectedOrder.customerEmail}</p>
                <p>{selectedOrder.customerPhone}</p>
              </div>
              <div>
                <p className="font-bold text-neutral-500 uppercase tracking-wider mb-1">Shipping Address</p>
                <p>{selectedOrder.shippingAddress}</p>
              </div>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-y border-black/20 text-neutral-600">
                  <th className="py-2">Item</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {selectedOrder.items.map((it, i) => (
                  <tr key={i}>
                    <td className="py-3 font-semibold">{it.name}</td>
                    <td className="py-3">{it.qty}</td>
                    <td className="py-3 text-right">₹{(it.price * it.qty).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-black/20 pt-4 text-xs space-y-1 text-right">
              <p>Subtotal: ₹{selectedOrder.subtotal.toLocaleString("en-IN")}</p>
              <p>Tax: ₹{selectedOrder.taxAmount.toLocaleString("en-IN")}</p>
              <p className="font-bold text-base font-serif border-t border-black/10 pt-2">
                Total: ₹{selectedOrder.total.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="pt-6 text-center text-[10px] text-neutral-500 uppercase tracking-widest border-t border-black/10">
              Thank you for shopping with PEHER · Extra is our love language.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="bg-black text-white px-5 py-2 rounded text-xs font-semibold uppercase tracking-wider"
              >
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
