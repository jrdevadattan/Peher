import { useState } from "react";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { Eye, EyeOff, Lock, Mail, ShieldAlert, Sparkles, X } from "lucide-react";
import { PeherLogo } from "@/components/PeherLogo";

export function AdminLogin() {
  const { login, requestPasswordReset, lockoutRemainingSeconds } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password, rememberMe);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D8E7D2]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#5b7a52]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-neutral-900/90 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-2xl shadow-2xl space-y-8 relative z-10 fade-up">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.3em] uppercase text-[#D8E7D2] font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> PEHER Atelier Portal
          </div>
          <PeherLogo tone="light" className="mx-auto h-12 w-52" />
          <p className="text-[9px] tracking-[0.3em] text-neutral-400 mt-1 uppercase">
            Executive Administration
          </p>
        </div>

        {/* Lockout Warning Banner */}
        {lockoutRemainingSeconds > 0 && (
          <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Security Rate Limit Active</p>
              <p className="text-[11px] opacity-90">
                Account locked. Please try again in {lockoutRemainingSeconds}s.
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@peher.studio"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-neutral-600 outline-none focus:border-[#D8E7D2] transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] text-[#D8E7D2] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-neutral-600 outline-none focus:border-[#D8E7D2] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-neutral-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-black focus:ring-0"
              />
              <span>Remember Me</span>
            </label>
            <span className="text-[10px] text-neutral-500">Protected by Supabase Auth</span>
          </div>

          <button
            type="submit"
            disabled={loading || lockoutRemainingSeconds > 0}
            className="w-full py-3.5 bg-white text-black font-semibold text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-[#D8E7D2] transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? "Authenticating..." : "Sign In to Admin Console"}
          </button>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 p-6 rounded-2xl max-w-sm w-full space-y-4 relative text-white">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-2xl">Reset Administrator Password</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Enter your registered PEHER admin email to receive a secure password recovery token
              link.
            </p>
            {forgotSent ? (
              <p className="text-xs text-emerald-400 font-semibold p-3 bg-emerald-500/10 rounded-lg">
                Password reset instructions sent to {email}.
              </p>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);
                  try {
                    await requestPasswordReset(email);
                    setForgotSent(true);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Could not send reset email.");
                  }
                }}
                className="space-y-3"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-white/5 border border-white/15 rounded-lg text-xs outline-none focus:border-[#D8E7D2]"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#D8E7D2] text-black font-semibold text-xs uppercase tracking-wider rounded-lg"
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
