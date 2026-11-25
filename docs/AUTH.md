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

## Auth emails — Brevo (custom SMTP)

Supabase’s built-in email is for development only (and rate-limits hard). Use **Brevo** SMTP for production auth mail.

Official guide: [Connect Brevo SMTP to Supabase](https://developers.brevo.com/docs/supabase-smtp-integration)

### 1) In Brevo

1. Open [SMTP & API](https://app.brevo.com/settings/keys/smtp).
2. Under **SMTP**, copy your **Login** (account email or `…@smtp-brevo.com`).
3. Create an **SMTP key** (not an API key). Save it once — Brevo only shows it at creation.
4. Confirm you have a **verified sender** domain/email (e.g. `auth@askalert.com` or whatever Brevo verified for AskAlert).

### 2) In Supabase

1. Open project → **Authentication** → **Emails** → **SMTP Settings**  
   (or Project Settings → Authentication → SMTP).
2. Enable **custom SMTP**.
3. Fill:

| Field | Value |
| --- | --- |
| Sender email | Your verified Brevo sender, e.g. `auth@askalert.com` |
| Sender name | `AskAlert` |
| Host | `smtp-relay.brevo.com` |
| Port | `587` (STARTTLS) — or `465` if you prefer SSL |
| Username | Brevo **SMTP login** from step 1 |
| Password | Brevo **SMTP key** (not API key, not account password) |

4. Save.

### 3) Brand email templates (required) — detailed guide

AskAlert email HTML lives in the repo folder:

`supabase/templates/`

| What the email is for | File to open | Supabase template name |
| --- | --- | --- |
| After someone signs up (confirm account) | `confirm-signup.html` | **Confirm sign up** |
| “Continue with email link” / magic link | `magic-link.html` | **Magic Link** |
| Forgot password | `reset-password.html` | **Reset password** |

You are **not** uploading these files to Supabase. You **copy the HTML text** from each file and **paste it into the Supabase email editor**.

#### Before you start

1. Make sure `askalert-logo-email.png` is live on the website:  
   open this in a browser (should show the logo, not 404):  
   `https://www.askalert.com/brand/askalert-logo-email.png`  
   If that 404s, deploy/push the latest web build first, then continue.
2. Optional but recommended: in Cloudflare Pages (web) set  
   `NEXT_PUBLIC_EMAIL_LOGO_URL` = `https://www.askalert.com/brand/askalert-logo-email.png`  
   then redeploy. (Supabase templates use the absolute URL already baked into the HTML.)

#### Step-by-step in Supabase

1. Open your project: [Supabase Dashboard](https://supabase.com/dashboard) → project **AskAlert** (`krrvatcjgytdbsiyvqyh`).
2. Left sidebar → **Authentication**.
3. Open **Email Templates**  
   (sometimes under **Authentication → Emails → Templates**, depending on the UI version).
4. You will see a list of templates (Confirm sign up, Magic Link, Reset password, etc.).

Do this **three times** — once per template:

##### A) Confirm sign up

1. Click **Confirm sign up** (wording may be “Confirm signup”).
2. **Subject** field — replace with:  
   `Confirm your AskAlert account`
3. Open the file on your computer:  
   `AskAlert-Reversed/supabase/templates/confirm-signup.html`  
   (in Cursor: open that file from the file tree).
4. Select **all** of the file contents (`Ctrl+A`) → copy (`Ctrl+C`).
5. In Supabase, find the **Message body** / **Body** editor (HTML).
6. Select all existing default content in that box → delete it → paste (`Ctrl+V`) the AskAlert HTML.
7. **Do not edit** the bits that look like `{{ .ConfirmationURL }}` or `{{ .Email }}` — Supabase fills those in when it sends mail.
8. Click **Save**.

##### B) Magic Link

1. Click **Magic Link**.
2. **Subject:** `Your AskAlert sign-in link`
3. Copy all of `supabase/templates/magic-link.html`.
4. Replace the Message body with that HTML.
5. Save.

##### C) Reset password

1. Click **Reset password** (sometimes “Change Email Address” is separate — leave that for later).
2. **Subject:** `Reset your AskAlert password`
3. Copy all of `supabase/templates/reset-password.html`.
4. Replace the Message body with that HTML.
5. Save.

#### How to test

1. Confirm **custom SMTP (Brevo)** is enabled and saved (section above).
2. On `https://www.askalert.com/auth/sign-up/`, create a test account with a real inbox you can open.
3. You should receive a branded AskAlert email (navy header, orange button, Lekki footer).
4. On sign-in, try **Continue with email link** → magic-link template.
5. Try **Forgot password?** → reset template.
6. On the “Check your email” screen, use **Resend email** (60s cooldown) if needed.

#### If the logo is missing in Gmail

- The logo `src` must stay a full `https://…` URL (already in the templates).
- Confirm the URL opens in a private/incognito window.
- Gmail sometimes caches; wait a few minutes or resend.

#### Reuse later

`email-layout.html` is a notes/shell file for future booking/payout emails. You do **not** paste that one into Supabase Auth.

## Redirect URLs

**Authentication → URL Configuration**

- **Site URL** (production): `https://www.askalert.com`
- **Redirect URLs** allow list (add all):
  - `https://www.askalert.com/auth/callback/`
  - `https://www.askalert.com/auth/reset-password/`
  - `http://localhost:3000/auth/callback/`
  - `http://localhost:3000/auth/reset-password/`
  - Admin origin later if needed, e.g. `https://askalert-admin.pages.dev/**`

For **local** magic-link tests, either:

- keep Site URL as production and open the link (it returns to www), or  
- temporarily set local `NEXT_PUBLIC_SITE_URL=http://localhost:3000` so the link returns to localhost.

## Email confirmation (for first tests)

**Authentication → Providers → Email**

- For a quick smoke test you can turn **Confirm email** off, create an account with password, and sign in immediately.
- Turn **Confirm email** back **on** before real users, once Brevo SMTP is working.

## Google provider

1. Google Cloud Console → OAuth client (Web).
2. **Authorised JavaScript origins** (no trailing slash):
   - `https://www.askalert.com`
   - `https://askalert.com`
   - `http://localhost:3000`
3. **Authorised redirect URI** (exact):
   - `https://krrvatcjgytdbsiyvqyh.supabase.co/auth/v1/callback`
4. Supabase → Authentication → Providers → Google → enable → paste Client ID + Client Secret.
5. Supabase → Authentication → URL Configuration must allow:
   - `https://www.askalert.com/auth/callback/`
   - `http://localhost:3000/auth/callback/`

### If Google “loads forever”

- Confirm the redirect URI is the **Supabase** callback, not askalert.com.
- Confirm JS origins include the site you opened (www vs apex).
- In Google Cloud → OAuth consent screen → **Audience**: add your Google account as a test user while the app is in Testing.
- Wait 5 minutes after saving Google client changes, then retry in a fresh incognito window.

## Apply migration

Already applied on the linked project if you ran:

```bash
pnpm db:push
```

Migration: `supabase/migrations/20260327000001_accounts.sql`

## Local env checklist

Root `.env.local` should have:

```env
NEXT_PUBLIC_USE_SUPABASE=true
USE_SUPABASE=true
NEXT_PUBLIC_SUPABASE_URL=https://krrvatcjgytdbsiyvqyh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
```

For local-only auth redirects:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

(Use `https://www.askalert.com` again for production Pages builds.)
