"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Zap, Leaf, Building2, Activity, Map as MapIcon } from "lucide-react";
import StatCard from "@/components/StatCard";
import { getCurrentUser, CurrentUser } from "@/lib/auth";
import { computeSuggestedPrice } from "@/lib/scoring";
import { Station, EnergyMixRow, GridConditionRow, Session } from "@/lib/types";
import { fetchAllStations } from "@/lib/api-client";

// Dynamic import for leaflet map to avoid SSR issues
const NetworkMap = dynamic(() => import("@/components/NetworkMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-900 animate-pulse">Loading map...</div>
});

// Helper to generate dynamic mock sessions for the operator if they don't have enough real ones
function generateMockSessions(stations: Station[]): Session[] {
  const sessions: Session[] = [];
  const numSessions = Math.floor(Math.random() * 16) + 15; // 15 to 30 sessions
  const today = new Date();
  
  for (let i = 0; i < numSessions; i++) {
    const st = stations[Math.floor(Math.random() * stations.length)];
    const energyKwh = Math.round((Math.random() * 20 + 10) * 10) / 10;
    const cost = Math.round(energyKwh * (st.price_per_kwh || 15));
    const sessionDate = new Date(today.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000);
    
    sessions.push({
      id: `sess-mock-${Math.random().toString(36).substr(2, 6)}`,
      date: sessionDate.toISOString().split("T")[0],
      station_name: st.name,
      city: st.city,
      energy_kwh: energyKwh,
      cost: cost,
      renewable_pct: Math.round(Math.random() * 55 + 40),
      co2_avoided_kg: Math.round((energyKwh * 0.42) * 10) / 10,
      ecocoins_earned: Math.round(energyKwh * 1.5),
      duration_min: Math.round(Math.random() * 40 + 20)
    });
  }
  return sessions;
}

