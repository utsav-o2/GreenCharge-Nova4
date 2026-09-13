"use client";
import { Station } from "./types";
import { getStationOverrides, getCustomStations } from "./stations-overlay";

/**
 * Fetches the full dataset from the backend, maps it (which applies overrides),
 * and merges it with any custom stations added by operators.
 * This guarantees a unified, globally consistent view of all stations.
 */
export async function fetchAllStations(): Promise<Station[]> {
  try {
    // 1. Fetch real dataset from static JSON
    const res = await fetch("/data/stations_full.json");
    const json = await res.json();
    
    // 2. Map to apply the override layer directly
    let stations: Station[] = Array.isArray(json) ? json.map(s => {
      const overrides = getStationOverrides(s.id);
      return overrides ? { ...s, ...overrides } : s;
    }) : [];
    
    // 3. Append custom stations (which are completely authored by operators)
    const custom = getCustomStations();
    if (custom.length > 0) {
      stations = [...stations, ...custom];
    }
    
    return stations;
  } catch (error) {
    console.error("Failed to fetch stations:", error);
    return [];
  }
}
