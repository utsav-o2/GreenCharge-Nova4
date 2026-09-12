"use client";
import { Station } from "@/lib/types";
import { MapPin, Zap, Leaf } from "lucide-react";
import Link from "next/link";

interface StationCardProps {
  station: Station;
  distance_km?: number;
  score?: number;
  compact?: boolean;
  rank?: number;
}

const statusConfig = {
  available: { label: "Available", cls: "badge-available", dot: "#22C55E" },
  busy: { label: "Busy", cls: "badge-busy", dot: "#F59E0B" },
  full: { label: "Full", cls: "badge-full", dot: "#EF4444" },
  offline: { label: "Offline", cls: "badge-offline", dot: "#6B7280" },
};

export default function StationCard({
  station,
  distance_km,
  score,
  compact = false,
  rank,
}: StationCardProps) {
  const status = statusConfig[station.status];

  return (
    <div className="card animate-fade-slide-up flex flex-col gap-3 hover:border-[rgba(34,197,94,0.2)] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {rank !== undefined && rank <= 3 && (
              <span 
                className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full" 
                style={{ background: "var(--color-gc-accent)", color: "#0A0D0B" }}
              >
                #{rank}{rank === 1 ? " Nearest" : ""}
              </span>
            )}
            <h3 className="font-semibold text-sm leading-snug truncate">{station.name}</h3>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={11} style={{ color: "var(--color-gc-muted)" }} />
            <span className="text-xs truncate" style={{ color: "var(--color-gc-muted)" }}>
              {station.address}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}>
            {status.label}
          </span>
          {score !== undefined && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ color: "var(--color-gc-accent)", background: "rgba(34,197,94,0.1)" }}
            >
              {score}% match
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-gc-muted)" }}>
            Price
          </span>
          <span className="text-sm font-bold">₹{station.price_per_kwh}/kWh</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-gc-muted)" }}>
            Chargers
          </span>
          <div className="flex items-center gap-1">
            <Zap size={12} style={{ color: "var(--color-gc-accent)" }} />
            <span className="text-sm font-bold">
              {station.chargers_available}/{station.chargers_total}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-gc-muted)" }}>
            Renewable
          </span>
          <div className="flex items-center gap-1">
            <Leaf size={12} style={{ color: "var(--color-gc-accent)" }} />
            <span className="text-sm font-bold">{station.renewable_pct}%</span>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      {!compact && (
        <>
          <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: "var(--color-gc-border)" }}>
            <div className="flex flex-wrap gap-1">
              {station.connector_types.slice(0, 2).map((c) => (
                <span
                  key={c}
                  className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-gc-muted)" }}
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {distance_km !== undefined && (
                <span className="text-xs font-medium" style={{ color: "var(--color-gc-accent)" }}>
                  {distance_km} km away
                </span>
              )}
              <span className="text-xs font-medium" style={{ color: "var(--color-gc-muted)" }}>
                {station.max_power_kw} kW
              </span>
            </div>
          </div>
          <Link
            href={`/driver/charge-now?stationId=${station.id}`}
            className="w-full btn-primary text-sm py-2 mt-1 flex items-center justify-center gap-1.5"
            style={{
              background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
            }}
          >
            <Zap size={14} fill="currentColor" /> Charge Now
          </Link>
        </>
      )}
    </div>
  );
}