export default function OperatorDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [energyMix, setEnergyMix] = useState<EnergyMixRow[]>([]);
  const [gridConditions, setGridConditions] = useState<GridConditionRow[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentHour, setCurrentHour] = useState(0);

  // Live simulation states for incremental bumps
  const [liveRevenueBump, setLiveRevenueBump] = useState(0);
  const [liveCO2Bump, setLiveCO2Bump] = useState(0);
  const [mapColorMode, setMapColorMode] = useState<"status" | "renewable">("status");

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "operator") { router.replace("/driver/home"); return; }
    
    setCurrentUser(user);
    setCurrentHour(new Date().getHours());

    Promise.all([
      fetchAllStations(),
      fetch("/data/energy_mix.json").then((r) => r.json()),
      fetch("/data/grid_conditions.json").then((r) => r.json()),
      fetch("/data/sessions.json").then((r) => r.json()),
    ]).then(([fullStations, mix, grid, fullSessions]: [Station[], EnergyMixRow[], GridConditionRow[], Session[]]) => {
      
      // FIX 0: Operator Owns 1-5 Stations
      const ownedKey = `greencharge_owned_stations_${user.email}`;
      let ownedIds: string[] = [];
      const stored = localStorage.getItem(ownedKey);
      
      if (stored) {
        try { ownedIds = JSON.parse(stored); } catch (e) {}
      }
      
      if (ownedIds.length === 0) {
        router.replace("/operator/stations");
        return;
      }

      // Filter stations to ONLY owned stations
      const operatorStations = fullStations.filter(s => ownedIds.includes(s.id));
      setStations(operatorStations);
      setEnergyMix(mix);
      setGridConditions(grid);

      // Filter sessions to ONLY sessions at owned stations
      const stationNames = new Set(operatorStations.map(s => s.name));
      let operatorSessions = fullSessions.filter(s => stationNames.has(s.station_name));
      
      // If we don't have enough sessions for these specific stations to make the dashboard look active,
      // generate some dynamic mock sessions to seed the dashboard.
      if (operatorSessions.length < 5 && operatorStations.length > 0) {
        operatorSessions = [...operatorSessions, ...generateMockSessions(operatorStations)];
      }
      setSessions(operatorSessions);
    });
  }, [router]);

  // Live Data Simulation Loop (only for OWNED stations)
  useEffect(() => {
    if (stations.length === 0) return;
    
    const interval = setInterval(() => {
      // Dispatch event for Header ticking timer reset
      window.dispatchEvent(new Event("gc-data-refresh"));

      // Randomly mutate exactly 1 station status (keep changes small and believable for a small operator)
      setStations(prev => {
        const next = [...prev];
        const idx = Math.floor(Math.random() * next.length);
        const currentStatus = next[idx].status;
        // Don't change offline stations
        if (currentStatus === "offline") return next;
        
        next[idx] = {
          ...next[idx],
          status: currentStatus === "available" ? "busy" : "available",
          chargers_available: currentStatus === "available" 
            ? Math.max(0, next[idx].chargers_available - 1) 
            : Math.min(next[idx].chargers_total, next[idx].chargers_available + 1)
        };
        return next;
      });

      // Occasional revenue bump simulating a finished charging session
      if (Math.random() < 0.3) {
        const fakeKwh = Math.random() * 15 + 5;
        setLiveRevenueBump(prev => prev + (fakeKwh * 15));
        setLiveCO2Bump(prev => prev + (fakeKwh * 0.42));
      }

    }, 20000); // every 20 seconds

    return () => clearInterval(interval);
  }, [stations.length]);

  if (!currentUser) return null;

  // Aggregates & True Metrics (only off owned stations)
  const activeChargers = stations.filter((s) => s.status === "available").reduce((s, st) => s + st.chargers_total, 0);
  
  // Real calculation from energy_mix.json for current hour
  const currentMix = energyMix.find(m => m.hour === currentHour) || energyMix[0];
  const trueAvgRenewable = currentMix ? currentMix.renewable_pct : 0;
  
  const baseRevenue = sessions.reduce((s, r) => s + r.cost, 0);
  const baseCO2 = sessions.reduce((s, r) => s + (r.co2_avoided_kg || 0), 0);

  const totalRevenue = Math.round(baseRevenue + liveRevenueBump);
  const totalCO2Saved = Math.round((baseCO2 + liveCO2Bump) * 10) / 10;

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

  const pieData = currentMix ? [
    { name: "Solar", value: currentMix.solar_pct, color: "#F59E0B" },
    { name: "Wind", value: currentMix.wind_pct, color: "#22C55E" },
    { name: "Grid", value: currentMix.grid_pct, color: "#6B7280" },
  ] : [];

  const statusColor = (st: Station) => st.status === "available" ? "#22C55E" : st.status === "busy" ? "#F59E0B" : st.status === "full" ? "#EF4444" : "#6B7280";

  // Grid Stress Forecast Logic (Next 4-6 hours)
  const upcomingGrid = gridConditions.filter(g => g.hour > currentHour && g.hour <= currentHour + 5);
  let worstHour: GridConditionRow | null = null;
  if (upcomingGrid.length > 0) {
    worstHour = upcomingGrid.reduce((worst, current) => current.load_pct > worst.load_pct ? current : worst, upcomingGrid[0]);
  }
  const worstMix = worstHour ? energyMix.find(m => m.hour === worstHour!.hour) : null;
  
  // Pick one of their cities for the forecast text
  const forecastCity = stations.length > 0 ? stations[0].city : "your area";

  return (
    <main className="flex-1 px-4 py-5 pb-8 max-w-screen-xl mx-auto w-full">
            <div className="mb-5 animate-fade-slide-up flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold">{currentUser.name}&apos;s Charging Stations</h1>
                <p className="text-sm mt-1" style={{ color: "var(--color-gc-muted)" }}>
                  {stations.length} {stations.length === 1 ? 'station' : 'stations'} owned · {sessions.length} recorded sessions
                </p>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
              <StatCard label="My Stations" value={stations.length} icon={<Building2 size={16} style={{ color: "var(--color-gc-accent)" }} />} delay={0} />
              <StatCard label="Active Chargers" value={activeChargers} icon={<Zap size={16} style={{ color: "var(--color-gc-accent)" }} />} accent delay={50} />
              <StatCard label="Avg Renewable %" value={trueAvgRenewable} unit="%" icon={<Leaf size={16} style={{ color: "var(--color-gc-accent)" }} />} accent delay={100} />
              <StatCard label="Total Revenue" value={totalRevenue} unit="₹" delay={150} />
              <StatCard label="CO₂ Saved" value={totalCO2Saved} unit="kg" accent delay={200} />
            </div>

            {/* New Features Row: Map and Grid Forecast */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
              {/* Owned Stations Map */}
              <div className="card lg:col-span-2 h-[400px] flex flex-col p-0 overflow-hidden animate-fade-slide-up stagger-1">
                <div className="p-4 border-b flex justify-between items-center bg-[#1A1F1C] z-10 relative shadow-sm" style={{ borderColor: "var(--color-gc-border)" }}>
                  <div className="flex items-center gap-2">
                    <MapIcon size={18} style={{ color: "var(--color-gc-accent)" }} />
                    <h3 className="text-sm font-semibold">My Stations Map</h3>
                  </div>
                  <div className="flex bg-[#0A0D0B] rounded-lg p-1 border" style={{ borderColor: "var(--color-gc-border)" }}>
                    <button 
                      onClick={() => setMapColorMode("status")}
                      className={`text-[10px] uppercase font-bold px-3 py-1 rounded-md transition-colors ${mapColorMode === "status" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"}`}
                    >
                      Status
                    </button>
                    <button 
                      onClick={() => setMapColorMode("renewable")}
                      className={`text-[10px] uppercase font-bold px-3 py-1 rounded-md transition-colors ${mapColorMode === "renewable" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"}`}
                    >
                      Renewable %
                    </button>
                  </div>
                </div>
                <div className="flex-1 bg-white">
                  {stations.length > 0 && (
                    <NetworkMap stations={stations} colorBy={mapColorMode} />
                  )}
                </div>
              </div>

              {/* Grid Stress Forecast */}
              <div className="card h-[400px] flex flex-col animate-fade-slide-up stagger-2">
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={18} className="text-red-400" />
                  <h3 className="text-sm font-semibold">Grid Stress Forecast</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="space-y-3">
                    {upcomingGrid.map(g => {
                      const m = energyMix.find(mx => mx.hour === g.hour);
                      const isWorst = worstHour?.hour === g.hour;
                      return (
                        <div key={g.hour} className={`p-3 rounded-xl border ${isWorst ? "border-red-500/30 bg-red-500/5" : "border-gray-800/50 bg-gray-900/50"}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold">{g.hour}:00</span>
                            {isWorst && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold uppercase tracking-wider">Peak Stress</span>}
                          </div>
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Grid Load: <strong className={g.load_pct > 80 ? "text-red-400" : "text-gray-200"}>{g.load_pct}%</strong></span>
                            <span>Renewable: <strong className={m && m.renewable_pct < 50 ? "text-orange-400" : "text-green-400"}>{m?.renewable_pct}%</strong></span>
                          </div>
                        </div>
                      );
                    })}
                    {upcomingGrid.length === 0 && (
                      <div className="text-sm text-gray-400 text-center py-10">No upcoming forecast available.</div>
                    )}
                  </div>
                </div>

                {worstHour && worstMix && (
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <p className="text-xs text-gray-300 leading-relaxed">
                      <strong className="text-red-400 block mb-1">Recommendation</strong>
                      Your station in <strong>{forecastCity}</strong> may see high grid stress at <strong className="text-white">{worstHour.hour}:00</strong> ({worstHour.load_pct}% load). Consider raising your price by <strong className="text-green-400">₹1.50/kWh</strong> to encourage off-peak shifting.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
              {/* Demand chart */}
              <div className="card animate-fade-slide-up stagger-1">
                <h3 className="text-sm font-semibold mb-4">Grid Demand & Renewable (24h)</h3>
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
                <h3 className="text-sm font-semibold mb-4">Current Energy Mix ({currentHour}:00)</h3>
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

            {/* Station table */}
            <div className="card animate-fade-slide-up stagger-4">
              <h3 className="text-sm font-semibold mb-4">My Stations Details</h3>
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
                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${utilization}%`, background: "var(--color-gc-accent)" }} />
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
