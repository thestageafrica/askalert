# AskAlert: Cursor Prompt Pack, Phase 1

**Ask. Alert. Delivered.** Brand: orange **#FF7500**, navy **#0F1545**.

*Goal of this phase: set up the project and deploy the first designs (landing page, app screens with mock data, and the admin shell) with no backend yet.*

## How to use this pack

1. Use **Cursor in Agent mode**. Paste **one prompt at a time, in order**. Do not merge prompts.
2. After each prompt, run the **Checks** listed, commit with Git, and only then move on. If something fails, paste the error back into the same chat.
3. Everything uses **mock data** until Prompt 11. No secrets go into prompts or code.
4. If Cursor wants to add a new library, let it explain why first. Prefer well-known libraries.

## Before you start (about 30 minutes, done by you)

- Install **Node.js 20 LTS**, **pnpm**, and **Git**.
- Create an empty GitHub repository named `askalert` and clone it.
- Create a **Vercel** account and connect GitHub. (Supabase comes later, at Prompt 11.)
- Save your logo as `apps/web/public/brand/askalert-logo.png` after Prompt 2 creates the folder. Also ask your designer for a **reversed logo** (white “alert”) named `askalert-logo-reversed.png`, because the navy wordmark disappears on navy backgrounds.
- Open the repository folder in Cursor.

## Prompt 1: Project rules

```
Create the file .cursor/rules/askalert.mdc with the following project rules, and a short README.md that explains the project: AskAlert is an agentic marketplace where an AI agent finds vendors or buyers, negotiates, and recommends the best options. Launch market: Lekki, Lagos, Nigeria. Tagline: Ask. Alert. Delivered.

Rules to write into the file:
- Stack: TypeScript (strict), pnpm workspaces, Turborepo, Next.js App Router, Tailwind CSS, Vitest, Zod.
- Layout: apps/web, apps/admin, packages/ui, packages/category-engine, packages/payments, packages/config.
- Money: always integers in minor units (kobo). Never floats. Every amount carries a currency code. Format Naira with Intl.NumberFormat('en-NG').
- Design: use design tokens only, never hard-coded hex values inside components. Navy text on orange buttons. Never white small text on orange. Minimum touch target 44px. Mobile-first. Support light and dark mode.
- Content: plain English, short sentences, friendly and clear.
- Quality: no any, no unused code, every package has tests, and run pnpm lint, pnpm typecheck and pnpm test before finishing any task.
- Security: no secrets in code, keep an .env.example, validate all external input with Zod.
- Process: small commits, explain what changed, ask before adding a new dependency.

Do not create any other files yet.
```

**Checks:** the rules file exists and the README reads clearly. Commit.

## Prompt 2: Monorepo scaffold

```
Scaffold the monorepo described in .cursor/rules/askalert.mdc.

Requirements:
- pnpm workspaces and Turborepo.
- apps/web and apps/admin: Next.js (App Router, TypeScript strict, Tailwind CSS). Different dev ports (web 3000, admin 3001).
- packages/ui (shared React components), packages/category-engine, packages/payments, packages/config (shared tsconfig, eslint and prettier config). Each package is TypeScript, builds cleanly, and has a Vitest setup with one trivial passing test.
- Root scripts: dev, build, lint, typecheck, test.
- Create apps/web/public/brand/ (empty, with a .gitkeep) for the logo files.
- Add .env.example at the root and per app with NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_WHATSAPP_NUMBER (placeholder values). Do not commit real values.
- Add a GitHub Actions workflow that runs install, lint, typecheck, test and build on every pull request and on pushes to main.
- .gitignore for node, Next.js, env files and editor folders.

When done, run pnpm install, pnpm lint, pnpm typecheck, pnpm test and pnpm build, fix any problems, and report the results.
```

**Checks:** `pnpm dev` starts both apps, and `pnpm build` passes. Commit and push to GitHub.

## Prompt 3: Design system and brand tokens

