"use client";
import { Station } from "./types";

const CLAIMS_KEY = "greencharge_station_claims";
const OVERRIDES_KEY = "greencharge_station_overrides";
const CUSTOM_STATIONS_KEY = "greencharge_custom_stations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StationOverrides = Partial<Pick<Station, 'price_per_kwh' | 'chargers_total' | 'chargers_available' | 'status'>>;

// ---------------------------------------------------------------------------
// Claims Management
// ---------------------------------------------------------------------------

export function getGlobalClaims(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CLAIMS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function isStationClaimed(stationId: string): boolean {
  const claims = getGlobalClaims();
  return !!claims[stationId];
}

export function getStationOwner(stationId: string): string | null {
  const claims = getGlobalClaims();
  return claims[stationId] || null;
}

export function claimStation(stationId: string, email: string): boolean {
  if (typeof window === "undefined") return false;
  const claims = getGlobalClaims();
  if (claims[stationId] && claims[stationId] !== email) {
    return false; // Already claimed by someone else
  }
  claims[stationId] = email;
  localStorage.setItem(CLAIMS_KEY, JSON.stringify(claims));

  // Also add to their personal list
  const ownedKey = `greencharge_owned_stations_${email}`;
  const owned = getOwnedStations(email);
  if (!owned.includes(stationId)) {
    owned.push(stationId);
    localStorage.setItem(ownedKey, JSON.stringify(owned));
  }
  return true;
}

export function releaseStation(stationId: string, email: string): void {
  if (typeof window === "undefined") return;
  const claims = getGlobalClaims();
  if (claims[stationId] === email) {
    delete claims[stationId];
    localStorage.setItem(CLAIMS_KEY, JSON.stringify(claims));
  }

  // Remove from personal list
  const ownedKey = `greencharge_owned_stations_${email}`;
  const owned = getOwnedStations(email).filter(id => id !== stationId);
  localStorage.setItem(ownedKey, JSON.stringify(owned));
}

export function getOwnedStations(email: string): string[] {
  if (typeof window === "undefined") return [];
  const ownedKey = `greencharge_owned_stations_${email}`;
  try {
    const raw = localStorage.getItem(ownedKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Overrides Management
// ---------------------------------------------------------------------------

export function getGlobalOverrides(): Record<string, StationOverrides> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setStationOverride(stationId: string, overrides: StationOverrides): void {
  if (typeof window === "undefined") return;
  const allOverrides = getGlobalOverrides();
  allOverrides[stationId] = {
    ...(allOverrides[stationId] || {}),
    ...overrides
  };
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(allOverrides));
}

export function getStationOverrides(stationId: string): StationOverrides | null {
  const allOverrides = getGlobalOverrides();
  return allOverrides[stationId] || null;
}

// ---------------------------------------------------------------------------
// Custom Stations Management
// ---------------------------------------------------------------------------

export function getCustomStations(): Station[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_STATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addCustomStation(station: Station, ownerEmail: string): void {
  if (typeof window === "undefined") return;
  const all = getCustomStations();
  all.push(station);
  localStorage.setItem(CUSTOM_STATIONS_KEY, JSON.stringify(all));

  // A custom station is instantly claimed by the creator
  claimStation(station.id, ownerEmail);
}

export function editCustomStation(stationId: string, updates: Partial<Station>): void {
  if (typeof window === "undefined") return;
  const all = getCustomStations();
  const idx = all.findIndex(s => s.id === stationId);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates };
    localStorage.setItem(CUSTOM_STATIONS_KEY, JSON.stringify(all));
  }
}

export function deleteCustomStation(stationId: string, email: string): void {
  if (typeof window === "undefined") return;
  const all = getCustomStations().filter(s => s.id !== stationId);
  localStorage.setItem(CUSTOM_STATIONS_KEY, JSON.stringify(all));
  
  // Clean up claims and ownership
  releaseStation(stationId, email);
}
