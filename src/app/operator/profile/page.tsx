"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, LogOut, MapPin, Edit2, CheckCircle2, Trash2, Plus } from "lucide-react";
import { getCurrentUser, logout, CurrentUser } from "@/lib/auth";
import { Station } from "@/lib/types";
import { fetchAllStations } from "@/lib/api-client";
import { getOwnedStations, releaseStation, setStationOverride, editCustomStation, deleteCustomStation } from "@/lib/stations-overlay";

export default function OperatorProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    price_per_kwh: 15,
    chargers_total: 0,
    chargers_available: 0,
    status: "available" as Station["status"]
  });

  const loadStations = async (currentUser: CurrentUser) => {
    const ownedIds = getOwnedStations(currentUser.email);
    try {
      const allStations = await fetchAllStations();
      setStations(allStations.filter((s: Station) => ownedIds.includes(s.id)));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { router.replace("/login"); return; }
    setUser(u);
    loadStations(u);
  }, [router]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  function startEdit(st: Station) {
    setEditingId(st.id);
    setEditForm({
      price_per_kwh: st.price_per_kwh,
      chargers_total: st.chargers_total,
      chargers_available: st.chargers_available,
      status: st.status
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit(stationId: string) {
    if (editForm.chargers_available > editForm.chargers_total) {
      alert("Available chargers cannot exceed total chargers.");
      return;
    }
    if (editForm.price_per_kwh < 0) {
      alert("Price cannot be negative.");
      return;
    }

    if (stationId.startsWith("custom_")) {
      editCustomStation(stationId, editForm);
    } else {
      setStationOverride(stationId, editForm);
    }
    setEditingId(null);
    if (user) loadStations(user); // Reload to reflect changes
  }

  function handleRelease(stationId: string) {
    if (!user) return;
    const isCustom = stationId.startsWith("custom_");
    const msg = isCustom 
      ? "Are you sure you want to permanently delete this custom station?" 
      : "Are you sure you want to release this station? Another operator will be able to claim it.";
      
    if (confirm(msg)) {
      if (isCustom) {
        deleteCustomStation(stationId, user.email);
      } else {
        releaseStation(stationId, user.email);
      }
      loadStations(user);
    }
  }

  if (!user) return null;

  return (
    <main className="flex-1 px-4 py-5 pb-8 max-w-screen-md mx-auto w-full">
            <div className="mb-5 animate-fade-slide-up flex justify-between items-center">
              <h1 className="text-xl font-bold">Operator Profile</h1>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-red-500 font-semibold hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>

            <div className="card mb-6 animate-fade-slide-up stagger-1">
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
                    <Building2 size={12} /> Operator
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between animate-fade-slide-up stagger-2">
              <h3 className="font-semibold text-lg">My Managed Stations</h3>
              {stations.length < 10 && !loading && (
                <button
                  onClick={() => router.push("/operator/stations")}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: "var(--color-gc-accent)", color: "#0A0D0B" }}
                >
                  <Plus size={14} /> Claim Station
                </button>
              )}
            </div>

            <div className="space-y-4 animate-fade-slide-up stagger-2">
              {loading ? (
                <p className="text-sm text-gray-500 text-center py-6">Loading your stations...</p>
              ) : stations.length === 0 ? (
                <div className="card text-center py-8 flex flex-col items-center">
                  <Building2 size={32} className="text-gray-500 mb-3" />
                  <p className="text-sm text-gray-400 mb-4">You haven't claimed any stations yet.</p>
                  <button
                    onClick={() => router.push("/operator/stations")}
                    className="btn-primary text-sm px-6 py-2"
                  >
                    Manage Stations
                  </button>
                </div>
              ) : (
                stations.map((st) => {
                  const isEditing = editingId === st.id;
                  
                  return (
                    <div key={st.id} className="card p-4 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-base">{st.name}</h4>
                          <p className="text-xs flex items-center gap-1 mt-1" style={{ color: "var(--color-gc-muted)" }}>
                            <MapPin size={12} /> {st.city}, {st.address.split(', ')[1] || st.address}
                          </p>
                        </div>
                        {!isEditing && (
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(st)} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors" title="Edit Station Info">
                              <Edit2 size={14} className="text-green-400" />
                            </button>
                            <button onClick={() => handleRelease(st.id)} className="p-2 bg-gray-800 rounded-lg hover:bg-red-500/20 transition-colors" title="Release Station">
                              <Trash2 size={14} className="text-red-400" />
                            </button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="mt-4 p-4 rounded-xl border border-green-500/30 bg-green-500/5">
                          <h5 className="text-xs font-semibold text-green-400 mb-3 uppercase tracking-wider">Edit Station Parameters</h5>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Price per kWh (₹)</label>
                              <input 
                                type="number" 
                                value={editForm.price_per_kwh} 
                                onChange={(e) => setEditForm({...editForm, price_per_kwh: Number(e.target.value)})}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Status</label>
                              <select 
                                value={editForm.status} 
                                onChange={(e) => setEditForm({...editForm, status: e.target.value as Station["status"]})}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 capitalize"
                              >
                                <option value="available">Available</option>
                                <option value="busy">Busy</option>
                                <option value="full">Full</option>
                                <option value="offline">Offline</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Total Chargers</label>
                              <input 
                                type="number" 
                                value={editForm.chargers_total} 
                                onChange={(e) => setEditForm({...editForm, chargers_total: Number(e.target.value)})}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Available Chargers</label>
                              <input 
                                type="number" 
                                value={editForm.chargers_available} 
                                onChange={(e) => setEditForm({...editForm, chargers_available: Number(e.target.value)})}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
                              />
                            </div>
                          </div>
                          
                          <div className="flex gap-2 justify-end">
                            <button onClick={cancelEdit} className="px-4 py-2 text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors">
                              Cancel
                            </button>
                            <button onClick={() => saveEdit(st.id)} className="px-4 py-2 text-xs font-semibold bg-green-500 text-black rounded-lg hover:bg-green-400 transition-colors flex items-center gap-1">
                              <CheckCircle2 size={14} /> Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-sm bg-[#0A0D0B] rounded-lg p-2 border border-gray-800/50">
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Price</p>
                            <p className="font-semibold text-green-400">₹{st.price_per_kwh}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Status</p>
                            <p className="font-semibold capitalize text-gray-200">{st.status}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Total</p>
                            <p className="font-semibold text-gray-200">{st.chargers_total}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Available</p>
                            <p className="font-semibold text-gray-200">{st.chargers_available}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </main>
  );
}