```
Build the AskAlert design system in packages/ui and apply it to apps/web and apps/admin.

Brand tokens (define as CSS variables and map them in the Tailwind theme):
- --orange-500 #FF7500 (primary), --orange-400 #FF9A3D, --orange-700 #B34700 (orange text on white only)
- --navy-900 #0F1545 (brand navy), --navy-950 #0A0F33, --navy-700 #1D2468
- --surface #FFFFFF, --surface-subtle #F6F7FB, --border #E3E6F0
- --success #1FB86B, --warning #F5B301, --danger #E5484D
Support light and dark mode with a ThemeProvider (default: follow the system setting). In dark mode the page background is --navy-950 and cards use --navy-900 and --navy-700.

Typography: Plus Jakarta Sans through next/font (weights 400 to 800) with a system fallback. Large friendly headings, comfortable line height.

Components (all accessible, keyboard friendly, with visible focus rings):
- Button: primary (orange gradient --orange-500 to --orange-400, NAVY text, pill shape, soft orange glow), secondary (glass style: translucent white border on dark, navy border on light), ghost. Sizes md and lg. Loading and disabled states.
- Chip (small pill with an optional green status dot), Badge (variants: Verified, Protected by AskAlert, Direct payment), Card (rounded-2xl), Input, Select, Slider, Tabs, Accordion, Sheet (bottom sheet on mobile), Toast.
- Logo component with variants default and reversed. Use /brand/askalert-logo.png for default and /brand/askalert-logo-reversed.png for reversed. If the reversed file is missing, render the default logo inside a white rounded pill so it stays visible on dark backgrounds.
- Container and Section helpers with consistent spacing.

Create a /design-system page in apps/web that shows every token and component in light and dark mode.

Rules: never use white small text on orange; verify text and background pairs meet WCAG AA contrast; no hard-coded hex values in components.
```

**Checks:** open `/design-system` in light and dark mode. Buttons show navy text on orange. Tab through the page and confirm focus rings are visible. Commit.

## Prompt 4: Landing page

```
Build the AskAlert landing page at the root route of apps/web using only the design system.

Style direction: dark navy gradient hero (--navy-950 to --navy-900 to --navy-700) with a faint orange glow, sticky header, pill buttons, rounded cards, generous spacing, mobile-first.

Sections and copy:
1. Sticky header: Logo, nav links (How it works, Categories, For vendors, FAQ), and a primary button 'Ask on WhatsApp'. Collapse into a menu on mobile.
2. Hero: a Chip with a green dot reading 'Lekki · Verified vendors · Protected payments'. Headline line 1 (white): 'Tell AskAlert what you need.' Line 2 (orange gradient): 'It does the chasing.' Sub-text: 'Shortlets, events, home care and more. AskAlert asks verified vendors, compares the offers and brings you the best ones. You choose, and you decide how much to protect.' Buttons: primary 'Ask on WhatsApp' (link: https://wa.me/ followed by NEXT_PUBLIC_WHATSAPP_NUMBER), secondary 'Open in your browser' (link to /app). Under them, two dashed badges: 'Android app · Coming soon' and 'iPhone · Add to Home Screen'.
3. Categories: Live tiles for Events, Shortlets and Home care. Dashed 'Coming soon' tiles for Car hire with driver, Beauty at home, Auto services, Business services, Tutors, Real estate.
4. How it works, three steps: 'Tell us what you need', 'We ask around and negotiate, as much as you want', 'You pick and pay safely'.
5. Built for your phone: three CSS-built phone frames with static mock screens (a request, a quote comparison, a checkout) using real tokens. No external images.
6. You decide how much to protect: an explainer with an interactive Slider for 'Hold %' (0 to 100). Show: 'You pay ₦100,000. Vendor receives ₦X now. AskAlert holds ₦Y until you confirm the job.' Use simple placeholder maths now (distributable = ₦86,400); Prompt 7 will connect the real function.
7. Trust: four cards: Verified vendors; Protected payments (you choose how much AskAlert holds); Your contact details stay private until you book; Real reviews from completed jobs.
8. For vendors: headline 'Get customers on WhatsApp. Join free.' with a button 'Join as a vendor' linking to the WhatsApp link.
9. FAQ accordion with six questions: Is it free? How does AskAlert negotiate for me? What does 'hold' mean? Is my phone number shared? Which areas do you cover? Can I negotiate myself instead?  Write short, honest, plain-English answers.
10. Footer: Logo, links to Terms, Privacy and Contact (placeholder pages), and '© 2026 AskAlert'.

Technical: SEO title and meta description, Open Graph tags, JSON-LD Organization, semantic HTML, keyboard accessible, no layout shift, lazy loading, Lighthouse mobile score of 90 or more for performance, accessibility and SEO. Fix any contrast issue you find.
```

**Checks:** open on your phone (same Wi-Fi) and in desktop dark and light mode. Run Lighthouse. Commit.

## Prompt 5: Progressive web app (installable)

