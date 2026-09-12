"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Zap, Clock, IndianRupee, Leaf, Battery, CheckCircle2, Star } from "lucide-react";
import ProgressBar from "@/components/ProgressBar";
import { getCurrentUser } from "@/lib/auth";
import { getBooking, getVehicle, addLocalSession, addEcoCoins } from "@/lib/storage";
import { VehicleProfile } from "@/lib/types";

interface Booking {
  station: { name: string; price_per_kwh: number; renewable_pct: number; city: string };
  vehicle: VehicleProfile;
  estimatedCost: number;
  savingsVsBaseline: number;
  matchPct: number;
  current_pct: number;
}

function calculateCoinsEarned(billAmount: number) {
  const tiersCompleted = Math.floor(billAmount / 500);
  return tiersCompleted * 10;
}

export default function SessionPage() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<VehicleProfile | null>(null);
  const [booking, setBookingState] = useState<Booking | null>(null);
  const [chargePct, setChargePct] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [complete, setComplete] = useState(false);
  const [showCoins, setShowCoins] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { router.replace("/login"); return; }
    const v = getVehicle();
    const b = getBooking() as Booking | null;
    if (!v || !b) { router.replace("/driver/recommend"); return; }
    setVehicle(v);
    setBookingState(b);
    setChargePct(b.current_pct);

    const totalDiff = v.target_pct - b.current_pct;
    if (totalDiff <= 0) { router.replace("/driver/home"); return; }

    // Simulate charging over ~45 seconds (demo)
    const DEMO_DURATION_MS = 45000;
    const TICK_MS = 500;
    const pctPerTick = (totalDiff / DEMO_DURATION_MS) * TICK_MS;

    intervalRef.current = setInterval(() => {
      setChargePct((prev) => {
        const next = Math.min(v.target_pct, prev + pctPerTick);
        return Math.round(next * 10) / 10;
      });
      setElapsed((e) => e + TICK_MS);
    }, TICK_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [router]);

  useEffect(() => {
    if (!vehicle || !booking) return;
    if (chargePct >= vehicle.target_pct && !complete) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setComplete(true);

      // Save session
      const energyUsed = ((vehicle.target_pct - booking.current_pct) / 100) * vehicle.battery_kwh;
      const cost = Math.round(energyUsed * booking.station.price_per_kwh);
      const co2 = Math.round((booking.station.renewable_pct / 100) * energyUsed * 0.7 * 10) / 10;
      const coinsEarned = calculateCoinsEarned(cost);

      addLocalSession({
        id: `sess-demo-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        station_name: booking.station.name,
        city: booking.station.city,
        energy_kwh: Math.round(energyUsed * 10) / 10,
        cost,
        renewable_pct: booking.station.renewable_pct,
        co2_avoided_kg: co2,
        ecocoins_earned: coinsEarned,
        duration_min: Math.round(elapsed / 60000),
      });

      addEcoCoins(coinsEarned);

      // Show coin animation after 1s
      setTimeout(() => setShowCoins(true), 1000);
    }
  }, [chargePct, vehicle, booking, complete, elapsed]);

  if (!vehicle || !booking) return null;

  const energyUsed = ((chargePct - booking.current_pct) / 100) * vehicle.battery_kwh;
  const currentCost = Math.round(energyUsed * booking.station.price_per_kwh);
  const totalDiff = vehicle.target_pct - booking.current_pct;
  const progressPct = totalDiff > 0 ? ((chargePct - booking.current_pct) / totalDiff) * 100 : 100;
  const minutesLeft = complete ? 0 : Math.ceil(((vehicle.target_pct - chargePct) / vehicle.battery_kwh) * 60 / (booking.station.price_per_kwh / 100));
  const coinsEarned = calculateCoinsEarned(currentCost);

  if (complete) {
    const finalEnergy = ((vehicle.target_pct - booking.current_pct) / 100) * vehicle.battery_kwh;
    const finalCost = Math.round(finalEnergy * booking.station.price_per_kwh);
    const co2Avoided = Math.round((booking.station.renewable_pct / 100) * finalEnergy * 0.7 * 10) / 10;
    const finalCoinsEarned = calculateCoinsEarned(finalCost);

    return (
      <main className="flex-1 px-4 py-5 pb-24 lg:pb-8 max-w-screen-md mx-auto w-full flex flex-col items-center">
              {/* Success animation */}
              <div className="mt-8 mb-6 text-center animate-fade-slide-up">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.4)" }}
                >
                  <CheckCircle2 size={40} style={{ color: "var(--color-gc-accent)" }} />
                </div>
                <h1 className="text-2xl font-bold">Session Complete!</h1>
                <p className="text-sm mt-1" style={{ color: "var(--color-gc-muted)" }}>
                  Your vehicle is fully charged
                </p>
              </div>

              {/* EcoCoins earned */}
              {showCoins && (
                <div
                  className="w-full card mb-4 text-center animate-fade-slide-up"
                  style={{ border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.05)" }}
                >
                  <Star size={32} className="mx-auto mb-2" style={{ color: "#F59E0B" }} />
                  {finalCoinsEarned > 0 ? (
                    <>
                      <p className="text-3xl font-bold" style={{ color: "#F59E0B" }}>
                        +{finalCoinsEarned} EcoCoins
                      </p>
                      <p className="text-sm mt-1" style={{ color: "var(--color-gc-muted)" }}>
                        (₹500 per 10 coins)
                      </p>
                    </>
                  ) : (
                    <p className="text-sm mt-1" style={{ color: "#F59E0B", fontWeight: "500" }}>
                      No coins earned this session — spend ₹500+ to start earning EcoCoins
                    </p>
                  )}
                </div>
              )}

              {/* Summary stats */}
              <div className="w-full grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "Energy Charged", value: `${Math.round(finalEnergy * 10) / 10} kWh`, icon: <Zap size={16} style={{ color: "var(--color-gc-accent)" }} /> },
                  { label: "Total Cost", value: `₹${finalCost}`, icon: <IndianRupee size={16} style={{ color: "var(--color-gc-accent)" }} /> },
                  { label: "Renewable Used", value: `${booking.station.renewable_pct}%`, icon: <Leaf size={16} style={{ color: "var(--color-gc-accent)" }} /> },
                  { label: "CO₂ Avoided", value: `${co2Avoided} kg`, icon: <CheckCircle2 size={16} style={{ color: "var(--color-gc-accent)" }} /> },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="card animate-fade-slide-up">
                    <div className="flex items-center gap-2 mb-1">
                      {icon}
                      <span className="text-xs" style={{ color: "var(--color-gc-muted)" }}>{label}</span>
                    </div>
                    <p className="text-lg font-bold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => router.push("/driver/impact")}
                  className="btn-primary flex-1"
                  id="view-impact-btn"
                >
                  View Impact →
                </button>
                <button
                  onClick={() => router.push("/driver/home")}
                  className="btn-secondary flex-1"
                >
                  Back Home
                </button>
              </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 py-5 pb-24 lg:pb-8 max-w-screen-md mx-auto w-full">
            <div className="mb-5 animate-fade-slide-up">
              <h1 className="text-xl font-bold">Live Charging Session</h1>
              <p className="text-sm mt-1" style={{ color: "var(--color-gc-muted)" }}>
                {booking.station.name}
              </p>
            </div>

            {/* Animated battery card */}
            <div className="card mb-4 animate-fade-slide-up stagger-1">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-widest font-medium" style={{ color: "var(--color-gc-muted)" }}>
                  Battery Level
                </span>
                <Battery size={18} style={{ color: "var(--color-gc-accent)" }} />
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-5xl font-bold tabular-nums" style={{ color: "var(--color-gc-accent)" }}>
                  {Math.round(chargePct)}%
                </span>
                <span className="text-sm" style={{ color: "var(--color-gc-muted)" }}>
                  → {vehicle.target_pct}% target
                </span>
              </div>
              <ProgressBar value={progressPct} animated={false} height="12px" />

              {/* Pulsing indicator */}
              <div className="flex items-center gap-2 mt-3">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: "var(--color-gc-accent)",
                    animation: "pulse-green 1.5s infinite",
                  }}
                />
                <span className="text-xs font-medium" style={{ color: "var(--color-gc-accent)" }}>
                  Charging active
                </span>
              </div>
            </div>

            {/* Live stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Current Draw", value: `${booking.station.price_per_kwh > 15 ? "22" : "50"} kW`, icon: <Zap size={16} style={{ color: "var(--color-gc-accent)" }} /> },
                { label: "Running Cost", value: `₹${currentCost}`, icon: <IndianRupee size={16} style={{ color: "var(--color-gc-accent)" }} /> },
                { label: "Renewable", value: `${booking.station.renewable_pct}%`, icon: <Leaf size={16} style={{ color: "var(--color-gc-accent)" }} /> },
                { label: "Energy Added", value: `${Math.round(energyUsed * 10) / 10} kWh`, icon: <Battery size={16} style={{ color: "var(--color-gc-accent)" }} /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="card animate-fade-slide-up stagger-2">
                  <div className="flex items-center gap-2 mb-1">
                    {icon}
                    <span className="text-xs" style={{ color: "var(--color-gc-muted)" }}>{label}</span>
                  </div>
                  <p className="text-xl font-bold tabular-nums">{value}</p>
                </div>
              ))}
            </div>

            {/* Demo notice */}
            <div
              className="card text-center animate-fade-slide-up stagger-3"
              style={{ border: "1px solid rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.05)" }}
            >
              <p className="text-xs" style={{ color: "#F59E0B" }}>
                ⏱ Demo mode — simulated charging in ~45 seconds
              </p>
            </div>
    </main>
  );
}
