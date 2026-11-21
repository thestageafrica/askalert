# Deploy AskAlert (Phase 1)

## Live deployments (CLI)

| App | Production URL |
| --- | --- |
| Web | https://askalert-web.vercel.app |
| Admin | https://askalert-admin.vercel.app |

Admin Basic Auth (change in the Vercel dashboard when you can): username `admin`. Password is stored only in Vercel env `ADMIN_BASIC_PASSWORD` — do not commit it.

**Security:** never put Vercel tokens or passwords in this file. Use `vercel login` or a local env var `VERCEL_TOKEN`.

**GitHub:** connect the Vercel account to GitHub (`thestageafrica/askalert`) so future pushes auto-deploy. Until then, deploy from the repo root with the CLI.

AskAlert is a pnpm + Turborepo monorepo. Production uses **two Vercel projects** from the same Git repository:

| Project | Root Directory | Purpose |
| --- | --- | --- |
| Web | `apps/web` | Marketing site, PWA, `/app` mock shell |
| Admin | `apps/admin` | Operations console (HTTP Basic Auth) |

Framework for both: **Next.js** (App Router).

## Manual Vercel setup

### 1. Web project

1. In Vercel: **Add New → Project** and import the AskAlert repository.
2. Set **Root Directory** to `apps/web`.
3. Framework Preset: Next.js (auto-detected).
4. Install command (monorepo): leave Vercel’s default, or use:
   ```bash
   pnpm install
   ```
5. Build settings (Root Directory `apps/web`):
   ```bash
   # Install Command
   cd ../.. && pnpm install
   # Build Command (builds workspace packages first)
   cd ../.. && pnpm turbo run build --filter=@askalert/web
   ```
6. Add environment variables (Production + Preview):

| Name | Example | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://askalert.com` | No trailing slash. Use the Vercel URL until the domain is connected. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `2348012345678` | International digits only — **no** `+` or spaces. |

7. Deploy. Confirm:
   - `https://<web>/` loads the landing page
   - `https://<web>/app` loads the app shell
   - `https://<web>/api/health` returns `{ "ok": true, ... }`
   - `https://<web>/robots.txt` allows crawling and points at the sitemap
   - `https://<web>/sitemap.xml` lists public pages

### 2. Admin project

1. **Add New → Project** again from the **same** repository.
2. Set **Root Directory** to `apps/admin`.
3. Add environment variables:

| Name | Example | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://admin.askalert.com` | Admin URL, no trailing slash. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `2348012345678` | Optional; same format as web. |
| `ADMIN_BASIC_USER` | `ops` | Required. HTTP Basic Auth username. |
| `ADMIN_BASIC_PASSWORD` | *(long random secret)* | Required. Never commit this value. |

4. Deploy. Confirm:
   - Visiting the admin URL prompts for a username/password
   - Wrong credentials are rejected
   - `https://<admin>/api/health` is reachable **without** auth (for uptime checks)
   - `https://<admin>/robots.txt` disallows all crawlers

### 3. Domains (later)

- Point the main domain (for example `askalert.com`) at the **web** project.
- Point `admin.` (for example `admin.askalert.com`) at the **admin** project.
- Update `NEXT_PUBLIC_SITE_URL` on each project to match the final HTTPS URLs, then redeploy.

## Supabase (Phase 1B categories)

Create a Supabase project (pick a region close to Lagos users, for example `eu-west-1` or `eu-central-1`). Put keys only in `.env.local` and Vercel env — never in chat or git.

