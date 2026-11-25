# AskAlert auth (Prompt 22)

## Model

- One person = one Supabase Auth user.
- Buyer profile/role is created automatically on signup.
- Vendor profile/role is added later through onboarding (Prompt 26).
- Mode is the URL: `/app` (buyer) and `/vendor` (vendor).

## Sign-in methods

- Email + password (with strength rules and forgot/reset).
- Email magic link (PKCE).
- Google OAuth.
- No paid SMS OTPs. Phone is collected as E.164 and verified later via WhatsApp.

## Auth emails — Send Email Hook + Resend (preferred)

Auth emails are sent by the **`send-auth-email`** Edge Function via the Supabase **Send Email Hook**.  
Templates live in the repo (`packages/emails`). Secrets live in Supabase function secrets / local `.env` — never in git.  
The function talks to **Resend’s HTTP API** (optional **Brevo HTTP** fallback). It does **not** use SMTP.

Follow the steps **in order**. Do not skip ahead to the Hook until the function is deployed and secrets are ready (you will generate the hook secret in step 4, then put it into secrets).

---

### Step 1 — Create a Resend account and API key

1. Open [https://resend.com](https://resend.com) in your browser.
2. Sign up or log in.
3. **Verify a sending domain** (best for production):
   1. Left menu → **Domains** → **Add Domain**
   2. Enter your domain (e.g. `askalert.com`)
   3. Resend shows DNS records (SPF, DKIM, etc.)
   4. Add those records at your DNS host (Cloudflare DNS if the domain is on Cloudflare)
   5. Back in Resend, click **Verify** and wait until status is **Verified**
4. **If you only want a quick smoke test** before DNS is ready:
   - You can send from Resend’s test sender `onboarding@resend.dev`
   - On the free plan, test sends usually only work to **your own Resend account email**
   - For real users, finish domain verification first
5. Create an API key:
   1. Left menu → **API Keys** → **Create API Key**
   2. Name it e.g. `askalert-auth`
   3. Permission: **Sending access** (enough)
   4. Click **Create**
   5. **Copy the key once** (starts with `re_`). Store it somewhere private. You cannot view it again later.
6. Decide your **From** address:
   - Production (after domain verified): `AskAlert <auth@askalert.com>`  
     (the part after `@` must be your verified domain)
   - Temporary smoke test: `AskAlert <onboarding@resend.dev>`

Keep the API key and From address ready for Step 3.

---

### Step 2 — Deploy the `send-auth-email` Edge Function

**What this step does (plain English):**  
You upload a small server program (`send-auth-email`) to Supabase. Later, when someone signs up, Supabase calls that program, and the program sends the email through Resend. You only need to do this once (or again when the email code changes).

**Where to run commands:**  
Open **PowerShell**. Make sure the prompt shows this folder:

`C:\Users\ADMIN\AskAlert-Reversed`

If not, run:

```powershell
cd C:\Users\ADMIN\AskAlert-Reversed
```

Run the commands **one at a time**. Wait for each to finish before the next.

#### 2a. Check the Supabase CLI works

```powershell
pnpm exec supabase --version
```

You should see a version number (e.g. `2.x.x`). If you get “command not found”, install/login first:

```powershell
pnpm exec supabase login
```

Then list projects (you should see AskAlert / `krrvatcjgytdbsiyvqyh`):

```powershell
pnpm exec supabase projects list
```

#### 2b. Link this folder to the AskAlert project (once per machine)

```powershell
pnpm exec supabase link --project-ref krrvatcjgytdbsiyvqyh
```

- This tells the CLI: “when I say deploy, use the AskAlert cloud project.”
- It may ask you to confirm the database password. Use the one from Supabase → **Project Settings** → **Database**.
- Success looks like a message that the project is linked. You can ignore “already linked” if you did this before.

#### 2c. Copy email code into the function folder

```powershell
pnpm emails:sync-edge
```

- This copies templates/providers from `packages/emails` into `supabase/functions/send-auth-email/_shared/`.
- Success: terminal lines like `synced render.ts`, `synced providers/resend.ts`, etc.
- If this fails, stop and fix before deploying (do not skip).

#### 2d. Upload the function to Supabase

```powershell
pnpm exec supabase functions deploy send-auth-email --no-verify-jwt
```

- `send-auth-email` = the function name in the repo.
- `--no-verify-jwt` = required so Auth can call the hook (do not remove this flag).
- Success: a Deployed / success message. Failures often mean you are not logged in, not linked, or offline.

#### 2e. Keep this URL for Step 4

After a successful deploy, the function lives at:

`https://krrvatcjgytdbsiyvqyh.supabase.co/functions/v1/send-auth-email`

Copy that URL. You will paste it into **Authentication → Hooks → Send Email** in Step 4.

Optional check: Supabase Dashboard → **Edge Functions** → you should see **`send-auth-email`**.

You do **not** set Resend keys in this step. Secrets are Step 3–4.

---

### Step 3 — Create the local secrets file (do not commit it)

1. In Cursor / File Explorer, open the folder:

`supabase/functions/`

2. Copy the example file:
   - Source: `supabase/functions/.env.example`
   - Destination: `supabase/functions/.env`  
   (same folder; new file name ends in `.env` only)

   PowerShell from repo root:

```powershell
Copy-Item supabase\functions\.env.example supabase\functions\.env
```

3. Open `supabase/functions/.env` in the editor.
4. Fill real values (examples below — use your own keys):

```env
RESEND_API_KEY=re_xxxxxxxx
SEND_EMAIL_HOOK_SECRET=v1,whsec_PLACEHOLDER_REPLACE_IN_STEP_4
EMAIL_FROM=AskAlert <auth@askalert.com>
EMAIL_LOGO_URL=https://www.askalert.com/brand/askalert-logo-email.png
EMAIL_SITE_URL=https://www.askalert.com
```

Notes:

- Leave `SEND_EMAIL_HOOK_SECRET` as a placeholder for now if you have not generated it yet. You will replace it in Step 4.
- Confirm the logo URL opens in a browser (not 404):  
  `https://www.askalert.com/brand/askalert-logo-email.png`
- **Never commit** `supabase/functions/.env` (it is gitignored).

5. Optional Brevo HTTP fallback (not SMTP) — only if you want a backup sender:

```env
BREVO_API_KEY=your_brevo_api_key
EMAIL_FALLBACK=brevo
```

If you do not want fallback:

```env
EMAIL_FALLBACK=none
```

---

### Step 4 — Enable the Send Email Hook and get the secret

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select project **AskAlert** (`krrvatcjgytdbsiyvqyh`)
3. Left sidebar → **Authentication**
4. Open **Hooks**  
   (if you do not see it, look under Authentication settings / Auth Hooks depending on UI version)
5. Find **Send Email** (or **Add hook** → choose **Send Email**)
6. Set:
   - **Enabled**: on
   - **Hook type / Method**: **HTTPS**
   - **URL**:  
     `https://krrvatcjgytdbsiyvqyh.supabase.co/functions/v1/send-auth-email`
7. Click **Generate secret** (or similar)
8. Copy the **entire** secret. It looks like:

`v1,whsec_xxxxxxxxxxxxxxxx`

9. Paste that value into `supabase/functions/.env` as:

```env
SEND_EMAIL_HOOK_SECRET=v1,whsec_xxxxxxxxxxxxxxxx
```

10. Save the hook in the Supabase UI.
11. Push secrets to the hosted project:

```powershell
pnpm exec supabase secrets set --env-file ./supabase/functions/.env --yes
```

12. Confirm secrets uploaded (names only; values stay hidden):

```powershell
pnpm exec supabase secrets list
```

You should see at least `RESEND_API_KEY`, `SEND_EMAIL_HOOK_SECRET`, `EMAIL_FROM`.

When the Send Email hook is **enabled**, Auth uses this function and **does not** send through SMTP.

---

### Step 5 — Raise the Auth email rate limit

Supabase’s built-in mail is capped at about **2 emails per hour**. That limit still blocks signups if you leave it low.

1. Dashboard → **Authentication** → **Rate Limits**
2. Find the **Email** / emails-sent limit
3. Raise it to match your Resend plan, for example:
   - Early testing: `30` per hour
   - Higher volume later: raise again after checking Resend’s plan limits
4. Save

Local config already has:

```toml
[auth.rate_limit]
email_sent = 30
```

Do **not** change that back to `2`.  
`auth.email.max_frequency = "60s"` is already set to match the in-app resend cooldown.

---

### Step 6 — Send a test email (before full signup)

Use an inbox you can open. Prefer an address that is **not** limited to “Supabase team only” (the old built-in mail restriction). With the hook + Resend, any address your Resend account is allowed to send to should work.

PowerShell (repo root), replace the values:

```powershell
$env:RESEND_API_KEY="re_xxxxxxxx"
$env:EMAIL_FROM="AskAlert <auth@askalert.com>"
$env:TEST_EMAIL="you@example.com"
pnpm emails:send-test
```

Expected success output looks like:

```json
{"ok":true,"provider":"resend","providerId":"...","action":"magiclink"}
```

Then check the inbox (and spam) for a branded AskAlert email.

If it fails, the JSON `errorCode` will tell you (missing key, HTTP error, etc.) — never paste API keys into chat.

---

### Step 7 — Test the real signup / magic-link flow

1. Open `https://www.askalert.com/auth/sign-up/` (or local `http://localhost:3000/auth/sign-up/`)
2. Create an account with a real inbox
3. You should land on **Check your email**
4. Open the inbox → branded AskAlert confirm email → click the button
5. Also test **Continue with email link** on sign-in, and **Forgot password?**
6. On the check-email screen, try **Resend email** (60s cooldown)

If nothing arrives, or the app shows **“Hook requires authorization token”**:

That message almost always means the Edge Function returned **401**. Auth does not send a Bearer JWT; it signs with Standard Webhooks headers. Common causes:

1. **`SEND_EMAIL_HOOK_SECRET` does not match** the secret shown on Authentication → Hooks → Send Email (most common).  
   - Open the Hooks screen → copy the **current** secret (`v1,whsec_…`)  
   - Put it in `supabase/functions/.env` as `SEND_EMAIL_HOOK_SECRET=…`  
   - Re-upload:  
     `pnpm exec supabase secrets set --env-file ./supabase/functions/.env --yes`  
   - Do **not** regenerate the secret unless you also update `.env` and re-upload in the same sitting.
2. **Verify JWT** still on for `send-auth-email` → Dashboard → Edge Functions → `send-auth-email` → turn **Verify JWT** off, or redeploy with `--no-verify-jwt`.
3. Function logs show `invalid_hook_signature` → secret mismatch (fix #1).
4. Function logs never mention `send-auth-email` → hook not enabled / wrong URL.

Also check:

- Supabase → **Edge Functions** → `send-auth-email` → **Logs** (`auth_email_sent` / `auth_email_send_failed` / `auth_email_hook_reject`)
- Resend → **Emails** for a delivery attempt
- Use a **new** inbox for signup tests (existing Google users often get `user_repeated_signup` with no email)

Preview templates locally any time:

```powershell
pnpm emails:preview
```

Then open:

`packages/emails/preview/index.html`

After you change templates in `packages/emails`, redeploy:

```powershell
pnpm emails:sync-edge
pnpm exec supabase functions deploy send-auth-email --no-verify-jwt
```

---

### Step 8 — Roll back to custom SMTP (only if the hook fails)

1. Dashboard → **Authentication** → **Hooks** → turn **Send Email** **off**
2. **Authentication** → **Emails** → **SMTP Settings** → enable custom SMTP (Brevo or Resend SMTP)
3. Optionally paste legacy HTML from `supabase/templates/*.html` into Email Templates
4. Keep the raised rate limit — do not drop back to 2/hour while using custom SMTP

| Email provider | Send Email hook | Result |
| --- | --- | --- |
| Enabled | Enabled | Hook sends (SMTP unused) |
| Enabled | Disabled | SMTP sends |
| Disabled | Enabled | Email signups disabled |
| Disabled | Disabled | Email signups disabled |

## Legacy: Brevo / Resend SMTP (rollback only)

Use only if Step 8 is needed. Prefer the hook path above for production.

## Redirect URLs

**Authentication → URL Configuration**

- **Site URL** (production): `https://www.askalert.com`  
  Never use `http://localhost:3000` or `https://<project>.supabase.co` as Site URL.  
  If a redirect is missing from **Redirect URLs**, Auth falls back to Site URL (homepage).
- **Redirect URLs** (add these):
  - `https://www.askalert.com/**`
  - `https://askalert.com/**`
  - `http://localhost:3000/**`

The `https://<project>.supabase.co/auth/v1/verify?...` host in emails is normal.  
`redirect_to` inside that link must be `https://www.askalert.com/auth/reset-password/` (recovery) or `.../auth/callback/` (signup/magic link) — never `*.supabase.co/auth/...`.

## Google provider

1. Google Cloud Console → OAuth client (Web).
2. **Authorised JavaScript origins**: `https://www.askalert.com`, `https://askalert.com`, `http://localhost:3000`
3. **Authorised redirect URI**: `https://krrvatcjgytdbsiyvqyh.supabase.co/auth/v1/callback`
4. Supabase → Authentication → Providers → Google → Client ID + Secret

### If Google “loads forever”

- Redirect URI must be the **Supabase** callback, not askalert.com
- Add your Google account as a **test user** while the consent screen is in Testing
- Wait a few minutes after saving client changes; retry in incognito

## Apply migration

```bash
pnpm db:push
```

Migration: `supabase/migrations/20260327000001_accounts.sql`

## Local env checklist

```env
NEXT_PUBLIC_USE_SUPABASE=true
USE_SUPABASE=true
NEXT_PUBLIC_SUPABASE_URL=https://krrvatcjgytdbsiyvqyh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_EMAIL_LOGO_URL=https://www.askalert.com/brand/askalert-logo-email.png
```
