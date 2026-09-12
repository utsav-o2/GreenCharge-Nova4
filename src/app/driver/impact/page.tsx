"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Leaf, Zap, IndianRupee, Star, TrendingUp } from "lucide-react";
import StatCard from "@/components/StatCard";
import ScoreBadge from "@/components/ScoreBadge";
import ProgressBar from "@/components/ProgressBar";
import { getCurrentUser } from "@/lib/auth";
import { getLocalSessions, getEcoCoins } from "@/lib/storage";
import { computeGreenScore, computeCO2Avoided } from "@/lib/scoring";
import { Session, EnergyMixRow } from "@/lib/types";

export default function ImpactPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [energyMix, setEnergyMix] = useState<EnergyMixRow[]>([]);
  const [ecoCoins, setEcoCoins] = useState(220);
  const [currentHour, setCurrentHour] = useState(0);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { router.replace("/login"); return; }

    const hour = new Date().getHours();
    setCurrentHour(hour);
    setEcoCoins(getEcoCoins());

    Promise.all([
      fetch("/data/sessions.json").then((r) => r.json()),
      fetch("/data/energy_mix.json").then((r) => r.json()),
    ]).then(([staticSessions, mix]: [Session[], EnergyMixRow[]]) => {
      const localSessions = getLocalSessions() as Session[];
      setSessions([...staticSessions, ...localSessions]);
      setEnergyMix(mix);
    });
  }, [router]);

  const totalEnergy = sessions.reduce((s, r) => s + r.energy_kwh, 0);
  const totalRenewable = sessions.length > 0
    ? sessions.reduce((s, r) => s + (r.renewable_pct / 100) * r.energy_kwh, 0)
    : 0;
  const moneySaved = sessions.reduce((s, r) => s + Math.round(r.cost * 0.15), 0);
  const co2Avoided = computeCO2Avoided(sessions);
  const greenScore = computeGreenScore(sessions);
  const ecoCoinTarget = 250;

  // Area chart data
  const chartData = energyMix.map((row) => ({
    hour: `${row.hour}:00`,
    "Renewable %": row.renewable_pct,
    isCurrentHour: row.hour === currentHour,
  }));

  return (
    <main className="flex-1 px-4 py-5 pb-24 lg:pb-8 max-w-screen-lg mx-auto w-full">
            <div className="mb-5 animate-fade-slide-up">
              <h1 className="text-xl font-bold">Your Green Impact</h1>
              <p className="text-sm mt-1" style={{ color: "var(--color-gc-muted)" }}>
                {sessions.length} sessions tracked
              </p>
            </div>

            {/* Green Score */}
            <div className="card mb-4 flex items-center gap-6 animate-fade-slide-up stagger-1">
              <ScoreBadge score={greenScore} size="lg" />
              <div className="flex-1">
                <h2 className="text-lg font-bold">Green Score</h2>
                <p className="text-sm mt-1" style={{ color: "var(--color-gc-muted)" }}>
                  Based on renewable share, off-peak charging & CO₂ avoided
                </p>
                <div className="mt-3">
                  <ProgressBar value={greenScore} />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatCard
                label="Total Charged"
                value={Math.round(totalEnergy * 10) / 10}
                unit="kWh"
                icon={<Zap size={16} style={{ color: "var(--color-gc-accent)" }} />}
                delay={50}
              />
              <StatCard
                label="Renewable Used"
                value={Math.round(totalRenewable * 10) / 10}
                unit="kWh"
                icon={<Leaf size={16} style={{ color: "var(--color-gc-accent)" }} />}
                accent
                delay={100}
              />
              <StatCard
                label="Money Saved"
                value={moneySaved}
                unit="₹"
                icon={<IndianRupee size={16} style={{ color: "var(--color-gc-accent)" }} />}
                accent
                delay={150}
              />
              <StatCard
                label="CO₂ Avoided"
                value={Math.round(co2Avoided * 10) / 10}
                unit="kg"
                icon={<TrendingUp size={16} style={{ color: "var(--color-gc-accent)" }} />}
                delay={200}
              />
            </div>

            {/* Renewable chart */}
            <div className="card mb-4 animate-fade-slide-up stagger-2">
              <h3 className="text-sm font-semibold mb-4">Today&apos;s Renewable Availability</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: -30 }}>
                    <defs>
                      <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="hour"
                      tick={{ fill: "#6B7280", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      interval={3}
                    />
                    <YAxis
                      tick={{ fill: "#6B7280", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#1A1F1C",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "8px",
                        color: "#F0FDF4",
                        fontSize: "12px",
                      }}
                      cursor={{ stroke: "rgba(34,197,94,0.3)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Renewable %"
                      stroke="#22C55E"
                      strokeWidth={2}
                      fill="url(#greenGrad)"
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        if (!payload.isCurrentHour) return <g key={`dot-${cx}-${cy}`} />;
                        return (
                          <circle
                            key={`current-${cx}`}
                            cx={cx}
                            cy={cy}
                            r={5}
                            fill="#22C55E"
                            stroke="#0A0D0B"
                            strokeWidth={2}
                          />
                        );
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs mt-2 text-center" style={{ color: "var(--color-gc-muted)" }}>
                Green dot = current hour ({currentHour}:00)
              </p>
            </div>

            {/* EcoCoins */}
            <div className="card mb-4 animate-fade-slide-up stagger-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">EcoCoins Balance</h3>
                <Star size={16} style={{ color: "#F59E0B" }} />
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold" style={{ color: "#F59E0B" }}>{ecoCoins}</span>
                <span className="text-sm" style={{ color: "var(--color-gc-muted)" }}>coins</span>
              </div>
              <ProgressBar value={ecoCoins} max={ecoCoinTarget} color="#F59E0B" />
              <p className="text-xs mt-2" style={{ color: "var(--color-gc-muted)" }}>
                {Math.max(0, ecoCoinTarget - ecoCoins)} coins to unlock ₹100 discount
              </p>

              {/* Coin history */}
              <div className="mt-4 flex flex-col gap-2">
                {sessions.slice(0, 4).map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-1.5 border-t" style={{ borderColor: "var(--color-gc-border)" }}>
                    <div>
                      <p className="text-xs font-medium">{s.station_name}</p>
                      <p className="text-xs" style={{ color: "var(--color-gc-muted)" }}>{s.date}</p>
                    </div>
                    <span className="text-sm font-bold" style={{ color: "#F59E0B" }}>
                      +{s.ecocoins_earned}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Charging history table */}
            <div className="card animate-fade-slide-up stagger-4">
              <h3 className="text-sm font-semibold mb-4">Charging History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ color: "var(--color-gc-muted)" }}>
                      {["Date", "Station", "Energy", "Cost", "Renewable"].map((h) => (
                        <th key={h} className="text-left pb-2 pr-3 font-medium uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, i) => (
                      <tr
                        key={s.id}
                        className="border-t"
                        style={{ borderColor: "var(--color-gc-border)", animationDelay: `${i * 30}ms` }}
                      >
                        <td className="py-2 pr-3 whitespace-nowrap">{s.date}</td>
                        <td className="py-2 pr-3 max-w-[120px] truncate">{s.station_name}</td>
                        <td className="py-2 pr-3 font-medium">{s.energy_kwh} kWh</td>
                        <td className="py-2 pr-3 font-medium">₹{s.cost}</td>
                        <td className="py-2 font-semibold" style={{ color: "var(--color-gc-accent)" }}>
                          {s.renewable_pct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
  );
}
