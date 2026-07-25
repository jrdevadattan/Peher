import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";

export const Route = createFileRoute("/checkout")({
  component: Checkout,
  head: () => ({ meta: [{ title: "Checkout — PEHER" }] }),
});

type AddressForm = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
};

const emptyForm: AddressForm = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
};

const API_BASE = "http://localhost:5000/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipping = 0;
  const total = subtotal + shipping;

  const update = (field: keyof AddressForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const isValid =
    form.fullName.trim().length > 1 &&
    /^[0-9]{10}$/.test(form.phone.trim()) &&
    form.addressLine1.trim().length > 3 &&
    form.city.trim().length > 1 &&
    form.state.trim().length > 1 &&
    /^[0-9]{6}$/.test(form.pincode.trim());

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setError(null);
    setSubmitting(true);

    try {
      // 1. Create a Razorpay order on the backend
      const orderRes = await fetch(`${API_BASE}/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total }),
      });
      if (!orderRes.ok) throw new Error("Could not initiate payment. Please try again.");
      const razorpayOrder = await orderRes.json();

      // 2. Open Razorpay Checkout popup
      const options = {
        key: "PASTE_YOUR_RAZORPAY_KEY_ID", // TODO: replace with your public Razorpay Key ID
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "PEHER",
        description: "Order Payment",
        order_id: razorpayOrder.id,
        prefill: {
          name: form.fullName,
          contact: form.phone,
        },
        theme: { color: "#111111" },
        handler: async (response: any) => {
          try {
            // 3. Verify payment signature on backend
            const verifyRes = await fetch(`${API_BASE}/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.verified) {
              // TODO: also POST to /api/orders here to save the order in MongoDB
              clearCart();
              navigate({ to: "/" });
            } else {
              setError("Payment verification failed. Please contact support.");
            }
          } catch {
            setError("Payment verification failed. Please contact support.");
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
        setSubmitting(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white">
        <Navbar />
        <div className="pt-40 pb-32 container-luxe text-center">
          <p className="font-serif text-2xl">Your bag is empty.</p>
          <Link to="/shop" className="mt-6 inline-block text-[11px] tracking-[0.22em] uppercase font-semibold underline underline-offset-4">
            Continue Shopping
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-white">
      <Navbar />
      <section className="pt-40 pb-10 container-luxe">
        <p className="eyebrow">Checkout</p>
        <h1 className="font-serif text-5xl md:text-7xl mt-4">Shipping Details</h1>
      </section>

      <form onSubmit={handlePlaceOrder} className="container-luxe pb-32 grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Address form */}
        <div className="lg:col-span-7">
          <p className="eyebrow !text-foreground mb-6 pb-2 border-b-2 border-[#D8E7D2] inline-block">Delivery Address</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Full Name" value={form.fullName} onChange={update("fullName")} full />
            <Field label="Phone Number" value={form.phone} onChange={update("phone")} placeholder="10-digit mobile number" full />
            <Field label="Address Line 1" value={form.addressLine1} onChange={update("addressLine1")} full colSpan2 />
            <Field label="Address Line 2 (optional)" value={form.addressLine2} onChange={update("addressLine2")} colSpan2 />
            <Field label="City" value={form.city} onChange={update("city")} />
            <Field label="State" value={form.state} onChange={update("state")} />
            <Field label="Pincode" value={form.pincode} onChange={update("pincode")} placeholder="6-digit PIN code" />
          </div>

          <div className="mt-10">
            <p className="eyebrow !text-foreground mb-4">Payment</p>
            <div className="border border-black/15 rounded-md p-6 flex items-center gap-4 bg-white">
              <div className="w-12 h-12 rounded-full bg-[#D8E7D2]/40 grid place-items-center shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="5" width="20" height="14" rx="2" stroke="#111" strokeWidth="1.5" />
                  <path d="M2 9H22" stroke="#111" strokeWidth="1.5" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Secure payment via Razorpay</p>
                <p className="text-xs text-muted-foreground mt-0.5">Cards, UPI, Netbanking & Wallets accepted</p>
              </div>
            </div>
            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>

        {/* Order summary */}
        <aside className="lg:col-span-5">
          <div className="bg-[#D8E7D2]/25 border border-[#D8E7D2] p-8 md:p-10 rounded-md">
            <h2 className="font-serif text-3xl">Order Summary</h2>
            <div className="mt-8 divide-y divide-black/10">
              {items.map((i) => (
                <div key={`${i.id}-${i.size}`} className="py-4 flex gap-4">
                  <div className="w-16 h-20 bg-white overflow-hidden shrink-0">
                    <img src={i.image} alt={i.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="font-serif text-base leading-tight">{i.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {i.size ? `Size ${i.size} · ` : ""}Qty {i.qty}
                    </p>
                  </div>
                  <p className="text-sm self-center">₹{(i.price * i.qty).toLocaleString("en-IN")}</p>
                </div>
              ))}
            </div>

            <dl className="mt-6 pt-6 border-t border-black/10 space-y-3 text-sm">
              <Row k="Subtotal" v={`₹${subtotal.toLocaleString("en-IN")}`} />
              <Row k="Shipping" v="Complimentary" />
            </dl>
            <div className="border-t border-black/10 mt-6 pt-6 flex items-center justify-between">
              <span className="eyebrow !text-foreground">Total</span>
              <span className="font-serif text-2xl">₹{total.toLocaleString("en-IN")}</span>
            </div>

            <button
              type="submit"
              disabled={!isValid || submitting}
              className="btn-peher w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#111] disabled:hover:text-white"
            >
              {submitting ? "Processing..." : "Place Order & Pay"}
            </button>
            {!isValid && (
              <p className="mt-3 text-xs text-muted-foreground text-center">
                Fill in all required fields to place your order.
              </p>
            )}
          </div>
          <div className="text-center mt-6">
            <Link to="/cart" className="text-[11px] tracking-[0.2em] uppercase border-b border-black pb-1">Back to Cart</Link>
          </div>
        </aside>
      </form>
      <Footer />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  full,
  colSpan2,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  full?: boolean;
  colSpan2?: boolean;
}) {
  return (
    <div className={colSpan2 ? "sm:col-span-2" : full ? "sm:col-span-2" : ""}>
      <label className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-2 w-full px-4 py-3 border border-black/15 bg-white text-sm outline-none focus:border-black transition"
      />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

