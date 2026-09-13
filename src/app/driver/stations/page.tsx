"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, List, Grid3X3 } from "lucide-react";
import StationCard from "@/components/StationCard";
import { getCurrentUser } from "@/lib/auth";
import { getRankedStations } from "@/lib/getRankedStations";
import { RankedStation } from "@/lib/types";

export default function StationsPage() {
  const router = useRouter();
  const [stations, setStations] = useState<RankedStation[]>([]);
  const [displayLimit, setDisplayLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [gridView, setGridView] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [locLoading, setLocLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { router.replace("/login"); return; }
    
    getRankedStations().then(({ stations, userLoc }) => {
      setUserLoc(userLoc);
      setStations(stations);
      setLocLoading(false);
    });
  }, [router]);

  const filtered = stations
    .filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.city.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || s.status === filterStatus;
      return matchSearch && matchStatus;
    });

  const displayStations = filtered.slice(0, displayLimit);

  return (
          <main className="flex-1 px-4 py-5 pb-24 lg:pb-8 max-w-screen-lg mx-auto w-full">
            <div className="mb-5">
              <h1 className="text-xl font-bold animate-fade-slide-up">Charging Stations</h1>
              <p className="text-sm mt-1 animate-fade-slide-up stagger-1" style={{ color: "var(--color-gc-muted)" }}>
                {filtered.length} stations found
              </p>
            </div>

            {/* Search bar */}
            <div className="relative mb-4 animate-fade-slide-up stagger-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--color-gc-muted)" }}
              />
              <input
                type="text"
                id="stations-search"
                placeholder="Search by name or city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: "var(--color-gc-card)",
                  border: "1px solid var(--color-gc-border)",
                  color: "var(--color-gc-text)",
                }}
              />
            </div>

            {/* Filters row */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 animate-fade-slide-up stagger-2">
              {["all", "available", "busy", "full", "offline"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors"
                  style={{
                    background: filterStatus === s ? "var(--color-gc-accent)" : "var(--color-gc-card)",
                    color: filterStatus === s ? "#0A0D0B" : "var(--color-gc-muted)",
                    border: "1px solid var(--color-gc-border)",
                  }}
                >
                  {s}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => setGridView(false)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ background: !gridView ? "rgba(34,197,94,0.1)" : "transparent", color: !gridView ? "var(--color-gc-accent)" : "var(--color-gc-muted)" }}
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setGridView(true)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ background: gridView ? "rgba(34,197,94,0.1)" : "transparent", color: gridView ? "var(--color-gc-accent)" : "var(--color-gc-muted)" }}
                >
                  <Grid3X3 size={16} />
                </button>
              </div>
            </div>

            {/* Fallback Location Notice */}
            {!locLoading && !userLoc && (
              <div className="mb-4 text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-2 animate-fade-slide-up stagger-2" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
                <span>Using approximate location — enable location access for accurate distances</span>
              </div>
            )}

            {/* Station list */}
            {locLoading ? (
              <div className="text-center py-10">
                <span className="text-sm" style={{ color: "var(--color-gc-muted)" }}>Finding nearest stations...</span>
              </div>
            ) : (
              <div className={gridView ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "flex flex-col gap-3"}>
                {displayStations.map((station, i) => (
                  <div key={station.id} style={{ animationDelay: `${i * 40}ms` }}>
                    <StationCard
                      station={station}
                      distance_km={station.distance_km}
                      rank={i + 1}
                    />
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-16 flex flex-col items-center" style={{ color: "var(--color-gc-muted)" }}>
                    <Search size={36} className="mb-3" />
                    <p className="font-medium">No stations found</p>
                    <p className="text-sm mt-1">Try a different search or filter</p>
                  </div>
                )}
              </div>
            )}

            {/* Show all toggle */}
            {!locLoading && displayLimit < filtered.length && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setDisplayLimit((prev) => prev + 10)}
                  className="w-full py-3 text-sm font-semibold rounded-xl border transition-colors hover:bg-gray-800"
                  style={{ borderColor: "var(--color-gc-border)", color: "var(--color-gc-text)" }}
                  id="toggle-all-stations"
                >
                  Show More Stations ↓
                </button>
              </div>
            )}
          </main>
  );
}
