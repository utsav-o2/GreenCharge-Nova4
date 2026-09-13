"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Battery, Leaf, Zap, Star, ChevronRight, Activity, Sun, Wind, Clock, TrendingUp } from "lucide-react";
import StatCard from "@/components/StatCard";
import ProgressBar from "@/components/ProgressBar";
import { getCurrentUser } from "@/lib/auth";
import { getVehicle, getEcoCoins } from "@/lib/storage";
import { VehicleProfile, EnergyMixRow, GridConditionRow } from "@/lib/types";

export default function DriverHomePage() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<VehicleProfile | null>(null);
  const [energyMix, setEnergyMix] = useState<EnergyMixRow | null>(null);
  const [gridCondition, setGridCondition] = useState<GridConditionRow | null>(null);
  const [ecoCoins, setEcoCoins] = useState(220);
  const [userName, setUserName] = useState("");
  const [bestUpcoming, setBestUpcoming] = useState<{
    hour: number;
    score: number;
    renewable_pct: number;
    grid_load: number;
    isNow: boolean;
    hoursFromNow: number;
  } | null>(null);
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { router.replace("/login"); return; }
    setUserName(user.name);

    const v = getVehicle();
    if (!v) { router.replace("/driver/onboarding"); return; }
    setVehicle(v);
    setEcoCoins(getEcoCoins());

    const hour = new Date().getHours();
    Promise.all([
      fetch("/data/energy_mix.json").then((r) => r.json()),
      fetch("/data/grid_conditions.json").then((r) => r.json()),
    ]).then(([mix, grid]: [EnergyMixRow[], GridConditionRow[]]) => {
      setEnergyMix(mix[hour] ?? mix[12]);
      setGridCondition(grid[hour] ?? grid[12]);

      let bestScore = -1;
      let bestHour = hour;
      let bestMix = mix[hour] ?? mix[12];
      let bestGrid = grid[hour] ?? grid[12];
      let bestOffset = 0;
      
      for (let i = 0; i < 24; i++) {
        const h = (hour + i) % 24;
        const m = mix[h] ?? mix[12];
        const g = grid[h] ?? grid[12];
        
        const renNormalized = m.renewable_pct / 100;
        const loadNormalized = g.load_pct / 100;
        const score = 0.5 * renNormalized + 0.5 * (1 - loadNormalized);
        
        if (score > bestScore) {
          bestScore = score;
          bestHour = h;
          bestMix = m;
          bestGrid = g;
          bestOffset = i;
        }
      }
      
      setBestUpcoming({
        hour: bestHour,
        score: bestScore,
        renewable_pct: bestMix.renewable_pct,
        grid_load: bestGrid.load_pct,
        isNow: bestOffset === 0,
        hoursFromNow: bestOffset,
      });
    });
  }, [router]);

  if (!vehicle) return null;

  const ecoCoinTarget = 100;
  const coinsTowardsNext = ecoCoins % ecoCoinTarget;
  const availableDiscounts = Math.floor(ecoCoins / ecoCoinTarget);
  const gridStatusColor =
    gridCondition?.status === "low" ? "#22C55E"
      : gridCondition?.status === "moderate" ? "#F59E0B"
        : "#EF4444";

  return (
          <main className="flex-1 px-4 py-5 pb-24 lg:pb-8 max-w-screen-lg mx-auto w-full">

            {/* Vehicle Profile Card */}
            <div className="card mb-4 animate-fade-slide-up stagger-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-widest font-medium" style={{ color: "var(--color-gc-muted)" }}>
                  Your Vehicle
                </span>
                <Battery size={18} style={{ color: "var(--color-gc-accent)" }} />
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold">
                  {vehicle.brand} {vehicle.model}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Zap size={14} style={{ color: "var(--color-gc-accent)" }} />
                <span className="text-sm font-semibold">
                  Target Charge:{" "}
                  <span style={{ color: "var(--color-gc-accent)" }}>{vehicle.target_pct}%</span>
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--color-gc-muted)" }}>
                {vehicle.battery_kwh} kWh battery
              </p>
            </div>

            {/* Best Upcoming Time Card */}
            {bestUpcoming && (
              <div 
                className="card mb-4 animate-fade-slide-up stagger-1 cursor-pointer transition-colors hover:bg-white/5"
                onClick={() => router.push("/driver/charge-now")}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} style={{ color: "var(--color-gc-accent)" }} />
                  <span className="text-xs uppercase tracking-widest font-medium" style={{ color: "var(--color-gc-muted)" }}>
                    Best Upcoming Time To Charge
                  </span>
                </div>
                {bestUpcoming.isNow ? (
                  <>
                    <p className="text-xl font-bold mb-1">Now is a great time to charge</p>
                    <p className="text-sm mb-3" style={{ color: "var(--color-gc-muted)" }}>
                      Renewable energy is high and grid demand low — a good window to charge.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xl font-bold">
                        {(() => {
                          const h = bestUpcoming.hour;
                          const ampm = h >= 12 ? 'PM' : 'AM';
                          const h12 = h % 12 || 12;
                          return `${h12}:00 ${ampm}`;
                        })()}
                      </span>
                      <span className="text-sm font-medium" style={{ color: "var(--color-gc-muted)" }}>
                        (in {bestUpcoming.hoursFromNow}h)
                      </span>
                    </div>
                    <p className="text-sm mb-3" style={{ color: "var(--color-gc-muted)" }}>
                      Renewable energy will be high and grid demand low — a good window to charge.
                    </p>
                  </>
                )}
                
                <div className="flex items-center gap-4 text-sm font-medium">
                  <div className="flex items-center gap-1.5">
                    <Leaf size={14} style={{ color: "var(--color-gc-accent)" }} />
                    <span>{bestUpcoming.renewable_pct}% Renewable</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={14} style={{ color: "#22C55E" }} />
                    <span>{bestUpcoming.grid_load}% Grid Load</span>
                  </div>
                </div>
              </div>
            )}

            {/* Charge Now Action */}
            <button
              onClick={() => router.push("/driver/charge-now")}
              className="w-full btn-primary py-5 mb-4 animate-fade-slide-up stagger-1 flex flex-col items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
                boxShadow: "0 8px 32px rgba(34, 197, 94, 0.25)",
              }}
            >
              <div className="flex items-center gap-2">
                <Zap size={24} fill="currentColor" />
                <span className="text-xl font-bold tracking-wide">Charge Now</span>
              </div>
              <span className="text-sm font-medium opacity-90">
                Find the best station for your current battery
              </span>
            </button>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="card animate-fade-slide-up stagger-2">
                <span className="text-xs uppercase tracking-widest font-medium block mb-2" style={{ color: "var(--color-gc-muted)" }}>
                  Renewable Now
                </span>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold" style={{ color: "var(--color-gc-accent)" }}>
                    {energyMix?.renewable_pct ?? "—"}
                  </span>
                  <span className="text-sm font-medium" style={{ color: "var(--color-gc-muted)" }}>%</span>
                </div>
                <div className="flex gap-2 text-xs" style={{ color: "var(--color-gc-muted)" }}>
                  <span className="flex items-center gap-1"><Sun size={12} /> {energyMix?.solar_pct ?? 0}%</span>
                  <span className="flex items-center gap-1"><Wind size={12} /> {energyMix?.wind_pct ?? 0}%</span>
                </div>
              </div>

              <div className="card animate-fade-slide-up stagger-3">
                <span className="text-xs uppercase tracking-widest font-medium block mb-2" style={{ color: "var(--color-gc-muted)" }}>
                  Grid Load
                </span>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold" style={{ color: gridStatusColor }}>
                    {gridCondition?.load_pct ?? "—"}
                  </span>
                  <span className="text-sm font-medium" style={{ color: "var(--color-gc-muted)" }}>%</span>
                </div>
                <span
                  className="text-xs capitalize px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${gridStatusColor}20`, color: gridStatusColor }}
                >
                  {gridCondition?.status ?? "—"}
                </span>
              </div>
            </div>

            {/* EcoCoins */}
            <div className="card mb-4 animate-fade-slide-up stagger-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-widest font-medium" style={{ color: "var(--color-gc-muted)" }}>
                  EcoCoins
                </span>
                <Star size={16} style={{ color: "#F59E0B" }} />
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold" style={{ color: "#F59E0B" }}>
                  {ecoCoins}
                </span>
                <span className="text-sm" style={{ color: "var(--color-gc-muted)" }}>
                  coins total
                </span>
              </div>
              <ProgressBar value={coinsTowardsNext} max={ecoCoinTarget} color="#F59E0B" />
              <div className="flex flex-col gap-1 mt-2">
                <p className="text-xs" style={{ color: "var(--color-gc-muted)" }}>
                  {coinsTowardsNext}/{ecoCoinTarget} coins — {ecoCoinTarget - coinsTowardsNext} more for ₹100 off
                </p>
                {availableDiscounts > 0 && (
                  <p className="text-xs font-semibold text-green-400">
                    {availableDiscounts} x ₹100 discount{availableDiscounts > 1 ? 's' : ''} available!
                  </p>
                )}
              </div>
            </div>


          </main>
  );
}
