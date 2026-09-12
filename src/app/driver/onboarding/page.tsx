"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Battery, Target, Zap } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getVehicle, setVehicle } from "@/lib/storage";

interface EvModel {
  brand: string;
  model: string;
  battery_kwh: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [models, setModels] = useState<EvModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<EvModel | null>(null);
  const [batteryKwh, setBatteryKwh] = useState(40);
  const [targetPct, setTargetPct] = useState(80);
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { router.replace("/login"); return; }
    const existing = getVehicle();
    if (existing) { router.replace("/driver/home"); return; }

    fetch("/data/ev_models.json")
      .then((r) => r.json())
      .then((data: EvModel[]) => {
        setModels(data);
        setSelectedModel(data[0]);
        setBatteryKwh(data[0].battery_kwh);
      });
  }, [router]);

  function handleModelChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const model = models.find((m) => `${m.brand} ${m.model}` === e.target.value);
    if (!model) return;
    setSelectedModel(model);
    const custom = model.brand === "Other/Custom";
    setIsCustom(custom);
    if (!custom) setBatteryKwh(model.battery_kwh);
  }

  function handleSave() {
    if (!selectedModel) return;
    if (targetPct <= 0 || targetPct > 100) {
      alert("Target % must be between 1 and 100.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setVehicle({
        brand: selectedModel.brand,
        model: selectedModel.model,
        battery_kwh: batteryKwh,
        target_pct: targetPct,
      });
      router.push("/driver/home");
    }, 500);
  }



  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% -10%, rgba(34,197,94,0.10) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-md animate-fade-slide-up relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}
          >
            <Battery size={28} style={{ color: "var(--color-gc-accent)" }} />
          </div>
          <h1 className="text-2xl font-bold mb-1">Set up your vehicle</h1>
          <p className="text-sm" style={{ color: "var(--color-gc-muted)" }}>
            This helps us tailor recommendations just for you
          </p>
        </div>

        <div className="card p-6 flex flex-col gap-6">
          {/* Model selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-gc-muted)" }}>
              EV Model
            </label>
            <div className="relative">
              <select
                id="vehicle-model"
                onChange={handleModelChange}
                className="w-full px-4 py-3 rounded-xl text-sm appearance-none outline-none pr-10"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--color-gc-border)",
                  color: "var(--color-gc-text)",
                }}
              >
                {models.map((m) => (
                  <option
                    key={`${m.brand} ${m.model}`}
                    value={`${m.brand} ${m.model}`}
                    style={{ background: "#1A1F1C" }}
                  >
                    {m.brand} {m.model}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--color-gc-muted)" }}
              />
            </div>
          </div>

          {/* Battery capacity */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-gc-muted)" }}>
              Battery Capacity (kWh)
            </label>
            <input
              id="battery-kwh"
              type="number"
              min={5}
              max={200}
              step={0.1}
              value={batteryKwh}
              onChange={(e) => setBatteryKwh(parseFloat(e.target.value) || 40)}
              disabled={!isCustom && selectedModel?.brand !== "Other/Custom"}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--color-gc-border)",
                color: "var(--color-gc-text)",
                opacity: !isCustom ? 0.7 : 1,
              }}
            />
            {!isCustom && (
              <p className="text-xs" style={{ color: "var(--color-gc-muted)" }}>
                Auto-filled from vehicle specs. Select "Other/Custom" to edit.
              </p>
            )}
          </div>

          {/* Target Battery % */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-gc-muted)" }}>
              Target Battery %
            </label>
            <input
              id="target-pct"
              type="number"
              min={1}
              max={100}
              value={targetPct}
              onChange={(e) => setTargetPct(Math.min(100, parseInt(e.target.value) || 80))}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none text-center font-bold text-2xl"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--color-gc-border)",
                color: "var(--color-gc-accent)",
              }}
            />
          </div>

          <button
            id="onboarding-save"
            onClick={handleSave}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? "Saving…" : "Save & Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}
