# AskAlert

**Ask. Alert. Delivered.**

AskAlert is an agentic marketplace where an AI agent finds vendors or buyers, negotiates, and recommends the best options.

Launch market: Lagos, Nigeria.

## What’s here

This monorepo will hold:

- `apps/web` — customer-facing web app
- `apps/admin` — admin shell
- `packages/ui` — shared UI and design tokens
- `packages/category-engine` — category logic
- `packages/payments` — money and payment helpers
- `packages/config` — shared config

Phase 1 focuses on project setup and first designs with mock data. Backend comes later.

## Setup

```bash
pnpm install
pnpm dev
```

- Web app: http://localhost:3000
- Admin app: http://localhost:3001

Quality checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
