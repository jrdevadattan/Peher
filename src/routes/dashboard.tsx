import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

const API_URL = import.meta.env.VITE_API_URL;

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
      .finally(() => setOrdersLoading(false));
  }, [token]);

  if (loading || !user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome, {user.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <button
          onClick={logout}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          Log out
        </button>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-foreground">Your orders</h2>

      {ordersLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">You have not placed any orders yet.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="rounded-md border border-input p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Order #{order._id.slice(-6).toUpperCase()}
                </span>
                <span className="text-xs capitalize text-muted-foreground">{order.status}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <ul className="mt-3 space-y-1">
                {order.items.map((item, i) => (
                  <li key={i} className="text-sm text-foreground">
                    {item.name} x {item.qty}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-input pt-3">
                <span className="text-sm font-medium text-foreground">Total</span>
                <span className="text-sm font-semibold text-foreground">Rs {order.total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
