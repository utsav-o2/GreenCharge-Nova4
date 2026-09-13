/**
 * lib/storage.ts
 *
 * All data access goes through getUserKey() so every value is namespaced to
 * the currently-logged-in user's email. Switching accounts on the same browser
 * always loads the correct person's data.
 *
 * Keys written to localStorage:
 *   greencharge_vehicle_{email}   → VehicleProfile object
 *   greencharge_sessions_{email}  → Session[]
 *   greencharge_booking_{email}   → Booking object
 *   greencharge_ecocoins_{email}  → number (coin balance)
 *
 * The user registry ("greencharge_users") and the session key
 * ("greencharge_current_user") are managed in lib/auth.ts.
 *
 * Legacy getUser/setUser/clearUser shims are kept so existing imports don't
 * break — they delegate to lib/auth.ts.
 */

import { UserProfile, VehicleProfile } from './types';
import { getCurrentUser, logout, getUserKey } from './auth';

// ---------------------------------------------------------------------------
// Legacy shims — keeps existing code from breaking during migration
// ---------------------------------------------------------------------------

/** @deprecated Use getCurrentUser() from lib/auth.ts */
export function getUser(): UserProfile | null {
  return getCurrentUser();
}

/** @deprecated Account creation is now handled by signup() in lib/auth.ts */
export function setUser(_user: UserProfile): void {
  // no-op — accounts are created via auth.signup(); session via auth.login()
}

/** @deprecated Use logout() from lib/auth.ts */
export function clearUser(): void {
  logout();
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function readKey<T>(baseKey: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const key = getUserKey(baseKey);
  if (!key) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeKey<T>(baseKey: string, value: T): void {
  const key = getUserKey(baseKey);
  if (!key) return; // no user logged in — caller should have checked
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------------------------------------------------------------------------
// Vehicle
// ---------------------------------------------------------------------------

const VEHICLE_BASE = 'greencharge_vehicle';

export function getVehicle(): VehicleProfile | null {
  return readKey<VehicleProfile | null>(VEHICLE_BASE, null);
}

export function setVehicle(vehicle: VehicleProfile): void {
  writeKey(VEHICLE_BASE, vehicle);
}

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------

const BOOKING_BASE = 'greencharge_booking';

export function setBooking(booking: object): void {
  writeKey(BOOKING_BASE, booking);
}

export function getBooking(): object | null {
  return readKey<object | null>(BOOKING_BASE, null);
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

const SESSIONS_BASE = 'greencharge_sessions';

export function getLocalSessions(): object[] {
  return readKey<object[]>(SESSIONS_BASE, []);
}

export function addLocalSession(session: object): void {
  const existing = getLocalSessions();
  writeKey(SESSIONS_BASE, [...existing, session]);
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface UserSettings {
  notifications: boolean;
  locationServices: boolean;
  dataPrivacy: boolean;
}

const SETTINGS_BASE = 'greencharge_settings';

export function getSettings(): UserSettings {
  return readKey<UserSettings>(SETTINGS_BASE, {
    notifications: true,
    locationServices: true,
    dataPrivacy: true
  });
}

export function updateSettings(updates: Partial<UserSettings>): void {
  const current = getSettings();
  writeKey(SETTINGS_BASE, { ...current, ...updates });
}

const ECOCOINS_BASE = 'greencharge_ecocoins';

export function getEcoCoins(): number {
  // Default starting balance for a new account is 0; 220 was a shared demo seed.
  return readKey<number>(ECOCOINS_BASE, 0);
}

export function addEcoCoins(amount: number): void {
  const current = getEcoCoins();
  writeKey(ECOCOINS_BASE, current + amount);
}

// ---------------------------------------------------------------------------
// Greeting helper (stateless — no storage needed)
// ---------------------------------------------------------------------------

export function getGreeting(name: string): string {
  const hour = new Date().getHours();
  let period: string;
  if (hour >= 5 && hour < 12) period = 'morning';
  else if (hour >= 12 && hour < 17) period = 'afternoon';
  else period = 'evening'; // covers 17:00 through 4:59
  return `Good ${period}, ${name.split(' ')[0]}`;
}
