import { Station as FrontendStation } from './types';

export function mapDbToFrontend(dbStation: any): FrontendStation {
  return {
    id: dbStation.stationId,
    name: dbStation.name,
    address: `${dbStation.city}, ${dbStation.state}`,
    city: dbStation.city,
    lat: dbStation.latitude,
    lng: dbStation.longitude,
    chargers_available: dbStation.totalBays > 0 && dbStation.needsReview === false ? dbStation.totalBays - 1 : 0,
    chargers_total: dbStation.totalBays,
    connector_types: [dbStation.connectorType],
    price_per_kwh: 15, // Default price since CSV doesn't have it
    renewable_pct: 50, // Default renewable pct
    status: dbStation.needsReview ? 'offline' : 'available',
    operator: dbStation.operator,
    max_power_kw: dbStation.powerKw,
  };
}