| Name | Where | Notes |
| --- | --- | --- |
| `USE_SUPABASE` / `NEXT_PUBLIC_USE_SUPABASE` | Web + Admin | `true` to load categories from Supabase; `false` (default) keeps mock seeds |
| `NEXT_PUBLIC_SUPABASE_URL` | Web + Admin | Project URL from Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web + Admin | Anon/public key (RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Admin only** | Server-side writes. Never expose to the browser or `NEXT_PUBLIC_*` |

### Apply migrations and seed

From the repo root (after `npx supabase login`):

```powershell
# Link once (use your project ref from the Supabase dashboard URL)
npx supabase link --project-ref YOUR_PROJECT_REF

# Push schema + RLS
npx supabase db push

# Load Lagos areas + nine category seeds
npx supabase db query --linked -f supabase/seed.sql
```

To regenerate `supabase/seed.sql` from `packages/category-engine` JSON seeds:

```powershell
node scripts/generate-seed.mjs
```

Then set `NEXT_PUBLIC_USE_SUPABASE=true` (and the keys above) on Vercel for both projects, set `SUPABASE_SERVICE_ROLE_KEY` on **admin only**, and redeploy. Publish a category in admin; it should appear on web `/app` when status is `pilot` or `live`.

## Security headers

Both apps send:

- `Content-Security-Policy` (see `apps/*/src/lib/security-headers.ts`)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy` (camera, mic, geolocation, payment disabled)

`X-Powered-By` is disabled.

## Local production check

From the repo root:

```powershell
pnpm --filter @askalert/web build
pnpm --filter @askalert/web start
```

```powershell
pnpm --filter @askalert/admin build
pnpm --filter @askalert/admin start
```

Copy each app’s `.env.example` to `.env.local` before building if you need custom values.

## Lighthouse

After deploy (or against local `next start`):

1. Chrome DevTools → Lighthouse
2. Run on the **landing page** (`/`) and **`/app`**
3. Target **90+** for Performance, Accessibility, Best Practices, and SEO
4. Prefer mobile profile for `/app`

Common fixes if a score dips under 90:

- Compress hero imagery / keep brand PNGs reasonably sized
- Keep the LCP text/hero simple above the fold
- Ensure every image has width/height or CSS sizing
- Confirm `NEXT_PUBLIC_SITE_URL` is HTTPS in production (SEO / OG)

## Optional: Vercel Analytics

Not installed by default (keeps the dependency surface small).

If you enable it later:

1. In the Vercel project: **Analytics → Enable**
2. Add `@vercel/analytics` to the app and render `<Analytics />` in the root layout
3. Set `NEXT_PUBLIC_VERCEL_ANALYTICS=1` if you gate the component behind a flag

**What it collects (high level):** anonymized page views, performance Web Vitals, and route information. It does **not** replace a full product analytics suite and should not include secrets or PII in URLs.

See [Vercel Analytics docs](https://vercel.com/docs/analytics).

## Health checks

| App | Path | Auth |
| --- | --- | --- |
| Web | `/api/health` | None |
| Admin | `/api/health` | None (explicitly excluded from Basic Auth) |

Use these endpoints for Vercel or external uptime monitors.

## Monorepo notes

- Packages live under `packages/*` and are consumed via `workspace:*`.
- Vercel should detect pnpm from the root lockfile when Root Directory is set to an app.
- If install fails, set the Vercel **Install Command** to `cd ../.. && pnpm install` only when support docs for your Vercel version require it; usually Root Directory + pnpm is enough.

## Checklist before calling Phase 1 done

- [x] Web loads over HTTPS (`https://www.askalert.com`)
- [x] Admin asks for Basic Auth (`https://admin.askalert.com`)
- [x] `/api/health` OK on both
- [x] GitHub connected; pushes auto-deploy both projects
- [ ] WhatsApp CTAs open the correct `wa.me` number (replace placeholder `2348000000000`)
- [x] Lighthouse (Incognito, after Perf passes)
  - `/` → Perf **89** / A11y 100 / BP 100 / SEO 100 (1pt under 90; Lighthouse also warned IndexedDB/PWA storage noise)
  - `/app` → Perf **95** / A11y 94 / BP 100 / SEO 100
  - Accepted for Phase 1: `/app` clears 90; landing is effectively at target given storage warning
- [ ] Revoke any Vercel token that was shared outside the dashboard
- [x] Secrets only in Vercel env — never in git
- [ ] Supabase linked, migrations pushed, seed loaded
- [ ] `USE_SUPABASE=true` only after seed; mock fallback works when false
