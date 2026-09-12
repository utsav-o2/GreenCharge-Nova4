"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, LogOut } from "lucide-react";
import { getCurrentUser, logout } from "@/lib/auth";
import { UserProfile } from "@/lib/types";

export default function OperatorProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { router.replace("/login"); return; }
    setUser(u);
  }, [router]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (!user) return null;

  return (
    <main className="flex-1 px-4 py-5 pb-8 max-w-screen-md mx-auto w-full">
            <div className="mb-5 animate-fade-slide-up">
              <h1 className="text-xl font-bold">Operator Profile</h1>
            </div>

            <div className="card mb-4 animate-fade-slide-up stagger-1">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold"
                  style={{ background: "rgba(34,197,94,0.12)", color: "var(--color-gc-accent)" }}
                >
                  {user.name[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-lg">{user.name}</h2>
                  <p className="text-sm" style={{ color: "var(--color-gc-muted)" }}>{user.email}</p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-flex items-center gap-1"
                    style={{ background: "rgba(34,197,94,0.12)", color: "var(--color-gc-accent)" }}
                  >
                    <Building2 size={12} /> Operator
                  </span>
                </div>
              </div>
            </div>

            <div className="card mb-4 animate-fade-slide-up stagger-2">
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={16} style={{ color: "var(--color-gc-accent)" }} />
                <h3 className="font-semibold text-sm">Network Access</h3>
              </div>
              <p className="text-sm" style={{ color: "var(--color-gc-muted)" }}>
                You have full access to the GreenCharge operator dashboard, pricing controls, and optimization insights.
              </p>
            </div>

            <button
              onClick={handleLogout}
              id="operator-logout"
              className="w-full py-3 rounded-xl text-sm font-semibold transition-colors animate-fade-slide-up stagger-3"
              style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              Sign Out
            </button>
          </main>
  );
}
