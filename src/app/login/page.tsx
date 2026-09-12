"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Eye, EyeOff } from "lucide-react";
import { login, getCurrentUser, isValidEmail } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Show a soft hint while typing (not a red error — just a gray nudge)
  const showEmailHint = email.length > 0 && !isValidEmail(email);

  // If already logged in, redirect away
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      router.replace(user.role === "driver" ? "/driver/home" : "/operator/dashboard");
    }
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const result = login(email, password);
      if (!result.success) {
        setError(result.message);
        setLoading(false);
        return;
      }
      // Role is determined by the registered account — read it back
      const user = getCurrentUser();
      router.push(user?.role === "driver" ? "/driver/home" : "/operator/dashboard");
    }, 500);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% -10%, rgba(34,197,94,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-sm animate-fade-slide-up relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--color-gc-accent)" }}
          >
            <Zap size={28} className="text-[#0A0D0B]" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              Green<span style={{ color: "var(--color-gc-accent)" }}>Charge</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-gc-muted)" }}>
              Smart EV Charging Optimization
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="card p-6 flex flex-col gap-5">
          <h2 className="text-lg font-semibold text-center">Welcome back</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email with live hint */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-gc-muted)" }}>
                Email
              </label>
              <input
                type="email"
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--color-gc-border)",
                  color: "var(--color-gc-text)",
                }}
                autoComplete="email"
              />
              {/* Gray hint while typing — not a red error */}
              {showEmailHint && (
                <p className="text-xs" style={{ color: "var(--color-gc-muted)" }}>
                  Use a Gmail or Yahoo email (e.g. name@gmail.com)
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-gc-muted)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--color-gc-border)",
                    color: "var(--color-gc-text)",
                  }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--color-gc-muted)" }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Inline error — shown only on submit failure */}
            {error && (
              <div
                className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "var(--color-gc-danger)",
                }}
              >
                <span className="shrink-0 mt-px">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : null}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm" style={{ color: "var(--color-gc-muted)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold" style={{ color: "var(--color-gc-accent)" }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
