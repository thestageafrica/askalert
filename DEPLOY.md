# Deploy AskAlert (Phase 1) — Cloudflare Pages

AskAlert is a pnpm + Turborepo monorepo. Production uses **two Cloudflare Pages projects** from the same Git repository as **static exports** (`next export` / `output: 'export'`). There is no Node server at runtime.

| Project | Root Directory | Build command | Output directory |
| --- | --- | --- | --- |
| Web | `apps/web` | `cd ../.. && pnpm install && pnpm turbo run build --filter=@askalert/web` | `out` |
| Admin | `apps/admin` | `cd ../.. && pnpm install && pnpm turbo run build --filter=@askalert/admin` | `out` |

Framework preset: **None** (or static assets). Cloudflare serves the `out/` folder.

## Environment variables

Set these on each Pages project (Production + Preview):

### Web (`askalert.com` / `www.askalert.com`)

| Name | Example | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://www.askalert.com` | No trailing slash. Never a `*.vercel.app` or `*.pages.dev` placeholder once the custom domain is live. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `2348026047303` | Digits only. Placeholder `2348000000000` fails the production build. |
| `NEXT_PUBLIC_USE_SUPABASE` | `false` | `true` only after Supabase is seeded. |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://….supabase.co` | Required when Supabase is on. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `…` | Public anon key (RLS-protected). |

### Admin (`admin.askalert.com`)

| Name | Example | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://admin.askalert.com` | Admin public URL. |
| `NEXT_PUBLIC_USE_SUPABASE` | `false` | Same flag pattern as web. |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://….supabase.co` | When Supabase is on. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `…` | Browser client only on static hosting. |

**Do not** put `SUPABASE_SERVICE_ROLE_KEY` in Pages env for these static apps. Service-role writes belong on a trusted Worker later.

## Cloudflare Access (admin)

HTTP Basic Auth middleware is removed. Protect the admin hostname with **Cloudflare Access** (Zero Trust):

1. Zero Trust → Access → Applications → Add application → Self-hosted
2. Application domain: `admin.askalert.com`
3. Policy: allow your team email addresses (Google / one-time PIN / etc.)
4. Confirm the free plan covers your small team before relying on it commercially

Admin `robots.txt` still disallows all crawlers. `_headers` also sends `X-Robots-Tag: noindex, nofollow`.

## Domains

1. Add `askalert.com` and `www.askalert.com` to the **web** Pages project.
2. Add `admin.askalert.com` to the **admin** Pages project.
3. Follow Cloudflare DNS instructions for your registrar (or move DNS to Cloudflare).
4. Update `NEXT_PUBLIC_SITE_URL` on each project, then redeploy.
5. Only after phone testing looks good, turn off any old Vercel project.

## What ships as static files

- `public/_headers` — CSP and browser hardening, long cache for `/_next/static`, brand, icons
- `public/_redirects` — SPA-style 200 rewrites for dynamic `/app/*` (web) and `/categories/*` (admin) shells
- `public/health.json` — `{ "ok": true }` for uptime checks (replaces `/api/health`)
- `public/og.png` / `public/twitter-og.png` — static Open Graph images (web)
- `public/sw.js` — Serwist service worker (web PWA + offline `/offline/`)

## Local production check

```powershell
# From repo root — needs real-looking env (see apps/web/.env.local)
pnpm --filter @askalert/web build
pnpm --filter @askalert/admin build

# Serve the static folders (no Next server)
npx --yes serve apps/web/out -l 3000
npx --yes serve apps/admin/out -l 3001
```

Smoke-test:

- `http://localhost:3000/` landing
- `http://localhost:3000/app/` app shell
- `http://localhost:3000/offline/` offline page
- `http://localhost:3000/health.json`
- DevTools → Application → Service Worker registered; Network offline → `/offline/` fallback
- `http://localhost:3001/` admin shell (Access is Cloudflare-only)

## Supabase (optional, Phase 1B)

Same as before: link project, `pnpm db:push`, `pnpm db:seed`, then set `NEXT_PUBLIC_USE_SUPABASE=true` on Pages. Web reads public categories with the anon key. Admin publish also uses the anon key on static hosting — RLS must allow those writes, or keep Supabase off until a Worker holds the service role.

## Optional: Vercel

Vercel is **not** required. If you keep a Vercel project temporarily:

- Root Directory still `apps/web` / `apps/admin`
- Build must produce `out/` (already configured via `output: 'export'`)
- Prefer Cloudflare for free static hosting going forward

## Checklist

- [ ] Web Pages project builds `out/`
- [ ] Admin Pages project builds `out/`
- [ ] Custom domains on Cloudflare
- [ ] Admin behind Cloudflare Access
- [ ] WhatsApp CTAs use the real number
- [ ] OG preview shows `askalert.com` (not a preview hostname)
- [ ] Offline / PWA works on a phone
- [ ] Old Vercel deployment disabled after cutover
