"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Battery, Edit2, Check, X, Zap, ChevronDown, CheckCircle2 } from "lucide-react";
import { getCurrentUser, logout } from "@/lib/auth";
import { getVehicle, setVehicle, UserSettings, getSettings, updateSettings } from "@/lib/storage";
import { VehicleProfile, UserProfile } from "@/lib/types";

interface EvModel {
  brand: string;
  model: string;
  battery_kwh: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [vehicle, setVehicleState] = useState<VehicleProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editVehicle, setEditVehicle] = useState<VehicleProfile | null>(null);
  
  const [models, setModels] = useState<EvModel[]>([]);
  const [isCustom, setIsCustom] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    notifications: true,
    locationServices: true,
    dataPrivacy: true
  });

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { router.replace("/login"); return; }
    setUser(u);
    const v = getVehicle();
    setVehicleState(v);
    setEditVehicle(v);
    if (v?.brand === "Other/Custom") setIsCustom(true);
    setSettings(getSettings());

    fetch("/data/ev_models.json")
      .then((r) => r.json())
      .then((data: EvModel[]) => {
        setModels(data);
      });
  }, [router]);

  function handleModelChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!editVehicle) return;
    const model = models.find((m) => `${m.brand} ${m.model}` === e.target.value);
    if (!model) return;
    const custom = model.brand === "Other/Custom";
    setIsCustom(custom);
    setEditVehicle({
      ...editVehicle,
      brand: model.brand,
      model: model.model,
      battery_kwh: custom ? editVehicle.battery_kwh : model.battery_kwh
    });
  }

  function handleSave() {
    if (!editVehicle) return;
    if (editVehicle.target_pct <= 0 || editVehicle.target_pct > 100) {
      alert("Target % must be between 1 and 100.");
      return;
    }
    if (editVehicle.battery_kwh <= 0) {
      alert("Battery capacity must be positive.");
      return;
    }
    setVehicle(editVehicle);
    setVehicleState(editVehicle);
    setEditing(false);
    
    // Show success toast
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (!user) return null;
  return (
    <main className="flex-1 px-4 py-5 pb-24 lg:pb-8 max-w-screen-md mx-auto w-full relative">
            {/* Toast notification */}
            {saveToast && (
              <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 animate-fade-slide-up">
                <CheckCircle2 size={16} /> Profile updated
              </div>
            )}

            <div className="mb-5 animate-fade-slide-up">
              <h1 className="text-xl font-bold">Profile</h1>
            </div>

            {/* Account info */}
            <div className="card mb-4 animate-fade-slide-up stagger-1">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold"
                  style={{ background: "rgba(34,197,94,0.12)", color: "var(--color-gc-accent)" }}
                >
                  {user.name[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-lg">{user.name}</h2>
                  <p className="text-sm" style={{ color: "var(--color-gc-muted)" }}>{user.email}</p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-flex items-center gap-1"
                    style={{ background: "rgba(34,197,94,0.12)", color: "var(--color-gc-accent)" }}
                  >
                    <Zap size={12} fill="currentColor" /> Driver
                  </span>
                </div>
              </div>
            </div>

            {/* Vehicle profile */}
            {vehicle && editVehicle && (
              <div className="card mb-4 animate-fade-slide-up stagger-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Battery size={18} style={{ color: "var(--color-gc-accent)" }} />
                    <h3 className="font-semibold">Vehicle Profile</h3>
                  </div>
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                      style={{ background: "rgba(34,197,94,0.1)", color: "var(--color-gc-accent)" }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditing(false); setEditVehicle(vehicle); if (vehicle.brand !== "Other/Custom") setIsCustom(false); }}
                        className="p-1.5 rounded-lg hover:opacity-80 transition-opacity"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {!editing ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs uppercase tracking-wider" style={{ color: "var(--color-gc-muted)" }}>Model</span>
                      <span className="text-sm font-semibold">{vehicle.brand} {vehicle.model}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs uppercase tracking-wider" style={{ color: "var(--color-gc-muted)" }}>Battery</span>
                      <span className="text-sm font-semibold">{vehicle.battery_kwh} kWh</span>
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      <span className="text-xs uppercase tracking-wider" style={{ color: "var(--color-gc-muted)" }}>Target %</span>
                      <span className="text-sm font-semibold" style={{ color: "var(--color-gc-accent)" }}>
                        {vehicle.target_pct}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 animate-fade-slide-up">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-gc-muted)" }}>EV Model</label>
                      <div className="relative">
                        <select
                          value={`${editVehicle.brand} ${editVehicle.model}`}
                          onChange={handleModelChange}
                          className="w-full px-3 py-2.5 rounded-lg text-sm appearance-none outline-none pr-10"
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
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-gc-muted)" }} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-gc-muted)" }}>Battery Capacity (kWh)</label>
                      <input
                        type="number"
                        min={5} max={200} step={0.1}
                        value={editVehicle.battery_kwh}
                        onChange={(e) => setEditVehicle({ ...editVehicle, battery_kwh: parseFloat(e.target.value) || 40 })}
                        disabled={!isCustom}
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid var(--color-gc-border)",
                          color: "var(--color-gc-text)",
                          opacity: !isCustom ? 0.7 : 1,
                        }}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-gc-muted)" }}>Target Battery %</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min={1} max={100}
                          value={editVehicle.target_pct}
                          onChange={(e) => setEditVehicle({ ...editVehicle, target_pct: parseInt(e.target.value) })}
                          className="flex-1 accent-[var(--color-gc-accent)] h-1.5 bg-[rgba(255,255,255,0.1)] rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm font-bold w-12 text-right" style={{ color: "var(--color-gc-accent)" }}>
                          {editVehicle.target_pct}%
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleSave}
                      className="btn-primary w-full mt-2 py-3 text-sm flex items-center justify-center gap-2"
                    >
                      <Check size={16} /> Save Changes
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Settings */}
            <div className="card mb-4 animate-fade-slide-up stagger-3">
              <h3 className="font-semibold mb-3">Settings</h3>
              <div className="flex flex-col gap-1">
                {[
                  { key: "notifications", label: "Notifications" },
                  { key: "locationServices", label: "Location Services" },
                  { key: "dataPrivacy", label: "Data & Privacy" },
                ].map((item) => {
                  const isActive = settings[item.key as keyof UserSettings];
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between py-2.5 border-b"
                      style={{ borderColor: "var(--color-gc-border)" }}
                    >
                      <span className="text-sm">{item.label}</span>
                      <button
                        onClick={() => {
                          const newSettings = { ...settings, [item.key]: !isActive };
                          setSettings(newSettings);
                          updateSettings(newSettings);
                        }}
                        className="w-9 h-5 rounded-full relative transition-colors"
                        style={{ background: isActive ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)" }}
                      >
                        <div
                          className={`w-4 h-4 rounded-full absolute top-0.5 transition-all ${isActive ? "right-0.5" : "left-0.5"}`}
                          style={{ background: isActive ? "var(--color-gc-accent)" : "#9CA3AF" }}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              id="profile-logout"
              className="w-full py-3 rounded-xl text-sm font-semibold transition-colors animate-fade-slide-up stagger-4"
              style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              Sign Out
            </button>
    </main>
  );
}
