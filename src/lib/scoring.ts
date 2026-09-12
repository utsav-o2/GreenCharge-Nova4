import {
  RankedStation,
  EnergyMixRow,
  GridConditionRow,
  VehicleProfile,
  StationScore,
} from './types';

// Normalize a value to 0-1 given min and max (higher = better)
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// Normalize inversely (lower value = better score)
function normalizeInverse(value: number, min: number, max: number): number {
  return 1 - normalize(value, min, max);
}

export function scoreStations(
  stations: RankedStation[],
  energyMix: EnergyMixRow[],
  gridConditions: GridConditionRow[],
  vehicle: VehicleProfile,
  currentPct: number
): StationScore[] {
  const currentHour = new Date().getHours();

  // Find best hour from now onward (highest renewable + lowest grid load combined)
  const futureHours = energyMix.filter((r) => r.hour >= currentHour);
  const bestHourData = futureHours.reduce((best, row) => {
    const gridRow = gridConditions.find((g) => g.hour === row.hour);
    const score =
      row.renewable_pct / 100 + (gridRow ? 1 - gridRow.load_pct / 100 : 0);
    const bestGridRow = gridConditions.find((g) => g.hour === best.hour);
    const bestScore =
      best.renewable_pct / 100 +
      (bestGridRow ? 1 - bestGridRow.load_pct / 100 : 0);
    return score > bestScore ? row : best;
  }, futureHours[0]);

  const bestHour = bestHourData?.hour ?? currentHour;
  const bestEnergyMixRow =
    energyMix.find((r) => r.hour === bestHour) ?? energyMix[currentHour];
  const bestGridRow =
    gridConditions.find((r) => r.hour === bestHour) ??
    gridConditions[currentHour];

  // Ranges for normalization
  const distances = stations.map((s) => s.distance_km);
  const minDist = Math.min(...distances);
  const maxDist = Math.max(...distances);
  const prices = stations.map((s) => s.price_per_kwh);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const requiredKwh =
    ((vehicle.target_pct - currentPct) / 100) * vehicle.battery_kwh;
  const baselinePrice = maxPrice; // worst-case price for savings calc

  return stations.map((station, i) => {
    const distance = distances[i];

    // Sub-scores (each 0-1, higher = better)
    const requirementMatch =
      station.status !== 'offline' && station.status !== 'full' ? 1 : 0.1;

    const renewable = normalize(
      bestEnergyMixRow?.renewable_pct ?? station.renewable_pct,
      20,
      90
    );

    const gridCondition = normalizeInverse(
      bestGridRow?.load_pct ?? 50,
      27,
      95
    );

    const cost = normalizeInverse(station.price_per_kwh, minPrice, maxPrice);

    const distScore = normalizeInverse(distance, minDist, maxDist);

    const availability =
      station.chargers_total > 0
        ? station.chargers_available / station.chargers_total
        : 0;

    // Weighted total
    const totalScore =
      requirementMatch * 0.3 +
      renewable * 0.2 +
      gridCondition * 0.15 +
      cost * 0.15 +
      distScore * 0.1 +
      availability * 0.1;

    const estimatedCost = Math.round(requiredKwh * station.price_per_kwh);
    const baselineCost = Math.round(requiredKwh * baselinePrice);
    const savingsVsBaseline = baselineCost - estimatedCost;

    return {
      station,
      totalScore: Math.round(totalScore * 100),
      subscores: {
        requirementMatch: Math.round(requirementMatch * 100),
        renewable: Math.round(renewable * 100),
        gridCondition: Math.round(gridCondition * 100),
        cost: Math.round(cost * 100),
        distance: Math.round(distScore * 100),
        availability: Math.round(availability * 100),
      },
      distance_km: distance,
      bestHour,
      estimatedCost,
      savingsVsBaseline,
    };
  }).sort((a, b) => b.totalScore - a.totalScore);
}

export function getBestTimeLabel(bestHour: number): string {
  const currentHour = new Date().getHours();
  if (bestHour === currentHour) return 'Charge now';
  const diff = bestHour - currentHour;
  const h = Math.floor(diff);
  const m = Math.round((diff - h) * 60);
  const ampm = bestHour >= 12 ? 'PM' : 'AM';
  const displayHour = bestHour > 12 ? bestHour - 12 : bestHour === 0 ? 12 : bestHour;
  const timeStr = `${displayHour}:00 ${ampm}`;
  const diffStr = h > 0 ? (m > 0 ? `in ${h}h ${m}m` : `in ${h}h`) : `in ${m}m`;
  return `Best time: ${timeStr} (${diffStr})`;
}

export function computeEcoCoins(sessions: { cost: number; renewable_pct: number }[]): number {
  return sessions.reduce((total, s) => {
    const baseline = s.cost * 1.2; // assume 20% more without optimization
    const saved = Math.max(0, baseline - s.cost);
    return total + Math.round(saved / 10);
  }, 0);
}

export function computeGreenScore(sessions: { renewable_pct: number }[]): number {
  if (sessions.length === 0) return 0;
  const avgRenewable =
    sessions.reduce((sum, s) => sum + s.renewable_pct, 0) / sessions.length;
  // Scale: 100% renewable = 100 score, 0% = 0
  return Math.min(100, Math.round(avgRenewable));
}

export function computeRequiredKwh(vehicle: VehicleProfile, currentPct: number): number {
  const diff = Math.max(0, vehicle.target_pct - currentPct);
  return Math.round((diff / 100) * vehicle.battery_kwh * 10) / 10;
}

export function computeCO2Avoided(sessions: { renewable_pct: number; energy_kwh: number }[]): number {
  // Average India grid emission factor: ~0.7 kg CO2/kWh
  return sessions.reduce((sum, s) => {
    return sum + (s.renewable_pct / 100) * s.energy_kwh * 0.7;
  }, 0);
}

export function computeSuggestedPrice(renewable_pct: number, load_pct: number): number {
  // Higher renewable + lower load = lower price
  // Base range: ₹10 (best) to ₹20 (worst)
  const renewableBonus = (renewable_pct / 100) * 5;   // up to -5
  const loadPenalty = (load_pct / 100) * 5;            // up to +5
  return Math.round((15 - renewableBonus + loadPenalty) * 10) / 10;
}
