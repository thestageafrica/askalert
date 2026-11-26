export const ADMIN_IDLE_MS = 30 * 60 * 1000;
export const ADMIN_IDLE_STORAGE_KEY = 'askalert.admin.lastActivity';
export const ADMIN_SIGNIN_ATTEMPTS_KEY = 'askalert.admin.signin.attempts';

export function touchAdminActivity(now = Date.now()) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(ADMIN_IDLE_STORAGE_KEY, String(now));
}

export function readAdminLastActivity(): number {
  if (typeof window === 'undefined') {
    return Date.now();
  }
  const raw = window.localStorage.getItem(ADMIN_IDLE_STORAGE_KEY);
  const value = raw ? Number(raw) : NaN;
  return Number.isFinite(value) ? value : Date.now();
}

export function isAdminIdle(now = Date.now(), idleMs = ADMIN_IDLE_MS): boolean {
  return now - readAdminLastActivity() > idleMs;
}
