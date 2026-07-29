# Vercel Deployment

PEHER is configured to deploy the TanStack Start storefront and the Express API from the same Vercel project.

## Build Settings

Vercel should use the repository defaults from `vercel.json`:

```text
Install Command: npm install
Build Command: npm run build
```

The app uses Nitro's `vercel` preset outside Lovable builds. API requests use same-origin `/api` in production, so `VITE_API_URL` should usually be left empty on Vercel.

## Required Vercel Environment Variables

Add these in Vercel Project Settings > Environment Variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_GOOGLE_CLIENT_ID
SUPABASE_URL
SUPABASE_SECRET_KEY
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
CLIENT_ORIGIN
INDEXNOW_KEY
RESEND_API_KEY
```

`SUPABASE_SECRET_KEY` must be a server secret key or legacy service-role JWT. If the variable is already named `SUPABASE_SERVICE_ROLE_KEY` in Vercel, the backend accepts that too. Do not use the publishable or anon key for this value.

Set `CLIENT_ORIGIN` to every browser origin that should call the API, for example:

```text
https://peher.studio,https://www.peher.studio,https://your-project.vercel.app
```

Vercel preview domains ending in `.vercel.app` are allowed by the API CORS guard for preview testing.

## Google Auth

In Google Cloud Console, add these for the OAuth web client:

```text
Authorized JavaScript origins:
https://peher.studio
https://www.peher.studio
https://your-project.vercel.app

Authorized redirect URIs:
https://mxnlzkbhgddcftulwjer.supabase.co/auth/v1/callback
```

Google sign-in still uses Supabase Auth as the identity backend. The frontend uses the Google client ID, then exchanges the ID token with Supabase.

## Razorpay

Keep Razorpay secrets server-only in Vercel. Do not create `VITE_RAZORPAY_*` variables.

Use test keys while `payment_settings.test_mode` is enabled. Switch to live keys only when the admin payment settings are also switched to live mode.

## Supabase Redirect URLs

In Supabase Auth URL configuration, include:

```text
https://peher.studio
https://www.peher.studio
https://your-project.vercel.app
```

Also keep local URLs if you want local login testing:

```text
http://localhost:8080
http://localhost:5173
```
