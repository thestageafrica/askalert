const COOLDOWN_MS = 60_000;
const STORAGE_PREFIX = 'askalert.auth.resend.';

export function resendCooldownRemaining(email: string, now = Date.now()): number {
  if (typeof window === 'undefined' || !email) {
    return 0;
  }
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${email.toLowerCase()}`);
    if (!raw) {
      return 0;
    }
    const until = Number(raw);
    if (!Number.isFinite(until)) {
      return 0;
    }
    return Math.max(0, until - now);
  } catch {
    return 0;
  }
}

export function markResendSent(email: string, now = Date.now()): void {
  if (typeof window === 'undefined' || !email) {
    return;
  }
  window.localStorage.setItem(`${STORAGE_PREFIX}${email.toLowerCase()}`, String(now + COOLDOWN_MS));
}

export function formatCooldown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) {
    return `${seconds}s`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export { COOLDOWN_MS };
