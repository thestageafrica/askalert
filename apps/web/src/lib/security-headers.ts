/** Shared security headers for AskAlert web (Vercel / Next.js). */

export function buildContentSecurityPolicy(): string {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://wa.me",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // Next.js + Tailwind may emit inline styles (e.g. progress width).
    "style-src 'self' 'unsafe-inline'",
    // Next.js App Router bootstrap; Serwist service worker scripts.
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
    "worker-src 'self' blob:",
    "connect-src 'self' https:",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
  ];
  return directives.join('; ');
}

export const securityHeaders: Array<{ key: string; value: string }> = [
  { key: 'Content-Security-Policy', value: buildContentSecurityPolicy() },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
];
