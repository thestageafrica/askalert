In Cloudflare One, protect `admin.askalert.com` like this:

1. Left sidebar → **Access controls** → **Applications**
2. **Add an application** → choose **Self-hosted**
3. Application name: `AskAlert Admin`
4. Application domain: `admin.askalert.com` (leave path empty / `/` so the whole admin site is covered)
5. Add a **policy**, e.g. `Allow staff`:
   - Action: **Allow**
   - Include: **Emails** → `askalertapp@gmail.com` (add other staff emails later)
6. Identity: use the provider you already connected (Google is fine). One-time PIN email also works on Free.
7. Save / Deploy

Then open `https://admin.askalert.com` in a private window. You should get a Cloudflare Access gate first, then the AskAlert admin sign-in (email/password + Supabase TOTP).

**Note:** Zero Trust Access is separate from Supabase MFA. Access is the outer gate; AskAlert login is the inner gate. You still need the Supabase `admin_super` role for the app login itself.