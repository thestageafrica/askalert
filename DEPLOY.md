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
| Auth emails | Resend SMTP | Configure in Supabase Auth — see `docs/AUTH.md`. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `B…` | Public half of VAPID pair for web push. |

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

## Supabase free plan (Prompt 15)

Region for this project: **eu-west-1** (`krrvatcjgytdbsiyvqyh`). Prefer staying on free until the first real escrow hold, then upgrade to Pro.

### Apply schema + seed

```powershell
pnpm db:push
pnpm db:seed
```

Enable Dashboard extensions if a migration notices them missing: **pgmq**, **pg_cron**, **pg_net**.

### Edge Functions

```powershell
npx supabase functions deploy ingest-webhook
npx supabase functions deploy process-jobs
npx supabase functions deploy send-push
npx supabase secrets set WEBHOOK_SHARED_SECRET=… CRON_SHARED_SECRET=…
```

### Web push (Prompt 17)

Generate VAPID keys locally (do not commit them):

```powershell
npx --yes web-push generate-vapid-keys
```

Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` on Cloudflare Pages (web). Set Edge secrets:

```powershell
npx supabase secrets set VAPID_PUBLIC_KEY=… VAPID_PRIVATE_KEY=… VAPID_SUBJECT=mailto:ops@askalert.com
```

`send-push` uses the npm `web-push` library (via esm.sh) because it speaks the standard VAPID Web Push protocol without Firebase. Gone subscriptions (HTTP 404/410) are deleted; other failures increment `failed_count`.

Email fallback for important events (`quotes_ready`, `booking_confirmed`) uses a **Resend** interface (`ResendEmailProvider`) — free tier, secret `RESEND_API_KEY` only on Edge.

Point the Worker `SUPABASE_FUNCTION_URL` at:

`https://<project-ref>.supabase.co/functions/v1/ingest-webhook`

Configure cron HTTP target (service role / SQL editor):

```sql
insert into public.app_runtime_config (key, value) values
  ('functions_base_url', 'https://<project-ref>.supabase.co/functions/v1'),
  ('cron_shared_secret', '<same as CRON_SHARED_SECRET>')
on conflict (key) do update set value = excluded.value;
```

### Feature flag

Set on Pages (and local `.env.local`) when ready:

- `NEXT_PUBLIC_USE_SUPABASE=true`
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Leave `false` to keep mock category seeds for local development. Admin dashboard shows a **Database size** card from `db_size_snapshots` when Supabase is on.

### Backups + keep-alive (GitHub Actions)

- `.github/workflows/supabase-backup.yml` — nightly encrypted `pg_dump`
- `.github/workflows/supabase-keepalive.yml` — daily health ping
- Restore guide: `docs/supabase-backup-restore.md`

Required repo secrets: `SUPABASE_DB_URL_READONLY`, `BACKUP_GPG_PASSPHRASE`. Optional: `SUPABASE_SCRATCH_DB_URL`, `KEEPALIVE_HEALTH_URL`, S3 upload keys.

### Upgrade triggers

Upgrade to **Supabase Pro** at the **first real escrow hold** for:

- Daily managed backups
- No free-plan pausing
- Headroom for DB size / Edge invocations

Until then: watch DB size (warn at 350 MB), Worker requests/day, Edge Function invocations, and egress weekly.

## Webhook Worker (`apps/edge-webhooks`)

Single Cloudflare Worker front door for WhatsApp and Paystack webhooks.

| Item | Value |
| --- | --- |
| App | `apps/edge-webhooks` |
| Config | `wrangler.toml` |
| Routes | `GET/POST /whatsapp`, `POST /paystack`, `GET /health` |

### Deploy

```powershell
cd apps/edge-webhooks
pnpm exec wrangler login
pnpm exec wrangler deploy
```

Or from the repo root:

```powershell
pnpm --filter @askalert/edge-webhooks deploy
```

### Secrets (never commit)

Set each secret with Wrangler (prompts for the value):

```powershell
pnpm --filter @askalert/edge-webhooks exec wrangler secret put WHATSAPP_VERIFY_TOKEN
pnpm --filter @askalert/edge-webhooks exec wrangler secret put WHATSAPP_APP_SECRET
pnpm --filter @askalert/edge-webhooks exec wrangler secret put PAYSTACK_SECRET
pnpm --filter @askalert/edge-webhooks exec wrangler secret put WEBHOOK_SHARED_SECRET
pnpm --filter @askalert/edge-webhooks exec wrangler secret put SUPABASE_FUNCTION_URL
```

| Secret | Purpose |
| --- | --- |
| `WHATSAPP_VERIFY_TOKEN` | Meta webhook verify challenge |
| `WHATSAPP_APP_SECRET` | Validates `X-Hub-Signature-256` |
| `PAYSTACK_SECRET` | Validates `x-paystack-signature` (HMAC SHA-512) |
| `WEBHOOK_SHARED_SECRET` | Sent as `x-askalert-webhook-secret` to Supabase |
| `SUPABASE_FUNCTION_URL` | Edge Function URL that receives forwarded events |

Local .dev.vars (gitignored pattern via `.env*.local` / Wrangler): copy from `apps/edge-webhooks/.dev.vars.example`.

### Behaviour notes

- WhatsApp **sent / delivered / read** statuses are dropped
- Incoming **messages** and **failed** statuses are kept, deduped by id, then forwarded
- Logs only counts and error codes — never message text or phone numbers
- Point Meta and Paystack webhook URLs at the Worker hostname after deploy

## Optional: Vercel

Vercel is **not** required. If you keep a Vercel project temporarily:

- Root Directory still `apps/web` / `apps/admin`
- Build must produce `out/` (already configured via `output: 'export'`)
- Prefer Cloudflare for free static hosting going forward

## Checklist

- [x] Web Pages project builds `out/`
- [x] Admin Pages project builds `out/`
- [ ] Custom domains on Cloudflare
- [ ] Admin behind Cloudflare Access
- [x] WhatsApp CTAs use the real number
- [ ] OG preview shows `askalert.com` (not a preview hostname)
- [ ] Offline / PWA works on a phone
- [ ] Old Vercel deployment disabled after cutover
- [ ] Edge webhooks Worker deployed + secrets set
- [x] Supabase queue / retention / size monitoring migrations applied
- [x] Edge Functions `ingest-webhook` + `process-jobs` deployed
- [ ] Set `WEBHOOK_SHARED_SECRET` / `CRON_SHARED_SECRET` + Worker `SUPABASE_FUNCTION_URL`
- [ ] GitHub secrets for backup + keep-alive; run backup workflow once
- [ ] Flip `NEXT_PUBLIC_USE_SUPABASE=true` after seed verify
- [ ] Upgrade Supabase to Pro at first real escrow hold

