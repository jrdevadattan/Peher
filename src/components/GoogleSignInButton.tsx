import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useEffect, useRef, useState } from "react";
import { createGoogleNonce, type GoogleNonce } from "@/lib/google-auth";
import { useAuth } from "@/lib/auth-context";

type GoogleSignInButtonProps = {
  onAuthenticated: () => void;
  onError: (message: string) => void;
};

export function GoogleSignInButton({
  onAuthenticated,
  onError,
}: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth();
  const [noncePair, setNoncePair] = useState<GoogleNonce | null>(null);
  const mounted = useRef(true);

  const prepareNonce = async () => {
    const nextNonce = await createGoogleNonce();
    if (mounted.current) setNoncePair(nextNonce);
  };

  useEffect(() => {
    void prepareNonce();
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleSuccess = async (response: CredentialResponse) => {
    const currentNonce = noncePair;
    setNoncePair(null);
    if (!response.credential || !currentNonce) {
      onError("Google did not return a valid sign-in response. Please try again.");
      await prepareNonce();
      return;
    }

    try {
      await loginWithGoogle(response.credential, currentNonce.nonce);
      onAuthenticated();
    } catch {
      onError("Google sign-in could not be completed. Please try again.");
      await prepareNonce();
    }
  };

  if (!noncePair) {
    return (
      <div
        className="h-10 w-56 animate-pulse rounded border border-input bg-muted"
        aria-label="Preparing Google sign-in"
      />
    );
  }

  return (
    <GoogleLogin
      nonce={noncePair.hashedNonce}
      use_fedcm_for_button
      onSuccess={handleSuccess}
      onError={() => {
        onError("Google sign-in failed. Please try again.");
        setNoncePair(null);
        void prepareNonce();
      }}
    />
  );
}
