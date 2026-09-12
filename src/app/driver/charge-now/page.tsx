"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Battery, Zap, ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getVehicle } from "@/lib/storage";
import { VehicleProfile } from "@/lib/types";
import { computeRequiredKwh } from "@/lib/scoring";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";

function ChargeNowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stationId = searchParams.get("stationId");
  const [vehicle, setVehicle] = useState<VehicleProfile | null>(null);
  const [currentPct, setCurrentPct] = useState(42);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { router.replace("/login"); return; }
    
    const v = getVehicle();
    if (!v) { router.replace("/driver/onboarding"); return; }
    setVehicle(v);
  }, [router]);

  function handleContinue() {
    if (!vehicle) return;
    if (currentPct >= vehicle.target_pct) {
      alert(`Your battery is already at or above your target of ${vehicle.target_pct}%.`);
      return;
    }
    setLoading(true);
    // Redirect to recommendations, passing the current_pct as a query parameter
    router.push(`/driver/recommend?current_pct=${currentPct}${stationId ? `&stationId=${stationId}` : ""}`);
  }

  if (!vehicle) return null;

  const requiredKwh = computeRequiredKwh(vehicle, currentPct);

  return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% -10%, rgba(34,197,94,0.15) 0%, transparent 70%)",
          }}
        />

        <div className="w-full max-w-md animate-fade-slide-up relative z-10">
          <Link
            href="/driver/home"
            className="inline-flex items-center gap-1 text-sm font-semibold mb-6 hover:opacity-80 transition-opacity"
            style={{ color: "var(--color-gc-muted)" }}
          >
            <ChevronLeft size={16} /> Back to Home
          </Link>

          <div className="text-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}
            >
              <Battery size={28} style={{ color: "var(--color-gc-accent)" }} />
            </div>
            <h1 className="text-2xl font-bold mb-1">Charge Now</h1>
            <p className="text-sm" style={{ color: "var(--color-gc-muted)" }}>
              What&apos;s your current battery level?
            </p>
          </div>

          <div className="card p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-widest text-center" style={{ color: "var(--color-gc-muted)" }}>
                Current Battery %
              </label>
              
              <div className="flex justify-center items-center py-4">
                <input
                  id="current-pct"
                  type="number"
                  min={0}
                  max={99}
                  value={currentPct}
                  onChange={(e) => setCurrentPct(Math.min(99, parseInt(e.target.value) || 0))}
                  className="w-32 px-4 py-3 rounded-xl text-center font-bold text-4xl outline-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--color-gc-border)",
                    color: "var(--color-gc-accent)",
                  }}
                />
              </div>
              
              <div className="px-2 mt-2">
                <input 
                  type="range" 
                  min="0" 
                  max="99" 
                  value={currentPct}
                  onChange={(e) => setCurrentPct(parseInt(e.target.value))}
                  className="w-full accent-[var(--color-gc-accent)] h-2 bg-[rgba(255,255,255,0.1)] rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Live preview */}
            <div
              className="rounded-xl p-4 flex items-center gap-4 mt-2"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <Zap size={24} style={{ color: "var(--color-gc-accent)" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-gc-text)" }}>
                  You need{" "}
                  <span style={{ color: "var(--color-gc-accent)" }}>
                    {requiredKwh.toFixed(1)} kWh
                  </span>{" "}
                  to charge
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-gc-muted)" }}>
                  from {currentPct}% → {vehicle.target_pct}% in your {vehicle.brand} {vehicle.model}
                </p>
              </div>
            </div>

            <button
              id="charge-now-continue"
              onClick={handleContinue}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
              style={{
                background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
                boxShadow: "0 4px 14px rgba(34, 197, 94, 0.4)",
              }}
            >
              {loading && (
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? "Finding stations…" : "Find Best Stations →"}
            </button>
          </div>
        </div>
      </div>
  );
}

export default function ChargeNowPage() {
  return (
    <Suspense fallback={null}>
      <ChargeNowContent />
    </Suspense>
  );
}