```
Make apps/web an installable PWA.

- Web app manifest: name AskAlert, short_name AskAlert, theme_color #0F1545, background_color #0F1545, display standalone, start_url /app. Use placeholder icons (192, 512 and maskable) that I will replace later, and document where to swap them.
- A service worker that caches the app shell and static assets and shows a friendly /offline page when there is no network. Use a well-known approach such as Serwist and explain why you chose it.
- An InstallPrompt component: on Android Chrome capture beforeinstallprompt and show an 'Install AskAlert' button; on iPhone Safari show a short bottom Sheet with steps ('Tap Share, then Add to Home Screen'). Do NOT show it on first visit. Expose a function showInstallPromptAfterBooking() that will be called after a successful booking later.
- Make sure the app works with poor connections: skeleton loaders, and no blocking requests.
```

**Checks:** Lighthouse PWA audit passes. On an Android phone, the install option appears. Commit.

## Prompt 6: Category engine package

```
Build packages/category-engine. Categories are configuration, not code.

1. Define Zod schemas and TypeScript types for CategoryConfig with: slug, name, icon, status (draft, pilot, live, paused), pricing_mode (fixed, range, quote, rate_card), negotiation (none, assisted, auto), autopilot_max_rounds, commission_pct, escrow (mode: fixed, buyer_selectable, none; default_hold_pct, min_hold_pct, max_hold_pct, vendor_min_release_pct, auto_release_hours, fee_bearer: vendor, platform, buyer, refund_commission_on_vendor_fault), inspection_required, fulfilment (none, provider, merchant_riders), vendor_requirements (array), media_allowed (photo, voice_note), max_vendors_per_mission, response_deadline_minutes, attributes (array), agent (tone, extra_rules, negotiation_hints), ranking_weights (must sum to 1).
2. Attribute types: text, number, money, date, select, multi, area, boolean. Each attribute has key, label, type, required, applies_to (need, offer, both), options, unit and validation.
3. validateConfig(config) returns clear, human-readable errors. A category cannot be published without a pricing mode, escrow policy, commission, at least one required attribute and at least one vendor requirement.
4. buildIntakeSteps(config, appliesTo) returns the ordered list of questions for a chat or form flow, with validation functions per attribute.
5. Seed configs (JSON files) for nine categories: events, shortlets, home-care (status pilot), and car-hire-with-driver, beauty-at-home, auto-services, business-services, tutors, real-estate (status draft). Make sensible attributes and rules for each (for example: events need event_date, guest_count, budget, venue_area; shortlets need check_in, check_out, guests, bedrooms, budget_per_night, area; home-care needs service type, property type, frequency, preferred time, area). Use escrow defaults: default_hold_pct 60, min 0, max 100, vendor_min_release_pct 30 for events and 0 for others.
6. Vitest tests for validation, the intake builder, and every seed config.
```

**Checks:** `pnpm test` passes, and all nine seed configs validate. Commit.

## Prompt 7: Escrow split function

```
In packages/payments, build a pure function computeEscrowSplit with thorough Vitest tests.

Input: totalMinor (integer kobo), commissionPct, processingFeeMinor, feeBearer ('vendor' | 'platform' | 'buyer'), holdPct (0 to 100), and bounds { minHoldPct, maxHoldPct, vendorMinReleasePct }.

Rules:
- distributable = totalMinor - commission - (processingFee only when feeBearer is 'vendor').
- Clamp holdPct to the bounds. vendorMinReleasePct means the vendor must receive at least that percent of distributable now, so the effective maximum hold is 100 - vendorMinReleasePct.
- held = floor(distributable * holdPct / 100). releasedNow = distributable - held. Rounding remainders always go to the vendor-released side only if needed to keep held + releasedNow = distributable; never lose or create money.
- Return an object with totalMinor, commissionMinor, processingFeeMinor, distributableMinor, heldMinor, releasedNowMinor, effectiveHoldPct, protectionLabel ('Protected' when heldMinor > 0, 'Direct payment, no protection' when 0) and warnings (for example when the hold is low).
- All inputs are validated with Zod. Throw clear errors for invalid input.

Required test fixture: total 10,000,000 kobo (₦100,000), commission 12% (1,200,000), processing fee 160,000, feeBearer 'vendor'. Distributable must be 8,640,000. At 60% hold: held 5,184,000 and released 3,456,000. At 0% hold: released 8,640,000. At 100% hold: held 8,640,000. Add tests for clamping, odd amounts, and feeBearer 'platform' and 'buyer'.
```

**Checks:** all tests pass, including the fixture. Commit.

