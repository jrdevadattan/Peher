import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { apiUrl } from "@/lib/server-api";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/checkout")({
  component: Checkout,
  head: () => ({ meta: [{ title: "Checkout - PEHER" }] }),
});

const REQUIRE_LOGIN_FOR_CHECKOUT = true;

type AddressForm = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
};

type CheckoutPricing = {
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  coupon: {
    id: string;
    code: string;
    type: string;
    value: number;
  } | null;
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

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  retry: { enabled: boolean };
  config: {
    display: {
      hide: { method: string }[];
      preferences: { show_default_blocks: boolean };
    };
  };
  handler: (response: RazorpayResponse) => Promise<void>;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      on: (event: string, callback: () => void) => void;
      open: () => void;
    };
  }
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [pricing, setPricing] = useState<CheckoutPricing | null>(null);
  const displayedSubtotal = pricing?.subtotal ?? subtotal;
  const displayedTotal = pricing?.total ?? subtotal;

  useEffect(() => {
    setCouponCode(sessionStorage.getItem("peher-coupon-code") || "");
  }, []);

  useEffect(() => {
    setCouponMessage(null);
    if (!items.length) {
      setPricing(null);
      return;
    }
    const controller = new AbortController();
    fetch(apiUrl("/catalog/pricing"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({ id: item.id, size: item.size, qty: item.qty })),
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body?.error || "Could not calculate pricing.");
        setPricing(body);
      })
      .catch((pricingError) => {
        if (pricingError.name !== "AbortError") setPricing(null);
      });
    return () => controller.abort();
  }, [items]);

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

  const saveOrder = async (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) => {
    const orderItems = items.map((i) => ({
      id: i.id,
      size: i.size,
      qty: i.qty,
    }));

    const res = await fetch(apiUrl("/orders"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        items: orderItems,
        address: form,
        couponCode: pricing?.coupon?.code || couponCode,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      }),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(
        body?.error || "Payment succeeded but saving your order failed. Please contact support.",
      );
    }
    return body;
  };

  const verifyPayment = async (response: RazorpayResponse) => {
    const res = await fetch(apiUrl("/verify-payment"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(response),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.verified) {
      throw new Error(body?.error || "Payment verification failed. Please contact support.");
    }
  };

  const cartPayload = items.map((item) => ({
    id: item.id,
    size: item.size,
    qty: item.qty,
  }));

  const handleApplyCoupon = async () => {
    if (!token) return;
    setCouponBusy(true);
    setCouponMessage(null);
    try {
      const response = await fetch(apiUrl("/coupons/validate"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: couponCode, items: cartPayload }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "This coupon could not be applied.");
      setPricing(body);
      setCouponCode(body.coupon.code);
      sessionStorage.setItem("peher-coupon-code", body.coupon.code);
      setCouponMessage(`${body.coupon.code} applied.`);
    } catch (couponError: unknown) {
      setPricing(null);
      sessionStorage.removeItem("peher-coupon-code");
      setCouponMessage(errorMessage(couponError, "This coupon could not be applied."));
    } finally {
      setCouponBusy(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setError(null);
    setSubmitting(true);

    try {
      const orderRes = await fetch(apiUrl("/create-order"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: cartPayload,
          couponCode: pricing?.coupon?.code || couponCode,
        }),
      });
      const razorpayOrder = await orderRes.json().catch(() => null);
      if (!orderRes.ok) {
        throw new Error(razorpayOrder?.error || "Could not initiate payment. Please try again.");
      }
      if (!window.Razorpay) {
        throw new Error("Secure payment checkout could not load. Please refresh and try again.");
      }
      setPricing(razorpayOrder.pricing);
      const razorpayOrderId = razorpayOrder.order_id || razorpayOrder.id;
      const razorpayKeyId = razorpayOrder.checkout?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayOrderId || !razorpayKeyId) {
        throw new Error("Secure payment checkout is not configured. Please try again later.");
      }

      const options: RazorpayOptions = {
        key: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "PEHER",
        description: "Order Payment",
        order_id: razorpayOrderId,
        prefill: {
          name: form.fullName,
          email: user?.email || "",
          contact: form.phone,
        },
        theme: { color: "#111111" },
        retry: { enabled: true },
        config: razorpayOrder.checkout.config,
        handler: async (response: RazorpayResponse) => {
          try {
            await verifyPayment(response);
            await saveOrder(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
            );
            clearCart();
            sessionStorage.removeItem("peher-coupon-code");
            navigate({ to: "/dashboard" });
          } catch (err: unknown) {
            setError(
              errorMessage(err, "Something went wrong saving your order. Please contact support."),
            );
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
    } catch (err: unknown) {
      setError(errorMessage(err, "Something went wrong. Please try again."));
      setSubmitting(false);
    }
  };

  const goToAuth = (path: "/login" | "/signup") => {
    sessionStorage.setItem("post-login-redirect", "/checkout");
    navigate({ to: path });
  };

  if (items.length === 0) {
    return (
      <div className="bg-white">
        <Navbar />
        <div className="pt-40 pb-32 container-luxe text-center">
          <p className="font-serif text-2xl">Your bag is empty.</p>
          <Link
            to="/shop"
            className="mt-6 inline-block text-[11px] tracking-[0.22em] uppercase font-semibold underline underline-offset-4"
          >
            Continue Shopping
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (REQUIRE_LOGIN_FOR_CHECKOUT && authLoading) {
    return (
      <div className="bg-white">
        <Navbar />
        <main className="container-luxe grid gap-10 pb-32 pt-40 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-7">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-72" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-xl lg:col-span-5" />
        </main>
        <Footer />
      </div>
    );
  }

  if (REQUIRE_LOGIN_FOR_CHECKOUT && !user) {
    return (
      <div className="bg-white">
        <Navbar />
        <div className="pt-40 pb-32 container-luxe text-center">
          <p className="eyebrow">Checkout</p>
          <h1 className="font-serif text-4xl md:text-6xl mt-4">Sign in to place your order</h1>
          <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto">
            Create an account or log in so we can save your order details and let you track them
            anytime from your dashboard.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <button onClick={() => goToAuth("/login")} className="btn-peher">
              Log in
            </button>
            <button
              onClick={() => goToAuth("/signup")}
              className="px-6 py-3 border border-black text-[11px] tracking-[0.2em] uppercase font-semibold hover:bg-black hover:text-white transition"
            >
              Sign up
            </button>
          </div>
          <div className="mt-8">
            <Link
              to="/cart"
              className="text-[11px] tracking-[0.2em] uppercase border-b border-black pb-1"
            >
              Back to Cart
            </Link>
          </div>
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

      <form
        onSubmit={handlePlaceOrder}
        className="container-luxe pb-32 grid grid-cols-1 lg:grid-cols-12 gap-16"
      >
        <div className="lg:col-span-7">
          <p className="eyebrow !text-foreground mb-6 pb-2 border-b-2 border-[#D8E7D2] inline-block">
            Delivery Address
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Full Name" value={form.fullName} onChange={update("fullName")} full />
            <Field
              label="Phone Number"
              value={form.phone}
              onChange={update("phone")}
              placeholder="10-digit mobile number"
              full
            />
            <Field
              label="Address Line 1"
              value={form.addressLine1}
              onChange={update("addressLine1")}
              full
              colSpan2
            />
            <Field
              label="Address Line 2 (optional)"
              value={form.addressLine2}
              onChange={update("addressLine2")}
              colSpan2
            />
            <Field label="City" value={form.city} onChange={update("city")} />
            <Field label="State" value={form.state} onChange={update("state")} />
            <Field
              label="Pincode"
              value={form.pincode}
              onChange={update("pincode")}
              placeholder="6-digit PIN code"
            />
          </div>

          <div className="mt-10">
            <p className="eyebrow !text-foreground mb-4">Payment</p>
            <div className="border border-black/15 rounded-md p-6 flex items-center gap-4 bg-white">
              <div className="w-12 h-12 rounded-full bg-[#D8E7D2]/40 grid place-items-center shrink-0">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" stroke="#111" strokeWidth="1.5" />
                  <path d="M2 9H22" stroke="#111" strokeWidth="1.5" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Secure payment via Razorpay</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cards, UPI, Netbanking & Wallets accepted
                </p>
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </div>
        </div>

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
                      {i.size ? `Size ${i.size} - ` : ""}Qty {i.qty}
                    </p>
                  </div>
                  <p className="text-sm self-center">
                    ₹{(i.price * i.qty).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <label
                htmlFor="checkout-coupon"
                className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              >
                Coupon code
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="checkout-coupon"
                  value={couponCode}
                  onChange={(event) => {
                    setCouponCode(event.target.value.toUpperCase());
                    setPricing(null);
                    setCouponMessage(null);
                  }}
                  maxLength={32}
                  autoComplete="off"
                  placeholder="Enter code"
                  className="min-w-0 flex-1 border border-black/15 bg-white px-4 py-3 text-sm uppercase outline-none focus:border-black"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponBusy || couponCode.trim().length < 3}
                  className="border border-black bg-black px-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {couponBusy ? "Checking" : "Apply"}
                </button>
              </div>
              {couponMessage && (
                <p
                  className={`mt-2 text-xs ${
                    pricing?.coupon ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {couponMessage}
                </p>
              )}
            </div>

            <dl className="mt-6 pt-6 border-t border-black/10 space-y-3 text-sm">
              <Row k="Subtotal" v={`₹${displayedSubtotal.toLocaleString("en-IN")}`} />
              <Row
                k="Delivery (free from ₹1,500)"
                v={
                  pricing
                    ? pricing.shippingCost
                      ? `₹${pricing.shippingCost.toLocaleString("en-IN")}`
                      : "Complimentary"
                    : "Calculating..."
                }
              />
              {pricing && pricing.discountAmount > 0 && (
                <Row
                  k={`Discount${pricing.coupon ? ` (${pricing.coupon.code})` : ""}`}
                  v={`-₹${pricing.discountAmount.toLocaleString("en-IN")}`}
                />
              )}
            </dl>
            <div className="border-t border-black/10 mt-6 pt-6 flex items-center justify-between">
              <span className="eyebrow !text-foreground">Total</span>
              <span className="font-serif text-2xl">₹{displayedTotal.toLocaleString("en-IN")}</span>
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
        </aside>
      </form>
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
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-black/20 px-3 py-2.5 text-sm focus:outline-none focus:border-black"
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
