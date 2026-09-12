export interface Station {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  chargers_available: number;
  chargers_total: number;
  connector_types: string[];
  price_per_kwh: number;
  renewable_pct: number;
  status: 'available' | 'busy' | 'full' | 'offline';
  operator: string;
  max_power_kw: number;
}

export interface RankedStation extends Station {
  distance_km: number;
}

export interface EnergyMixRow {
  hour: number;
  solar_pct: number;
  wind_pct: number;
  grid_pct: number;
  renewable_pct: number;
}

export interface GridConditionRow {
  hour: number;
  load_pct: number;
  status: string;
}

export interface VehicleProfile {
  brand: string;
  model: string;
  battery_kwh: number;
  target_pct: number;
}

export interface UserProfile {
  name: string;
  email: string;
  role: 'driver' | 'operator';
}

export interface StationScore {
  station: Station;
  totalScore: number;
  subscores: {
    requirementMatch: number;
    renewable: number;
    gridCondition: number;
    cost: number;
    distance: number;
    availability: number;
  };
  distance_km: number;
  bestHour: number;
  estimatedCost: number;
  savingsVsBaseline: number;
}

export interface Session {
  id: string;
  date: string;
  station_name: string;
  city: string;
  energy_kwh: number;
  cost: number;
  renewable_pct: number;
  co2_avoided_kg: number;
  ecocoins_earned: number;
  duration_min: number;
}
