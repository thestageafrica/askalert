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

### 3) Confirm email templates

In **Authentication → Email Templates**, keep Confirm signup / Magic link / Reset password enabled. Subject lines can stay default for now.

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

## Google provider (optional for first test)

1. Google Cloud Console → OAuth client (Web).
2. Authorized redirect URI: `https://krrvatcjgytdbsiyvqyh.supabase.co/auth/v1/callback`
3. Supabase → Authentication → Providers → Google → paste Client ID/Secret.

Skip Google until password + magic link work.

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
