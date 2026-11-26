# How to set up admin login (Prompt 27)

## 1. Cloudflare Pages (Admin project)

Set Production env, then redeploy:

- `NEXT_PUBLIC_USE_SUPABASE=true`
- `NEXT_PUBLIC_SUPABASE_URL` (same as web)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same as web)
- `NEXT_PUBLIC_SITE_URL=https://admin.askalert.com`

Custom domain: `admin.askalert.com` on the **Admin** Pages project (not the buyer web project).

## 2. Database

Apply migrations including `20260330000001_admin_ops.sql` (invites, review RPCs, audit select).

## 3. First super admin

1. Supabase → Authentication → Users → create/invite your work email.
2. Copy the user UUID, then run:

```sql
insert into public.user_roles (user_id, role, status)
values (
  '<your-auth-user-uuid>',
  'admin_super',
  'active'
)
on conflict (user_id, role) do update set status = 'active';
```

## 4. Enable MFA (TOTP)

Supabase Dashboard → Authentication → Providers / MFA → enable TOTP.

On first admin sign-in you will enroll an authenticator app. Later logins ask for a 6-digit code.

## 5. Sign in

Open `https://admin.askalert.com/sign-in/`.

- Buyer-only accounts are rejected.
- Sessions idle out after 30 minutes.
- Use **Sign out everywhere** on shared devices.

## 6. Invite more staff

Signed in as super admin → **Settings** → Invite admin staff (saves invitation + audit).

Then create/invite that Auth user in Supabase. When they sign in, `admin_accept_invitation` grants their role.

## 7. Optional: Cloudflare Access

Still recommended as a second gate on `admin.askalert.com`. See `DEPLOY.md`.
