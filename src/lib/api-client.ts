"use client";
import { Station } from "./types";
import { mapDbToFrontend } from "./db-to-frontend";
import { getCustomStations } from "./stations-overlay";

/**
 * Fetches the full dataset from the backend, maps it (which applies overrides),
 * and merges it with any custom stations added by operators.
 * This guarantees a unified, globally consistent view of all stations.
 */
export async function fetchAllStations(): Promise<Station[]> {
  try {
    // 1. Fetch real dataset from API (high pageSize to ensure we get all)
    const res = await fetch("/api/stations?pageSize=2000");
    const json = await res.json();
    
    // 2. Map through mapDbToFrontend which applies the override layer
    let stations: Station[] = json.data ? json.data.map(mapDbToFrontend) : [];
    
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
