type GoogleIdTokenCredentials = {
  provider: "google";
  token: string;
  nonce: string;
};

type GoogleIdTokenAuth = {
  signInWithIdToken(
    credentials: GoogleIdTokenCredentials,
  ): Promise<{ error: unknown | null }>;
};

export type GoogleNonce = {
  nonce: string;
  hashedNonce: string;
};

export async function createGoogleNonce(): Promise<GoogleNonce> {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = btoa(String.fromCharCode(...randomBytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
  const encodedNonce = new TextEncoder().encode(nonce);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedNonce);
  const hashedNonce = Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return { nonce, hashedNonce };
}

export async function exchangeGoogleIdToken(
  auth: GoogleIdTokenAuth,
  credential: string,
  nonce: string,
) {
  const { error } = await auth.signInWithIdToken({
    provider: "google",
    token: credential,
    nonce,
  });
  if (error) throw error;
}