## Prompt 8: App screens with mock data

```
Build the logged-in app shell in apps/web under /app using mock data only (no backend). Use the design system, the category-engine package and the payments package.

Layout: mobile-first with a bottom navigation (Home, Requests, Chat, Account), and a calm, trustworthy look.

Screens:
1. Home: greeting, search box, category tiles (Live categories active, others dashed 'Coming soon' with a 'Notify me' button), and a card for the latest request.
2. New request /app/new/[category]: a step-by-step form generated by buildIntakeSteps from the seed config (events, shortlets, home-care). One question at a time with progress, validation and a summary screen. Include a 'How involved should AskAlert be?' choice with four options: Find only (Match), Chat through AskAlert (Relay), Help me reply (Assist), Negotiate for me (Autopilot). Explain each in one line.
3. Request /app/request/[id]: a status timeline (Searching, Asking vendors, Quotes ready, Booked), then three quote cards (vendor alias, verified badge, price, availability, rating, one-line reason for the recommendation) with 'Book' buttons and a 'Compare' option.
4. Checkout Sheet: shows the price, an interactive 'Hold %' Slider connected to computeEscrowSplit, and a live plain-English summary ('Vendor receives ₦X now. AskAlert holds ₦Y until you confirm the job.'). Show a 'Protected' or 'Direct payment, no protection' Badge and a warning at low holds. A 'Pay' button that only shows a success screen (no real payment) and then calls showInstallPromptAfterBooking().
5. Chat /app/chat/[id]: a WhatsApp-style thread with vendor alias, mission tag, quick-reply buttons, a note 'Contact details are shared after booking', and a 'Take over / Hand back to AskAlert' control.
6. Account: phone number, notification preferences, language (English, Pidgin placeholder), data and privacy controls.

Keep all state in memory. Make it feel real: skeleton loaders, empty states and friendly error states. Ensure keyboard access and AA contrast.
```

**Checks:** walk through a full request on your phone. The slider updates the numbers exactly as the Prompt 7 tests expect. Commit.

## Prompt 9: Admin shell

```
Build the admin console in apps/admin using mock data and the category-engine package (no backend yet).

- Layout: sidebar (Dashboard, Categories, Areas, Vendors, Requests, Disputes, Payouts, Settings), top bar with a mock user and role.
- Dashboard: summary cards with placeholder numbers (active vendors, requests today, conversion, unmet demand).
- Categories list: table with name, status chip (draft, pilot, live, paused), vendors count, and actions.
- Category editor with tabs: Basics, Attributes (add, edit, reorder, remove, validation rules), Rules and escrow (pricing mode, negotiation, commission, escrow fields including the buyer-selectable hold bounds), Agent text, Areas and readiness (checklist: 15 verified vendors, 5 fast responders, supply owner, terms ready, evaluation passed), Preview (renders the generated intake steps exactly as a user would see them), and Versions (list, publish with a change note, roll back).
- Publishing runs validateConfig and shows errors in plain English. In-flight versioning is simulated in memory.
- A 'Create category' flow that starts from a duplicate or blank config.
- Basic mock role switching (super admin, operations, support, read-only) that hides or disables actions.
- Protect the app with HTTP basic auth middleware using ADMIN_BASIC_USER and ADMIN_BASIC_PASSWORD environment variables, and add robots noindex.
```

**Checks:** create a new category and watch the preview update. Commit.

## Prompt 10: Deploy the first designs

Manual steps in Vercel (do these yourself):

1. In Vercel, choose **Add New, Project**, import the `askalert` repository, and set the **Root Directory** to `apps/web`. Framework: Next.js.
2. Add the environment variables `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_WHATSAPP_NUMBER` (international format, no plus sign). Deploy.
3. Create a **second Vercel project** from the same repository with Root Directory `apps/admin`, and add `ADMIN_BASIC_USER` and `ADMIN_BASIC_PASSWORD`. Deploy.
4. Test both preview URLs on your phone. Connect your domain later (for example the main domain for web and an `admin.` subdomain for admin).

Then paste this into Cursor:

```
Prepare both apps for production on Vercel.

- Add security headers (Content-Security-Policy suitable for these apps, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame protection), robots.txt (allow web, disallow admin), sitemap for web, favicon and Open Graph image placeholders.
- Add error and not-found pages in the brand style.
- Add a simple /api/health route in both apps.
- Optionally add Vercel Analytics, and explain what data it collects.
- Run a production build, run Lighthouse on the landing page and the /app home screen, and fix any issue under 90 for performance, accessibility, best practices or SEO.
- Write DEPLOY.md with the exact steps and environment variables.
```

