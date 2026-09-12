"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2, MapPin, Zap, Leaf, Clock, IndianRupee,
  TrendingDown, Star, Navigation, ChevronRight,
} from "lucide-react";
import ScoreBadge from "@/components/ScoreBadge";
import StationCard from "@/components/StationCard";
import { getCurrentUser } from "@/lib/auth";
import { getVehicle, setBooking } from "@/lib/storage";
import { scoreStations, getBestTimeLabel, computeRequiredKwh } from "@/lib/scoring";
import { Station, EnergyMixRow, GridConditionRow, VehicleProfile, StationScore } from "@/lib/types";
import { haversineDistance, DEMO_USER_LAT, DEMO_USER_LNG } from "@/lib/distance";
import { mapDbToFrontend } from "@/lib/db-to-frontend";

import { getRankedStations } from "@/lib/getRankedStations";
import { RankedStation } from "@/lib/types";

export default function RecommendPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scores, setScores] = useState<StationScore[]>([]);
  const [closestStation, setClosestStation] = useState<RankedStation | null>(null);
  const [vehicle, setVehicle] = useState<VehicleProfile | null>(null);
  const [currentPct, setCurrentPct] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { router.replace("/login"); return; }
    const v = getVehicle();
    if (!v) { router.replace("/driver/onboarding"); return; }
    setVehicle(v);
    const pctParam = searchParams.get("current_pct");
    if (!pctParam) { router.replace("/driver/charge-now"); return; }
    const pct = parseInt(pctParam, 10);
    setCurrentPct(pct);

    Promise.all([
      getRankedStations(),
      fetch("/data/energy_mix.json").then((r) => r.json()),
      fetch("/data/grid_conditions.json").then((r) => r.json()),
    ]).then(([{ stations }, mix, grid]) => {
      if (stations.length > 0) setClosestStation(stations[0]);
      let scored = scoreStations(stations, mix, grid, v, pct);
      const stationIdParam = searchParams.get("stationId");
      if (stationIdParam) {
        scored = scored.filter(s => s.station.id === stationIdParam);
      }
      setScores(scored);
      setLoading(false);
    });
  }, [router, searchParams]);

  function handleBook(score: StationScore) {
    setBooking({
      station: score.station,
      matchPct: score.totalScore,
      bestHour: score.bestHour,
      estimatedCost: score.estimatedCost,
      savingsVsBaseline: score.savingsVsBaseline,
      vehicle,
      current_pct: currentPct,
      timestamp: new Date().toISOString(),
    });
    router.push("/driver/session");
  }

  const top = scores[0];
  const runners = scores.slice(1, 3);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 animate-spin" style={{ borderColor: "var(--color-gc-accent)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "var(--color-gc-muted)" }}>
            Analyzing {scores.length || "all"} stations…
          </p>
        </div>
      </div>
    );
  }

  if (!top || !vehicle || currentPct === null) return null;

  const timeLabel = getBestTimeLabel(top.bestHour);
  const requiredKwh = computeRequiredKwh(vehicle, currentPct);

  const subscore_labels: { key: keyof StationScore["subscores"]; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      key: "distance",
      label: "Distance",
      icon: <Navigation size={14} />,
      desc: `${top.distance_km} km away — close to you`,
    },
    {
      key: "cost",
      label: "Price",
      icon: <IndianRupee size={14} />,
      desc: `₹${top.station.price_per_kwh}/kWh — ${top.subscores.cost >= 70 ? "competitive" : "slightly above average"}`,
    },
    {
      key: "renewable",
      label: "Renewable Energy",
      icon: <Leaf size={14} />,
      desc: `${top.station.renewable_pct}% renewable at best charging time`,
    },
    {
      key: "gridCondition",
      label: "Grid Condition",
      icon: <TrendingDown size={14} />,
      desc: `Grid load is ${top.subscores.gridCondition >= 70 ? "low" : "moderate"} at recommended time`,
    },
    {
      key: "availability",
      label: "Charger Availability",
      icon: <Zap size={14} />,
      desc: `${top.station.chargers_available}/${top.station.chargers_total} chargers free`,
    },
    {
      key: "requirementMatch",
      label: "Requirements Match",
      icon: <CheckCircle2 size={14} />,
      desc: `Station is ${top.station.status} and supports your connector`,
    },
  ];

  return (
    <main className="flex-1 px-4 py-5 pb-24 lg:pb-8 max-w-screen-lg mx-auto w-full">
            {/* Page header */}
            <div className="mb-5 animate-fade-slide-up">
              <h1 className="text-xl font-bold">Smart Recommendation</h1>
              <p className="text-sm mt-1" style={{ color: "var(--color-gc-muted)" }}>
                Optimized for cost · renewable · time · distance
              </p>
            </div>

            {/* Hero recommendation card */}
            <div
              className="rounded-2xl p-5 mb-4 animate-fade-slide-up stagger-1 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #1A1F1C 0%, #0D1810 100%)",
                border: "1px solid rgba(34,197,94,0.25)",
              }}
            >
              {/* Glow */}
              <div
                className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)",
                  transform: "translate(30%, -30%)",
                }}
              />

              <div className="flex items-start gap-4 mb-4">
                <ScoreBadge score={top.totalScore} size="lg" />
                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs font-bold uppercase tracking-widest mb-1"
                    style={{ color: "var(--color-gc-accent)" }}
                  >
                    #1 Best Match
                  </div>
                  <h2 className="text-lg font-bold leading-tight">{top.station.name}</h2>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={12} style={{ color: "var(--color-gc-muted)" }} />
                    <span className="text-xs" style={{ color: "var(--color-gc-muted)" }}>
                      {top.station.address} · {top.distance_km} km
                    </span>
                  </div>
                </div>
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center gap-1 mb-1">
                    <Clock size={12} style={{ color: "var(--color-gc-accent)" }} />
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-gc-muted)" }}>Time</span>
                  </div>
                  <p className="text-xs font-semibold leading-tight">{timeLabel}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center gap-1 mb-1">
                    <IndianRupee size={12} style={{ color: "var(--color-gc-accent)" }} />
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-gc-muted)" }}>Cost</span>
                  </div>
                  <p className="text-sm font-bold">₹{top.estimatedCost}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center gap-1 mb-1">
                    <Star size={12} style={{ color: "#F59E0B" }} />
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-gc-muted)" }}>You Save</span>
                  </div>
                  <p className="text-sm font-bold" style={{ color: "#22C55E" }}>
                    ₹{top.savingsVsBaseline}
                  </p>
                </div>
              </div>

              {/* Book button */}
              <button
                id="book-charging-btn"
                onClick={() => handleBook(top)}
                className="btn-primary w-full text-sm"
              >
                <Zap size={16} /> Book Charging Now
              </button>

              {closestStation && top.station.id !== closestStation.id && (
                <div className="mt-4 px-3 py-2.5 rounded-xl text-xs font-medium flex items-start gap-2 animate-fade-slide-up" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#F59E0B" }}>
                  <Navigation size={14} className="shrink-0 mt-0.5" />
                  <p>
                    Not the closest option — but {Math.max(1, Math.round(((closestStation.price_per_kwh - top.station.price_per_kwh) / closestStation.price_per_kwh) * 100))}% cheaper and {Math.max(1, top.station.renewable_pct - closestStation.renewable_pct)}% more renewable, worth the extra {Math.round((top.distance_km - closestStation.distance_km)*10)/10} km.
                  </p>
                </div>
              )}
            </div>

            {/* Why this recommendation */}
            <div className="card mb-4 animate-fade-slide-up stagger-2">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} style={{ color: "var(--color-gc-accent)" }} />
                Why this recommendation?
              </h3>
              <div className="flex flex-col gap-3">
                {subscore_labels.map(({ key, label, icon, desc }) => {
                  const score = top.subscores[key];
                  const color =
                    score >= 70 ? "#22C55E" : score >= 40 ? "#F59E0B" : "#EF4444";
                  return (
                    <div key={key} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span style={{ color }}>{icon}</span>
                          <span className="text-xs font-semibold">{label}</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color }}>
                          {score}/100
                        </span>
                      </div>
                      <div
                        className="w-full h-1.5 rounded-full overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.07)" }}
                      >
                        <div
                          className="h-full rounded-full animate-fill-bar"
                          style={{ width: `${score}%`, background: color }}
                        />
                      </div>
                      <p className="text-xs" style={{ color: "var(--color-gc-muted)" }}>{desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Runner-ups */}
            {runners.length > 0 && (
              <div className="animate-fade-slide-up stagger-3">
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-gc-muted)" }}>
                  Other Good Options
                </h3>
                <div className="flex flex-col gap-3">
                  {runners.map((r) => (
                    <div key={r.station.id} className="relative">
                      <StationCard
                        station={r.station}
                        distance_km={r.distance_km}
                        score={r.totalScore}
                        compact
                      />
                      <button
                        onClick={() => handleBook(r)}
                        className="absolute bottom-3 right-3 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ background: "rgba(34,197,94,0.12)", color: "var(--color-gc-accent)" }}
                      >
                        Book <ChevronRight size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
  );
}
