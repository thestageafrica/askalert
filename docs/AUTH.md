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

## Auth emails — Resend (custom SMTP)

Supabase’s built-in email is for development only. For production, connect **Resend** (free tier) as custom SMTP in the Supabase dashboard:

1. Create a Resend account and verify `askalert.com` (or your sending domain).
2. Create an API key.
3. In Supabase → Project Settings → Authentication → SMTP:
   - Host: `smtp.resend.com`
   - Port: `465` (SSL) or `587`
   - User: `resend`
   - Pass: your Resend API key
   - Sender: e.g. `AskAlert <auth@askalert.com>`
4. Check Resend’s current free-tier limits before launch volume.

Why Resend: simple SMTP, free tier for early traffic, already listed in AskAlert env docs for transactional email.

## Redirect URLs

Add these to Supabase Auth → URL configuration:

- Site URL: production web origin
- Redirect allow list:
  - `https://www.askalert.com/auth/callback/`
  - `https://www.askalert.com/auth/reset-password/`
  - local `http://localhost:3000/auth/callback/`
  - admin origin when using Google/password redirects there

## Google provider

Enable Google in Supabase Auth providers. Use the web client ID/secret. Redirect to `/auth/callback/`.

## Apply migration

```bash
pnpm db:push
```

Migration: `supabase/migrations/20260327000001_accounts.sql`
