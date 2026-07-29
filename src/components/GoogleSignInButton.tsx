import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

type GoogleSignInButtonProps = {
  onError: (message: string) => void;
};

export function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleClick = async () => {
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch {
      setSubmitting(false);
      onError("Google sign-in could not be started. Please try again.");
    }
  };

  return (
    <button
      type="button"
      disabled={submitting}
      onClick={() => void handleClick()}
      className="inline-flex h-10 items-center justify-center gap-3 rounded-md border border-[#4285f4] bg-white px-4 text-sm font-medium text-[#1f1f1f] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.8 3.2 14.6 2.2 12 2.2A9.8 9.8 0 0 0 2.2 12 9.8 9.8 0 0 0 12 21.8c5.7 0 9.5-4 9.5-9.6 0-.6-.1-1.1-.1-1.6H12Z"
        />
        <path
          fill="#34A853"
          d="M2.2 7.5 5.4 9.8C6.3 7.2 8.9 5.3 12 5.3c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.8 3.2 14.6 2.2 12 2.2c-3.8 0-7.2 2.2-8.8 5.3Z"
        />
        <path
          fill="#FBBC05"
          d="M12 21.8c2.5 0 4.7-.8 6.2-2.2l-3-2.5c-.8.6-1.9 1-3.2 1-3.9 0-5.2-2.6-5.5-3.9l-3.1 2.4c1.6 3.2 4.9 5.2 8.6 5.2Z"
        />
        <path
          fill="#4285F4"
          d="M21.5 12.2c0-.6-.1-1.1-.1-1.6H12v3.9h5.5c-.3 1.4-1.1 2.5-2.2 3.2l3 2.5c1.8-1.7 3.2-4.1 3.2-8Z"
        />
      </svg>
      <span>{submitting ? "Redirecting..." : "Sign in with Google"}</span>
    </button>
  );
}
