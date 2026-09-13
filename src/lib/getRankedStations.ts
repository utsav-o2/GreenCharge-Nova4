import { RankedStation } from "./types";
import { fetchAllStations } from "./api-client";
import { getSettings } from "./storage";
import { getUserLocation } from "./location";
import { haversineDistance, DEMO_USER_LAT, DEMO_USER_LNG } from "./distance";

export async function getRankedStations(): Promise<{ stations: RankedStation[], userLoc: {lat: number, lng: number} | null }> {
  const settings = getSettings();
  
  const [rawStations, userLoc] = await Promise.all([
    fetchAllStations(),
    settings.locationServices ? getUserLocation() : Promise.resolve(null),
  ]);

  const lat = userLoc?.lat ?? DEMO_USER_LAT;
  const lng = userLoc?.lng ?? DEMO_USER_LNG;

  const ranked: RankedStation[] = rawStations.map((s: any) => ({
    ...s,
    distance_km: Math.round(haversineDistance(lat, lng, s.lat, s.lng) * 10) / 10,
  }));

  ranked.sort((a, b) => a.distance_km - b.distance_km);

  return { stations: ranked, userLoc };
}
