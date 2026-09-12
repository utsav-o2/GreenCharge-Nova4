/**
 * lib/auth.ts
 *
 * Central authentication module for GreenCharge.
 * Uses localStorage as a mock database so it can be swapped for a real
 * auth/DB layer later — just replace the localStorage calls with API calls.
 *
 * Storage keys:
 *   "greencharge_users"        — permanent array of all registered accounts
 *   "greencharge_current_user" — the logged-in session (cleared on logout)
 */

const USERS_KEY = 'greencharge_users';
const CURRENT_USER_KEY = 'greencharge_current_user';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StoredUser {
  name: string;
  email: string;
  password: string;
  role: 'driver' | 'operator';
}

export interface CurrentUser {
  name: string;
  email: string;
  role: 'driver' | 'operator';
}

export interface AuthResult {
  success: boolean;
  message: string;
}

// ---------------------------------------------------------------------------
// 1. Email validation — only @gmail.com and @yahoo.com
// ---------------------------------------------------------------------------

export function isValidEmail(email: string): boolean {
  const lower = email.toLowerCase().trim();
  return lower.endsWith('@gmail.com') || lower.endsWith('@yahoo.com');
}

// ---------------------------------------------------------------------------
// 2. User registry (permanent list of all accounts)
// ---------------------------------------------------------------------------

export function getAllUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function saveAllUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ---------------------------------------------------------------------------
// 3. Signup
// ---------------------------------------------------------------------------

export function signup(
  name: string,
  email: string,
  password: string,
  role: 'driver' | 'operator'
): AuthResult {
  if (!isValidEmail(email)) {
    return { success: false, message: 'Please use a Gmail or Yahoo email address.' };
  }

  const users = getAllUsers();
  const emailLower = email.toLowerCase().trim();

  if (users.some((u) => u.email.toLowerCase() === emailLower)) {
    return {
      success: false,
      message: 'An account with this email already exists. Please log in instead.',
    };
  }

  const newUser: StoredUser = { name: name.trim(), email: emailLower, password, role };
  saveAllUsers([...users, newUser]);

  // Log the new user in immediately
  const session: CurrentUser = { name: newUser.name, email: emailLower, role };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));

  return { success: true, message: 'Account created!' };
}

// ---------------------------------------------------------------------------
// 4. Login
// ---------------------------------------------------------------------------

export function login(email: string, password: string): AuthResult {
  if (!isValidEmail(email)) {
    return { success: false, message: 'Please use a Gmail or Yahoo email address.' };
  }

  const emailLower = email.toLowerCase().trim();
  const users = getAllUsers();
  const found = users.find((u) => u.email.toLowerCase() === emailLower);

  if (!found) {
    return { success: false, message: 'Account not found. Please sign up first.' };
  }

  if (found.password !== password) {
    return { success: false, message: 'Incorrect password.' };
  }

  const session: CurrentUser = { name: found.name, email: emailLower, role: found.role };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));

  return { success: true, message: 'Welcome back!' };
}

// ---------------------------------------------------------------------------
// 5. Logout — clears session only; never removes the user registry
// ---------------------------------------------------------------------------

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CURRENT_USER_KEY);
}

// ---------------------------------------------------------------------------
// 6. Get the currently logged-in user (or null)
// ---------------------------------------------------------------------------

export function getCurrentUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 7. Namespaced storage key helper
//    Usage: getUserKey('greencharge_vehicle') → 'greencharge_vehicle_user@gmail.com'
//    Returns null if no user is logged in (caller should redirect to /login).
// ---------------------------------------------------------------------------

export function getUserKey(baseKey: string): string | null {
  const user = getCurrentUser();
  if (!user) return null;
  return `${baseKey}_${user.email}`;
}