**Checks:** both sites load over HTTPS, the admin asks for a password, and Lighthouse scores are 90 or more.

## Prompt 11: Supabase and the real category engine (Phase 1B)

Do this only after the designs are deployed and you have created a Supabase project (choose the region deliberately).

```
Add Supabase to the monorepo.

- Use the Supabase CLI. Create SQL migrations for: areas, categories, category_versions, category_attributes, category_areas, vendor_requirements, audit_log. Every table has created_at and updated_at.
- Row-level security: public can read only Live categories and their published attributes; only admin roles can write; every admin write creates an audit_log row.
- Seed the nine categories from packages/category-engine and the Lekki area hierarchy (Lagos, Eti-Osa, Lekki Phase 1, Lekki, Victoria Island, Ikoyi, Ajah, Oniru).
- Generate TypeScript types and a typed client in packages/db.
- Connect the admin Category editor and the web request form to the database behind a feature flag, keeping the mock data as a fallback for local development.
- Document the environment variables in .env.example and update DEPLOY.md.
- Write tests for the RLS rules and the publish flow.
```

**Checks:** create and publish a category in admin and see it appear in the web app.

## Useful helper prompts

**Review prompt (use after each major prompt):**

```
Act as a senior reviewer. Review the changes from this task against .cursor/rules/askalert.mdc. List bugs, security issues, accessibility and contrast problems, missing tests and anything that breaks the brand rules. Then fix the issues you find and re-run lint, typecheck and tests.
```

**When stuck:**

```
Here is the error and the steps I took: [paste]. Explain the cause in plain English first, then propose the smallest fix, apply it, and re-run the checks.
```

## What comes next (Phase 2 prompts, to be written when you are ready)

Phone sign-in and OTP, vendor onboarding through WhatsApp, the WhatsApp webhook and message templates, the matching engine, quote parsing and the agent tools, the anti-leakage filter, Paystack checkout with the escrow ledger, and the mission queue with timers.

## Update: zero-fixed-cost hosting (Prompts 12 to 15)

The first designs are live. These prompts **replace the Vercel plan in Prompt 10** and **replace the pg-boss idea in Prompt 11**, so you do not pay a monthly platform bill before revenue. Vercel Hobby is for non-commercial use only, so move the launched product to Cloudflare Pages. Run them in this order.

## Prompt 12: Fix the issues found on the live site

```
Fix these issues found on the live site, and verify each one in the production build.

1. Canonical URL, og:url, the sitemap and metadataBase must all use NEXT_PUBLIC_SITE_URL (https://www.askalert.com). Nothing may point to a vercel.app address.
2. The WhatsApp links use a placeholder number (2348000000000). Read the number only from NEXT_PUBLIC_WHATSAPP_NUMBER. If it is the placeholder, show a visible warning in development and fail the production build.
3. The checkout mock must use computeEscrowSplit from packages/payments. For a total of ₦128,500 with a 40% hold, commission and processing fees must be applied before the hold. The slider demo on the landing page and the checkout mock must show consistent numbers.
4. Create real /terms, /privacy and /contact pages with clearly marked DRAFT content. I will replace the text after legal review.
5. Confirm that /app and /offline exist. Hide /design-system in production.

Run lint, typecheck, tests and build. List every change.
```

**Checks:** share the site link on WhatsApp and confirm the preview shows `askalert.com`. Click every WhatsApp button and confirm your real number opens.

## Prompt 13: Static export for free hosting on Cloudflare Pages

```
Prepare apps/web and apps/admin to be hosted for free on Cloudflare Pages as static sites, with no Vercel-specific features.

- Configure Next.js with output: 'export' (and trailingSlash if needed).
- Remove anything that needs a server at runtime: middleware, API routes, next/image optimisation (use unoptimized images or pre-optimised files) and dynamic Open Graph image routes (replace them with static PNG files in /public).
- Replace the admin basic-auth middleware with a note that Cloudflare Access will protect the admin domain. Keep robots noindex on admin.
- Add _headers and _redirects files for security headers, long caching of static assets, and the fallback for /app/* routes.
- Keep the PWA service worker working under static export, and test offline mode.
- Write DEPLOY.md with Cloudflare Pages settings: build command, output directory, root directory per app, and environment variables. Keep Vercel only as an optional note.
- Run a production build for both apps and test the output with a local static server.
```

