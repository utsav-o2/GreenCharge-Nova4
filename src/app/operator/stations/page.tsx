"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Building2, CheckCircle2, Navigation } from "lucide-react";
import { getCurrentUser, CurrentUser } from "@/lib/auth";
import { Station } from "@/lib/types";
import { fetchAllStations } from "@/lib/api-client";
import { isStationClaimed, claimStation, getOwnedStations, addCustomStation } from "@/lib/stations-overlay";

export default function OperatorStationsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"claim" | "add">("claim");
  
  // Claim Tab State
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [search, setSearch] = useState("");
  const [ownedIds, setOwnedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(20);

  // Add Tab State
  const [addForm, setAddForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    connector: "CCS2",
    power: 50,
    chargers_total: 2,
    price: 15,
    lat: "",
    lng: ""
  });

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "operator") { router.replace("/driver/home"); return; }
    
    setCurrentUser(user);
    const currentlyOwned = getOwnedStations(user.email);
    setOwnedIds(currentlyOwned);

    // Fetch FULL dataset of all stations (merges DB + custom)
    fetchAllStations().then((stations) => {
      setAllStations(stations);
      setLoading(false);
    });
  }, [router]);

  const handleClaim = (stationId: string) => {
    if (ownedIds.length >= 10) return;
    if (claimStation(stationId, currentUser!.email)) {
      setOwnedIds([...ownedIds, stationId]);
      alert("Station successfully claimed!");
    } else {
      alert("This station was just claimed by someone else.");
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      setAddForm({
        ...addForm,
        lat: pos.coords.latitude.toFixed(6),
        lng: pos.coords.longitude.toFixed(6)
      });
    }, () => {
      alert("Failed to get location. Please enter manually.");
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.address || !addForm.city || !addForm.lat || !addForm.lng) {
      alert("Please fill in all required fields.");
      return;
    }
    
    const newStation: Station = {
      id: `custom_${Date.now()}`,
      name: addForm.name,
      address: addForm.address,
      city: addForm.city,
      lat: parseFloat(addForm.lat),
      lng: parseFloat(addForm.lng),
      chargers_total: Number(addForm.chargers_total),
      chargers_available: Number(addForm.chargers_total),
      connector_types: [addForm.connector],
      price_per_kwh: Number(addForm.price),
      renewable_pct: 50, // Default baseline for custom stations
      status: "available",
      operator: currentUser!.name,
      max_power_kw: Number(addForm.power)
    };

    addCustomStation(newStation, currentUser!.email);
    setOwnedIds([...ownedIds, newStation.id]);
    
    alert("New custom station added and claimed successfully!");
    setAddForm({ name: "", address: "", city: "", state: "", connector: "CCS2", power: 50, chargers_total: 2, price: 15, lat: "", lng: "" });
    setActiveTab("claim"); // switch back
  };

  // The critical fix:
  // 1. Filter out all claimed stations (by anyone)
  const unclaimedStations = allStations.filter(s => !isStationClaimed(s.id));
  
  // 2. Apply search/filter to the unclaimed list
  const filtered = unclaimedStations.filter((s) => {
    if (!search) return true;
    return (
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
    );
  });

  // 3. Slice for display performance
  const displayStations = filtered.slice(0, displayLimit);

  if (loading || !currentUser) {
    return (
      <main className="flex-1 px-4 py-16 text-center max-w-screen-md mx-auto w-full">
        <p style={{ color: "var(--color-gc-muted)" }}>Loading station directory...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 py-8 pb-24 max-w-screen-lg mx-auto w-full">
      <div className="mb-8 animate-fade-slide-up flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Manage My Stations</h1>
          <p className="text-sm" style={{ color: "var(--color-gc-muted)" }}>
            Search the GreenCharge directory to claim existing stations, or add a brand new one.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl text-sm font-semibold border" style={{ background: "rgba(34,197,94,0.1)", color: "var(--color-gc-accent)", borderColor: "var(--color-gc-accent)" }}>
            {ownedIds.length} / 10 Stations Claimed
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b" style={{ borderColor: "var(--color-gc-border)" }}>
        <button 
          onClick={() => setActiveTab("claim")}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "claim" ? "text-green-400 border-green-400" : "text-gray-400 border-transparent hover:text-gray-300"}`}
        >
          Claim an Existing Station
        </button>
        <button 
          onClick={() => setActiveTab("add")}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "add" ? "text-green-400 border-green-400" : "text-gray-400 border-transparent hover:text-gray-300"}`}
        >
          Add a New Station
        </button>
      </div>

      {activeTab === "claim" && (
        <div className="animate-fade-slide-up">
          <div className="relative mb-6">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--color-gc-muted)" }} />
            <input
              type="text"
              placeholder="Search by station name or city..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setDisplayLimit(20); }}
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-colors focus:border-green-500"
              style={{ background: "var(--color-gc-card)", border: "1px solid var(--color-gc-border)", color: "var(--color-gc-text)" }}
            />
          </div>

          <div className="mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Showing {displayStations.length} of {filtered.length} available stations
          </div>

          <div className="space-y-3">
            {displayStations.map((station) => (
              <div key={station.id} className="card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:bg-gray-800/30">
                <div>
                  <h3 className="font-bold text-sm">{station.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs" style={{ color: "var(--color-gc-muted)" }}>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {station.city}, {station.address.split(', ')[1] || station.address}</span>
                    <span className="flex items-center gap-1"><Building2 size={12} /> {station.chargers_total} bays</span>
                    <span>{station.max_power_kw}kW</span>
                    <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-300">{station.connector_types[0]}</span>
                  </div>
                </div>
                
                <div className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                  <button 
                    onClick={() => handleClaim(station.id)}
                    disabled={ownedIds.length >= 10}
                    className="w-full sm:w-auto px-6 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--color-gc-border)" }}
                  >
                    Claim Station
                  </button>
                </div>
              </div>
            ))}

            {displayStations.length < filtered.length && (
              <button 
                onClick={() => setDisplayLimit(prev => prev + 20)}
                className="w-full py-3 mt-4 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Load More Stations ↓
              </button>
            )}

            {filtered.length === 0 && search && (
              <div className="text-center py-10" style={{ color: "var(--color-gc-muted)" }}>
                <p>No unclaimed stations found matching "{search}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "add" && (
        <form onSubmit={handleAddSubmit} className="card p-6 animate-fade-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-green-400 border-b border-green-500/20 pb-2">Basic Info</h3>
              
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Station Name *</label>
                <input required type="text" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500" placeholder="e.g. Acme Fast Charge" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Address *</label>
                <input required type="text" value={addForm.address} onChange={e => setAddForm({...addForm, address: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500" placeholder="Street level address" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">City *</label>
                  <input required type="text" value={addForm.city} onChange={e => setAddForm({...addForm, city: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500" placeholder="City" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">State</label>
                  <input type="text" value={addForm.state} onChange={e => setAddForm({...addForm, state: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500" placeholder="State" />
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-semibold text-gray-400">Coordinates (Lat/Lng) *</label>
                  <button type="button" onClick={handleGetLocation} className="flex items-center gap-1 text-[10px] font-bold text-green-400 hover:text-green-300 transition-colors bg-green-500/10 px-2 py-1 rounded">
                    <Navigation size={10} /> Use My Location
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input required type="number" step="any" value={addForm.lat} onChange={e => setAddForm({...addForm, lat: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500" placeholder="Latitude (e.g. 19.076)" />
                  <input required type="number" step="any" value={addForm.lng} onChange={e => setAddForm({...addForm, lng: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500" placeholder="Longitude (e.g. 72.877)" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-sm text-green-400 border-b border-green-500/20 pb-2">Technical Specs</h3>
              
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Primary Connector Type</label>
                <select value={addForm.connector} onChange={e => setAddForm({...addForm, connector: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500">
                  <option value="CCS2">CCS2</option>
                  <option value="CHAdeMO">CHAdeMO</option>
                  <option value="AC Type 2">AC Type 2</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Max Power (kW)</label>
                  <input required type="number" min="1" value={addForm.power} onChange={e => setAddForm({...addForm, power: Number(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Total Bays/Chargers</label>
                  <input required type="number" min="1" value={addForm.chargers_total} onChange={e => setAddForm({...addForm, chargers_total: Number(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Price per kWh (₹)</label>
                <input required type="number" min="0" step="0.5" value={addForm.price} onChange={e => setAddForm({...addForm, price: Number(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500" />
              </div>
              
              <div className="pt-6">
                <button type="submit" disabled={ownedIds.length >= 10} className="w-full py-3 rounded-xl text-sm font-bold bg-green-500 text-black hover:bg-green-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  <Building2 size={16} /> Add and Claim Station
                </button>
                {ownedIds.length >= 10 && <p className="text-xs text-red-400 mt-2 text-center">You have reached the maximum of 10 stations.</p>}
              </div>
            </div>
          </div>
        </form>
      )}

    </main>
  );
}
