# Razorpay Setup

PEHER uses Razorpay Standard Checkout. Cart pricing, Razorpay order creation,
signature verification, payment capture, and final order creation happen on the
Express backend.

## 1. Create test credentials

1. Open the Razorpay Dashboard in Test Mode.
2. Go to **Account & Settings > API Keys**.
3. Generate a test Key ID and Key Secret.
4. Add both values only to the backend host:

```env
RAZORPAY_KEY_ID=rzp_test_replace_me
RAZORPAY_KEY_SECRET=replace_me
```

The Key Secret must never be added to a `VITE_` variable, frontend environment,
browser code, Git, or Supabase.

## 2. Configure the backend

Set these backend environment variables:

```env
CLIENT_ORIGIN=https://your-store-domain.example
SUPABASE_URL=https://mxnlzkbhgddcftulwjer.supabase.co
SUPABASE_SECRET_KEY=your_server_secret_key
RAZORPAY_KEY_ID=rzp_test_replace_me
RAZORPAY_KEY_SECRET=replace_me
```

Restart or redeploy the backend after changing environment variables. The
frontend receives the public Key ID from `POST /api/payment/create-order`; no
frontend Razorpay environment variable is required.

## 3. Test checkout

1. Keep **Payments > Test mode** enabled in the PEHER admin panel.
2. Confirm the admin panel reports **Server credentials configured**.
3. Add a product to the cart and complete checkout with a Razorpay test payment.
4. Confirm the payment is Captured in Razorpay and the order appears in PEHER.
5. Confirm delivery is ₹99 below ₹1,500 and free at ₹1,500 or more.

The backend blocks checkout if a live key is used in test mode, a test key is
used in live mode, no payment method is enabled, or credentials are missing.

## 4. Go live

1. Complete Razorpay account activation and website verification.
2. Whitelist the production storefront domain in Razorpay.
3. Generate Live Mode keys.
4. Replace the backend credentials with the live keys.
5. Disable **Test mode** in the PEHER admin panel.
6. Keep automatic capture enabled in both PEHER and the Razorpay Dashboard.
7. Run one low-value live transaction and verify capture, order creation,
   notification delivery, and settlement.

Never fulfill an order based only on the browser callback. PEHER verifies the
HMAC signature, Razorpay order ownership, amount, and captured payment status on
the backend before creating the order.