**Manual steps in Cloudflare (do these yourself):**

1. Create a Cloudflare account and add your domain, or connect the domain you already use.
2. In **Workers and Pages**, create a Pages project from your GitHub repository for `apps/web`. Use the build command and output folder from `DEPLOY.md`. Add `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_WHATSAPP_NUMBER`.
3. Create a second Pages project for `apps/admin` on an `admin.` subdomain.
4. Put the admin domain behind **Cloudflare Access** (check that the free plan covers your small team) so only your email addresses can open it.
5. Point `askalert.com` to the web project, test on your phone, and only then switch off the Vercel deployment.

Before you rely on any free tier for a commercial product, read each provider’s current terms.

## Prompt 14: Webhook front door on a Cloudflare Worker

```
Create apps/edge-webhooks, a Cloudflare Worker (TypeScript, wrangler) that is the single front door for incoming webhooks.

- GET /whatsapp: answer Meta's verification challenge using WHATSAPP_VERIFY_TOKEN.
- POST /whatsapp: verify the X-Hub-Signature-256 header with WHATSAPP_APP_SECRET using a constant-time comparison. Reject invalid requests with 401. Parse the payload. DROP status events of type sent, delivered and read. KEEP incoming messages and failed statuses. Deduplicate by message id. Forward the kept events to SUPABASE_FUNCTION_URL with a shared-secret header, and return 200 quickly.
- POST /paystack: verify x-paystack-signature (HMAC SHA512 with PAYSTACK_SECRET) and forward verified events only.
- Never log message contents or phone numbers. Log only counts and error codes.
- Add Vitest tests with fixture payloads: valid, invalid signature, status-only and duplicate.
- Add wrangler.toml with placeholders. Document that secrets are set with wrangler secret put, and add the deployment steps to DEPLOY.md.
```

**Checks:** tests pass, and a status-only payload is dropped while a message payload is forwarded.

## Prompt 15: Supabase on the free plan (replaces Prompt 11)

Create your Supabase project first (choose the region deliberately). Then paste:

```
Add Supabase to the monorepo so the backend runs on the Supabase free plan with no always-on server.

1. Use the Supabase CLI. Create migrations for: areas, categories, category_versions, category_attributes, category_areas, vendor_requirements and audit_log. Every table has created_at and updated_at.
2. Row-level security: the public can read only Live categories and their published attributes. Only admin roles can write. Every admin write creates an audit_log row.
3. Seed the nine categories from packages/category-engine and the Lekki area hierarchy (Lagos, Eti-Osa, Lekki Phase 1, Lekki, Victoria Island, Ikoyi, Ajah, Oniru).
4. Queue: use pgmq and pg_cron, not pg-boss. Create the queue migrations, an enqueue function, and a cron job that runs every minute and calls a Supabase Edge Function to process pending jobs in small, idempotent batches with retries and a dead-letter table.
5. Create the Edge Function that receives events forwarded by the Cloudflare Worker, checks the shared secret, stores event ids for deduplication, and enqueues jobs. Add a clear handler skeleton with tests. No business logic yet.
6. Retention: a scheduled job that removes media references older than 30 days and archives message bodies older than 90 days, keeping summaries.
7. Monitoring: a daily job that records database size and writes a warning row above 350 MB, and a small admin dashboard card that shows it.
8. Backups: a GitHub Actions workflow that runs pg_dump nightly using a read-only connection string stored as a repository secret, encrypts the dump, and uploads it to private storage. Document how to restore it, and include a restore test.
9. Keep-alive: a scheduled GitHub Action that calls a health endpoint daily so the free project is not paused.
10. Generate TypeScript types and a typed client in packages/db. Connect the admin Category editor and the web request form to the database behind a feature flag, keeping mock data as a fallback for local development.
11. Update .env.example and DEPLOY.md, including the upgrade triggers: the first real escrow hold means upgrading to Supabase Pro for daily backups and no pausing.
```

**Checks:** create and publish a category in admin and see it in the web app. Run the backup workflow once and restore it into a scratch project.

## What to watch after launch

- Database size, Worker requests per day, Edge Function invocations, and egress, in one weekly report.
- Upgrade Supabase to Pro at the first real escrow hold.
- Re-check free-tier limits and terms every quarter.

## Phase 2 prompts (16 to 21): chat, push, plans, usage and cost

Run these **after Prompt 15** (Supabase). WhatsApp stays **mocked** until your WhatsApp API account is ready, so nothing here can send a real WhatsApp message or cost money. All prices and limits are placeholders that the admin can change (they live in configuration, not code).

