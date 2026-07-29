import { describe, expect, it } from "bun:test";
import { createGoogleNonce, exchangeGoogleIdToken } from "./google-auth";

describe("Google ID token exchange", () => {
  it("passes the Google token and matching nonce to Supabase Auth", async () => {
    let received: unknown;
    const auth = {
      async signInWithIdToken(credentials: unknown) {
        received = credentials;
        return { error: null };
      },
    };

    await exchangeGoogleIdToken(auth, "google-id-token", "google-login-nonce");

    expect(received).toEqual({
      provider: "google",
      token: "google-id-token",
      nonce: "google-login-nonce",
    });
  });

  it("throws the Supabase Auth error", async () => {
    const authError = new Error("ID token rejected");
    const auth = {
      async signInWithIdToken() {
        return { error: authError };
      },
    };

    await expect(exchangeGoogleIdToken(auth, "token", "nonce")).rejects.toBe(authError);
  });

  it("generates unique raw nonces and SHA-256 hashes for Google", async () => {
    const first = await createGoogleNonce();
    const second = await createGoogleNonce();

    expect(first.nonce).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first.hashedNonce).toMatch(/^[a-f0-9]{64}$/);
    expect(second.nonce).not.toBe(first.nonce);
    expect(second.hashedNonce).not.toBe(first.hashedNonce);
  });
});
