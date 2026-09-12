"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Eye, EyeOff, Building2 } from "lucide-react";
import { signup, isValidEmail } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<"driver" | "operator">("driver");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Show a soft hint while typing (not a red error — just a gray nudge)
  const showEmailHint = email.length > 0 && !isValidEmail(email);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    // Small artificial delay to feel snappy
    setTimeout(() => {
      const result = signup(name, email, password, role);
      if (!result.success) {
        setError(result.message);
        setLoading(false);
        return;
      }
      router.push(role === "driver" ? "/driver/onboarding" : "/operator/dashboard");
    }, 500);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% -10%, rgba(34,197,94,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-sm animate-fade-slide-up relative z-10">
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
              Create your account
            </p>
          </div>
        </div>

        <div className="card p-6 flex flex-col gap-5">
          {/* Role toggle */}
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "var(--color-gc-border)" }}>
            {(["driver", "operator"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className="flex-1 py-2.5 text-sm font-semibold transition-colors capitalize"
                style={{
                  background: role === r ? "var(--color-gc-accent)" : "transparent",
                  color: role === r ? "#0A0D0B" : "var(--color-gc-muted)",
                }}
              >
                {r === "driver" ? (
                  <span className="flex items-center justify-center gap-1.5"><Zap size={16} fill="currentColor" /> Driver</span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5"><Building2 size={16} /> Operator</span>
                )}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-gc-muted)" }}>
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Arjun Sharma"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--color-gc-border)",
                  color: "var(--color-gc-text)",
                }}
              />
            </div>

            {/* Email with live hint */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-gc-muted)" }}>
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="arjun@gmail.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
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
                  id="signup-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--color-gc-border)",
                    color: "var(--color-gc-text)",
                  }}
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

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-gc-muted)" }}>
                Confirm Password
              </label>
              <input
                id="signup-confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--color-gc-border)",
                  color: "var(--color-gc-text)",
                }}
              />
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
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-1 flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm" style={{ color: "var(--color-gc-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold" style={{ color: "var(--color-gc-accent)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