## Prompt 16: Conversation store and in-app chat

```
Build the shared conversation store and the enhanced in-app chat in apps/web, using Supabase (Prompt 15) with the mock fallback.

Database (migrations with RLS): threads (id, request_id, buyer_id, vendor_id, status), messages (id, thread_id, sender_role: buyer|vendor|agent|system|admin, channel: app|whatsapp|web_link, body, media jsonb, filtered boolean, delivered_at, read_at, created_at), saved_replies (user_id, text), message_budgets (request_id, relayed_count, ai_suggestion_count). Users can read only the threads they belong to.

Chat UI under /app/chat: a thread list per request with unread badges; a thread view with message bubbles, delivery and read ticks, photo attachments (JPEG, PNG or WebP only, max 3 MB each, compressed on the device, max 5 per thread), saved quick replies, a typing indicator, a 'Compare quotes' side-by-side view for the vendors in one request, and a note 'Contact details are shared after booking'. Use Supabase Realtime for live updates, with a polling fallback.

Channel adapter interface in packages/channels: ChannelAdapter { send(message, context), supportsRelay }. Implement AppAdapter now, and a WhatsAppAdapter STUB that writes an outbox row instead of sending. Every outbound relayed message must go through checkEntitlement (Prompt 18) before it is sent.

Anti-leakage v1: a pure function maskContactDetails(text) that detects Nigerian phone formats (+234, 0803, 0701 and similar, with spaces, dots or dashes), emails, links, social handles, and phrases like 'call me' and 'DM me'. It returns the masked text and a flag. Show a friendly notice when masking happens. Add at least 25 test cases, including obfuscations such as 'o8o3' and digits spelled out in words.

Add a development-only simulated vendor that replies after short delays, so the chat can be demonstrated without WhatsApp.

Run lint, typecheck and tests.
```

**Checks:** open two browser windows (buyer and simulated vendor) and chat. Paste a phone number into a message and confirm it is masked.

## Prompt 17: Web push notifications (no Firebase)

```
Add web push notifications to apps/web with a PushProvider interface (packages/channels) and a self-hosted VAPID implementation. Do not use Firebase.

- Generate VAPID keys (document how; keep them in environment variables and never commit them). Table push_subscriptions (user_id, endpoint, keys, device_label, created_at, last_success_at, failed_count). RLS: users manage only their own rows.
- Service worker: handle push and notificationclick (open the right in-app URL). Notification text must be generic (for example 'You have a new quote'), never names, prices, phone numbers or addresses.
- UI: a 'Turn on notifications' button in Account, and a gentle prompt shown only after the user creates their first request. Never ask on first load. On iPhone Safari, explain that notifications need the app added to the Home Screen and then enabled from the Home Screen icon. On Android use the standard flow. Show clear states: not supported, blocked, enabled.
- Sender: a Supabase Edge Function send-push that uses a Deno-compatible Web Push library (explain the choice), removes subscriptions that return 404 or 410, and records failures.
- Notification centre in the app: a list with read state, stored in a notifications table. Push is only a delivery channel for the same record.
- Email fallback for important events (quotes ready, booking confirmed) using a provider with a free tier (explain the choice and keep it behind an interface).
- User notification preferences: channels per event type, and quiet hours (default 21:00 to 07:00).
- Tests for payload building, subscription cleanup and preference rules.
```

**Checks:** on an Android phone, install the PWA, enable notifications, and trigger a test push with the app closed. On an iPhone (iOS 16.4 or newer), add to Home Screen, open from the icon, and enable.

## Prompt 18: Plans, entitlements and the usage ledger

