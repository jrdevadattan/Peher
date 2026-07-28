import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type Order = {
  _id: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "My Account — PEHER" }] }),
});

function DashboardPage() {
  const { user, token, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/orders/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [token]);

  if (loading || !user) return null;

  return (
    <div className="bg-white min-h-screen flex flex-col justify-between">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 pt-40 pb-24 w-full flex-1">
        <div className="flex items-center justify-between border-b border-black/10 pb-6">
          <div>
            <p className="eyebrow">My Account</p>
            <h1 className="font-serif text-3xl md:text-5xl mt-2 tracking-tight">
              Welcome, {user.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-md border border-black/20 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] hover:bg-black hover:text-white transition-colors"
          >
            Log out
          </button>
        </div>

        <h2 className="mt-10 font-serif text-2xl">Order History</h2>

        {ordersLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading orders...</p>
        ) : orders.length === 0 ? (
          <div className="mt-6 p-8 border border-black/10 text-center rounded-sm bg-[#f9f9f7]">
            <p className="font-serif text-lg text-muted-foreground">You have not placed any orders yet.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="rounded-md border border-black/10 p-6 bg-white shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold tracking-wide">
                    Order #{order._id.slice(-6).toUpperCase()}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wider px-2.5 py-1 bg-[#D8E7D2] rounded-full text-black">
                    {order.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <ul className="mt-4 space-y-2 divide-y divide-black/5">
                  {order.items.map((item, i) => (
                    <li key={i} className="pt-2 text-sm flex justify-between">
                      <span>{item.name} × {item.qty}</span>
                      <span className="font-medium">₹{(item.price * item.qty).toLocaleString("en-IN")}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="font-serif text-lg font-semibold">₹{order.total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
