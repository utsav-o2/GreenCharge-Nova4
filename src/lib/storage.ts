import { UserProfile, VehicleProfile } from './types';

const USER_KEY = 'greencharge_user';
const VEHICLE_KEY = 'greencharge_vehicle';
const SESSIONS_KEY = 'greencharge_sessions';
const BOOKING_KEY = 'greencharge_booking';
const ECOCOINS_KEY = 'greencharge_ecocoins';

// --- User ---
export function getUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUser(user: UserProfile): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(VEHICLE_KEY);
  localStorage.removeItem(SESSIONS_KEY);
  localStorage.removeItem(BOOKING_KEY);
  localStorage.removeItem(ECOCOINS_KEY);
}

// --- Vehicle ---
export function getVehicle(): VehicleProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(VEHICLE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setVehicle(vehicle: VehicleProfile): void {
  localStorage.setItem(VEHICLE_KEY, JSON.stringify(vehicle));
}

// --- Booking ---
export function setBooking(booking: object): void {
  localStorage.setItem(BOOKING_KEY, JSON.stringify(booking));
}

export function getBooking(): object | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BOOKING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// --- Sessions ---
export function getLocalSessions(): object[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addLocalSession(session: object): void {
  const existing = getLocalSessions();
  localStorage.setItem(SESSIONS_KEY, JSON.stringify([...existing, session]));
}

// --- EcoCoins ---
export function getEcoCoins(): number {
  if (typeof window === 'undefined') return 220;
  const val = localStorage.getItem(ECOCOINS_KEY);
  return val ? parseInt(val, 10) : 220;
}

export function addEcoCoins(amount: number): void {
  const current = getEcoCoins();
  localStorage.setItem(ECOCOINS_KEY, String(current + amount));
}

export function getGreeting(name: string): string {
  const hour = new Date().getHours();
  let period: string;
  if (hour >= 5 && hour < 12) period = 'morning';
  else if (hour >= 12 && hour < 17) period = 'afternoon';
  else if (hour >= 17 && hour < 21) period = 'evening';
  else period = 'night';
  return `Good ${period}, ${name.split(' ')[0]}`;
}