```
Build plans, entitlements and the usage ledger (packages/core and migrations).

Tables: plans, plan_versions (price_minor, period_days, limits jsonb, features jsonb), subscriptions (user_id, plan_id, version, starts_at, ends_at, status), credit_wallets, credit_transactions, and usage_events (user_id, request_id, type: ai_tokens|wa_service|wa_utility|wa_template|sms|stt|places|push|email, units, est_cost_minor, created_at), plus a settings table for unit costs.

Seed plans as configuration, not code:
- buyer_free: 2 requests per month, 4 vendors per request, about 30 relayed messages, about 10 AI suggestions, 1 standing alert, WhatsApp off.
- buyer_starter (placeholder price 300000 kobo per 30 days): 6 requests, 8 vendors per request, about 150 relayed messages, about 60 AI suggestions, 3 standing alerts, WhatsApp on, booking fee waived.
- vendor_free: about 20 WhatsApp lead alerts per month, about 60 chat messages, earn 10 more lead alerts for each completed platform-paid booking, digest and push as fallback.
- vendor_pro (disabled for now): unlimited lead alerts, verified badge, tools.

Pure, tested functions: getActivePlan(user), checkEntitlement(user, action, context) returning allow, warn_at_80 or block with a plain-language reason and a suggested next step, recordUsage(event), getUsageSummary(user), applyEarnedCredits(vendor, booking), and estimateCost(event) using unit costs read from the settings table, so the WhatsApp price per message is editable and never hard-coded.

In the app: a 'Your plan' screen that shows remaining requests, vendors per request and messages in plain language (never tokens or technical units), a warning at 80%, a clear block message at 100% with 'Top up' and 'Get Starter' buttons, and a purchase flow for prepaid passes and credit packs that currently completes with a mock payment (Paystack is added later).

Every costly action in the code must call checkEntitlement first: starting a request, contacting vendors, relaying a message, requesting an AI suggestion, and sending a WhatsApp message.

Write thorough tests, including exactly 80% and 100% limits, expired passes, and concurrent usage.
```

**Checks:** use up the free allowance in a test account and confirm the warning and the block messages read clearly.

## Prompt 19: Notification router and vendor lead rules

```
Build the notification router and vendor lead delivery rules in packages/core.

- Event priorities: critical (booking confirmed, payment issue), high (quotes ready, vendor replied), normal (reminders), low (tips).
- routeNotification(event, user, context) chooses channels in this order: in-app, push, email, WhatsApp (only if the user's plan enables it and the budget allows), SMS (critical only, and only if allowed). Use cheaper channels first and escalate only if the event is still unread after a delay that depends on priority. Respect quiet hours and user preferences. Record every send in usage_events.
- Vendor lead delivery: scoreVendorResponsiveness (response rate over the last 10 leads and median reply time). Throttle rules: a vendor who ignores 3 leads in a row moves to a digest plus push only until they respond; batch several leads into one message or a daily digest; never exceed the vendor's monthly lead allowance; apply a per-request message budget.
- A DeliveryPlan object that explains in plain language why each channel was chosen or skipped (shown in the admin console).
- Tests for routing, throttling, batching and quiet hours.
```

## Prompt 20: Admin pages for Plans, Usage and Cost

```
Add three sections to apps/admin using the Supabase data and the mock fallback.

1. Plans: list plans, edit a plan with versioning (price, period, limits, features), preview what a user on that plan can do, publish with a change note, and roll back. Validate with Zod. Changing a plan must never affect the active period of existing subscribers.
2. Usage: search a user and see their plan, remaining allowances, usage events and cost to date, with filters by type and date. Add a button to grant a one-off credit with a required reason, written to audit_log.
3. Cost: a dashboard with estimated cost by day and by type (AI, WhatsApp, SMS, speech-to-text, maps), cost per request, cost per booking, the top 20 users by cost, vendors over their allowance, and a configurable alert threshold (for example when daily cost exceeds a set amount or a single user exceeds a set cost). Include a settings page for unit costs (WhatsApp price per message, AI cost per request, SMS price) so estimates can be corrected when prices change.

Charts must be accessible and use the brand tokens. Only super admin and operations roles can edit plans and unit costs.
```

## Prompt 21: Plans section on the landing page

```
Add a Plans section to the landing page and a /plans page.

Content: Free and Starter for buyers, and 'Free for vendors' with a short note about lead alerts. Explain in plain English what 'WhatsApp chat' means (messages and alerts on WhatsApp) and what the free in-app chat includes. Read prices from the plan configuration. Add a short FAQ: Why does WhatsApp cost extra? What happens when I reach my limit? Can I buy extra? What does 'hold' mean?

Update the WhatsApp FAQ answer to: 'Message us on WhatsApp and we will send you a link to continue in the app. WhatsApp chat is part of Starter.'

Keep the design consistent with the design system and keep Lighthouse scores at 90 or more.
```

## Suggested order and what to do while WhatsApp is not ready

1. Run 18 first (plans and usage), because everything else checks it.
2. Then 16 (chat), 17 (push), 19 (router), 20 (admin), and 21 (landing).
3. Keep the WhatsApp adapter as a stub. When your WhatsApp API account is ready, the next prompt connects the real adapter, behind the same entitlement checks.
