"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Zap, Leaf, Building2, AlertCircle, TrendingUp, Lightbulb, Moon } from "lucide-react";
import StatCard from "@/components/StatCard";
import { getCurrentUser } from "@/lib/auth";
import { computeSuggestedPrice } from "@/lib/scoring";
import { Station, EnergyMixRow, GridConditionRow, Session } from "@/lib/types";
import { mapDbToFrontend } from "@/lib/db-to-frontend";

export default function OperatorDashboard() {
  const router = useRouter();
  const [stations, setStations] = useState<Station[]>([]);
  const [energyMix, setEnergyMix] = useState<EnergyMixRow[]>([]);
  const [gridConditions, setGridConditions] = useState<GridConditionRow[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentHour, setCurrentHour] = useState(0);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "operator") { router.replace("/driver/home"); return; }
    setCurrentHour(new Date().getHours());

    Promise.all([
      fetch("/api/stations?pageSize=1000")
        .then((r) => r.json())
        .then((json) => json.data ? json.data.map(mapDbToFrontend) : []),
      fetch("/data/energy_mix.json").then((r) => r.json()),
      fetch("/data/grid_conditions.json").then((r) => r.json()),
      fetch("/data/sessions.json").then((r) => r.json()),
    ]).then(([st, mix, grid, sess]: [Station[], EnergyMixRow[], GridConditionRow[], Session[]]) => {
      setStations(st);
      setEnergyMix(mix);
      setGridConditions(grid);
      setSessions(sess);
    });
  }, [router]);

  // Aggregates
  const totalChargers = stations.reduce((s, st) => s + st.chargers_total, 0);
  const activeChargers = stations.filter((s) => s.status === "available").reduce((s, st) => s + st.chargers_total, 0);
  const avgRenewable = stations.length > 0
    ? Math.round(stations.reduce((s, st) => s + st.renewable_pct, 0) / stations.length)
    : 0;
  const totalEnergyCost = sessions.reduce((s, r) => s + r.cost, 0);
  const totalCO2Saved = sessions.reduce((s, r) => s + r.co2_avoided_kg, 0);

  // Demand chart data
  const demandData = gridConditions.map((g) => {
    const mixRow = energyMix.find((m) => m.hour === g.hour);
    return {
      hour: `${g.hour}h`,
      "Grid Load %": g.load_pct,
      "Renewable %": mixRow?.renewable_pct ?? 0,
      isCurrent: g.hour === currentHour,
    };
  });

  // Pricing table
  const pricingRows = energyMix.map((m) => {
    const grid = gridConditions.find((g) => g.hour === m.hour);
    return {
      hour: m.hour,
      renewable: m.renewable_pct,
      demand: grid?.load_pct ?? 50,
      suggested: computeSuggestedPrice(m.renewable_pct, grid?.load_pct ?? 50),
    };
  });

  // Pie chart for renewable vs grid
  const currentMix = energyMix[currentHour] ?? energyMix[0];
  const pieData = currentMix ? [
    { name: "Solar", value: currentMix.solar_pct, color: "#F59E0B" },
    { name: "Wind", value: currentMix.wind_pct, color: "#22C55E" },
    { name: "Grid", value: currentMix.grid_pct, color: "#6B7280" },
  ] : [];

  // Low-renewable sessions (optimization suggestions)
  const lowRenewableSessions = sessions.filter((s) => s.renewable_pct < 50);

  // Status color helper
  const statusColor = (st: Station) =>
    st.status === "available" ? "#22C55E"
      : st.status === "busy" ? "#F59E0B"
        : st.status === "full" ? "#EF4444"
          : "#6B7280";

  return (
    <main className="flex-1 px-4 py-5 pb-8 max-w-screen-xl mx-auto w-full">
            <div className="mb-5 animate-fade-slide-up">
              <h1 className="text-xl font-bold">Network Dashboard</h1>
              <p className="text-sm mt-1" style={{ color: "var(--color-gc-muted)" }}>
                {stations.length} stations · {sessions.length} sessions tracked
              </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
              <StatCard label="Total Stations" value={stations.length} icon={<Building2 size={16} style={{ color: "var(--color-gc-accent)" }} />} delay={0} />
              <StatCard label="Active Chargers" value={activeChargers} icon={<Zap size={16} style={{ color: "var(--color-gc-accent)" }} />} accent delay={50} />
              <StatCard label="Avg Renewable %" value={avgRenewable} unit="%" icon={<Leaf size={16} style={{ color: "var(--color-gc-accent)" }} />} accent delay={100} />
              <StatCard label="Total Revenue" value={totalEnergyCost} unit="₹" delay={150} />
              <StatCard label="CO₂ Saved" value={Math.round(totalCO2Saved * 10) / 10} unit="kg" accent delay={200} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
              {/* Demand chart */}
              <div className="card animate-fade-slide-up stagger-1">
                <h3 className="text-sm font-semibold mb-4">Charging Demand & Renewable (24h)</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={demandData} margin={{ top: 5, right: 0, bottom: 0, left: -30 }}>
                      <XAxis dataKey="hour" tick={{ fill: "#6B7280", fontSize: 10 }} tickLine={false} axisLine={false} interval={2} />
                      <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ background: "#1A1F1C", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#F0FDF4", fontSize: "12px" }}
                      />
                      <Bar dataKey="Grid Load %" fill="#374151" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Renewable %" fill="#22C55E" radius={[3, 3, 0, 0]} opacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie chart - current energy mix */}
              <div className="card animate-fade-slide-up stagger-2">
                <h3 className="text-sm font-semibold mb-4">Current Energy Mix</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend
                        formatter={(value) => (
                          <span style={{ color: "#9CA3AF", fontSize: "12px" }}>{value}</span>
                        )}
                      />
                      <Tooltip
                        contentStyle={{ background: "#1A1F1C", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#F0FDF4", fontSize: "12px" }}
                        formatter={(value) => [`${value}%`, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Dynamic Pricing Table */}
            <div className="card mb-5 animate-fade-slide-up stagger-2">
              <h3 className="text-sm font-semibold mb-4">Dynamic Pricing Suggestions (24h)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ color: "var(--color-gc-muted)" }}>
                      {["Hour", "Renewable %", "Grid Demand %", "Suggested Price/kWh", "Verdict"].map((h) => (
                        <th key={h} className="text-left pb-2 pr-4 font-medium uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pricingRows.map((row, i) => {
                      const isBest = row.renewable >= 70 && row.demand <= 55;
                      const isWorst = row.renewable < 40 && row.demand >= 80;
                      const isCurrent = row.hour === currentHour;
                      return (
                        <tr
                          key={row.hour}
                          className="border-t"
                          style={{
                            borderColor: "var(--color-gc-border)",
                            background: isCurrent ? "rgba(34,197,94,0.05)" : "transparent",
                          }}
                        >
                          <td className="py-2 pr-4 font-medium">{row.hour}:00{isCurrent ? " ◀" : ""}</td>
                          <td className="py-2 pr-4" style={{ color: row.renewable >= 60 ? "#22C55E" : "#6B7280" }}>
                            {row.renewable}%
                          </td>
                          <td className="py-2 pr-4" style={{ color: row.demand >= 80 ? "#EF4444" : "#6B7280" }}>
                            {row.demand}%
                          </td>
                          <td className="py-2 pr-4 font-bold">₹{row.suggested}</td>
                          <td className="py-2">
                            {isBest && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}>Best</span>}
                            {isWorst && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}>Peak</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Optimization Suggestions */}
            {lowRenewableSessions.length > 0 && (
              <div
                className="card mb-5 animate-fade-slide-up stagger-3"
                style={{ border: "1px solid rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.03)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={18} style={{ color: "#F59E0B" }} />
                  <h3 className="text-sm font-semibold">Optimization Suggestions</h3>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm" style={{ color: "var(--color-gc-muted)" }}>
                    <span className="font-semibold" style={{ color: "#F59E0B" }}>{lowRenewableSessions.length} sessions</span> occurred during low-renewable periods (renewable &lt; 50%). Consider shifting these to <strong style={{ color: "var(--color-gc-text)" }}>10 AM–2 PM</strong> for up to 84% renewable utilization.
                  </p>
                  <div className="flex gap-2">
                    <Lightbulb size={16} className="shrink-0 mt-0.5" style={{ color: "var(--color-gc-accent)" }} />
                    <p className="text-sm" style={{ color: "var(--color-gc-muted)" }}>
                      Evening peak (6–9 PM): Grid load exceeds 90%. Offer a <strong style={{ color: "var(--color-gc-text)" }}>₹3/kWh discount</strong> for sessions booked before 4 PM to shift demand.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Moon size={16} className="shrink-0 mt-0.5" style={{ color: "#3B82F6" }} />
                    <p className="text-sm" style={{ color: "var(--color-gc-muted)" }}>
                      Off-peak (midnight–5 AM): Wind power is highest. <strong style={{ color: "var(--color-gc-text)" }}>Advertise overnight charging</strong> with an EcoCoins bonus to commercial fleet operators.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Station table */}
            <div className="card animate-fade-slide-up stagger-4">
              <h3 className="text-sm font-semibold mb-4">Station Network</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ color: "var(--color-gc-muted)" }}>
                      {["Station", "City", "Status", "Utilization", "Renewable %", "Price/kWh"].map((h) => (
                        <th key={h} className="text-left pb-2 pr-4 font-medium uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stations.map((st, i) => {
                      const utilization = st.chargers_total > 0
                        ? Math.round(((st.chargers_total - st.chargers_available) / st.chargers_total) * 100)
                        : 0;
                      const sColor = statusColor(st);
                      return (
                        <tr key={st.id} className="border-t" style={{ borderColor: "var(--color-gc-border)" }}>
                          <td className="py-2 pr-4 font-medium max-w-[160px] truncate">{st.name}</td>
                          <td className="py-2 pr-4" style={{ color: "var(--color-gc-muted)" }}>{st.city}</td>
                          <td className="py-2 pr-4">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sColor }} />
                              <span style={{ color: sColor }} className="capitalize">{st.status}</span>
                            </span>
                          </td>
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                                <div className="h-full rounded-full" style={{ width: `${utilization}%`, background: "var(--color-gc-accent)" }} />
                              </div>
                              <span>{utilization}%</span>
                            </div>
                          </td>
                          <td className="py-2 pr-4 font-semibold" style={{ color: st.renewable_pct >= 70 ? "var(--color-gc-accent)" : "var(--color-gc-muted)" }}>
                            {st.renewable_pct}%
                          </td>
                          <td className="py-2">₹{st.price_per_kwh}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
    </main>
  );
}
