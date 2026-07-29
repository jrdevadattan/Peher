# PEHER Google Sign-In Setup

PEHER uses Google Identity Services (GIS) for the visible Google account flow. Google issues the
ID token, and Supabase Auth validates that token, links or creates the PEHER account, and issues the
same Supabase session used by email/password users and protected backend APIs.

This design keeps one session system for password and Google users. Do not send a Google client
secret to the browser and do not replace the backend JWT checks with an unverified Google token.

## 1. Create the Google OAuth client

In Google Cloud Console, create an OAuth client with application type **Web application**.

Add these **Authorized JavaScript origins**:

```text
http://localhost:8080
http://127.0.0.1:8080
https://peher.studio
https://www.peher.studio
```

Only add `https://www.peher.studio` if that hostname serves or redirects into the application.
Add each Lovable or Cloudflare preview origin separately when Google sign-in must work on that
preview. Origins contain only scheme, hostname, and optional port. Do not add a path or trailing
slash.

Leave **Authorized redirect URIs** empty. PEHER uses the GIS popup callback flow, which returns the
credential to JavaScript rather than redirecting the browser to an application endpoint.

## 2. Configure the consent screen

Use the PEHER brand name and a monitored support email. Add `peher.studio` as an authorized domain.
The default `openid`, `email`, and `profile` scopes are enough for sign-in.

Before moving an external OAuth app to production, publish accurate homepage, privacy-policy, and
terms links on `peher.studio`. Google may require verification if additional sensitive scopes are
requested later.

## 3. Configure Supabase

Open Supabase Dashboard:

```text
Authentication > Providers > Google
```

Enable Google and enter the Google Web client ID and client secret. The client secret stays only in
Supabase. Even though the browser receives the Google ID token directly, the provider must be
enabled so Supabase can validate and exchange that token.

Set the Supabase Auth site URL to:

```text
https://peher.studio
```

Add local and production URLs to the Supabase redirect allow list. This flow does not currently use
the Supabase OAuth callback URL, but keeping the allow list accurate protects any future email or
OAuth redirect flows.

## 4. Configure application environments

Frontend runtime:

```text
VITE_GOOGLE_CLIENT_ID=<google-web-client-id>.apps.googleusercontent.com
```

Backend production CORS:

```text
CLIENT_ORIGIN=https://peher.studio,https://www.peher.studio
```

For a backend used by local development:

```text
CLIENT_ORIGIN=https://peher.studio,https://www.peher.studio,http://localhost:8080,http://127.0.0.1:8080
```

`CLIENT_ORIGIN` is an exact-origin allowlist. Never use `*` for authenticated APIs.

## 5. Verify

1. Open the login page from an authorized origin.
2. Confirm the Google button appears.
3. Sign in and verify navigation to the customer dashboard.
4. Confirm protected API requests carry a Supabase bearer token and return HTTP 200.
5. Confirm response headers include `Cross-Origin-Opener-Policy: same-origin-allow-popups`.
6. Test both production and local origins independently.

Common failures:

- `origin_mismatch`: The exact browser origin is missing in Google Cloud.
- Google button is absent: `VITE_GOOGLE_CLIENT_ID` is missing at frontend build/runtime.
- Provider error after choosing an account: Google is not enabled in Supabase or the client IDs do
  not match.
- Browser CORS error calling the PEHER API: The exact frontend origin is missing from the backend
  `CLIENT_ORIGIN` list.
- Blank or disconnected popup: The deployment is overriding the required COOP header.

## Security Notes

- The Google client ID is public and may be present in frontend configuration.
- The Google client secret, Supabase secret key, and Supabase management token are server-only.
- Google ID tokens must be validated for signature, issuer, expiry, and the expected audience.
- Supabase performs that validation in the current architecture and issues the application session.
- Rotate any management token that has been pasted into chat, logs, or source control.
