# Add an escrow provider in six steps

AskAlert keeps booking, claims and ledger code provider-neutral. To plug in Payluk (or any other licensed partner):

1. **Read the partner API docs** (paste them into Cursor). Do not invent endpoints.
2. **Implement `EscrowProvider`** in `packages/payments/src/providers/<name>/`:
   - `capabilities()` reflecting what the partner really supports
   - `createEscrow`, funding instructions, release, refund, `pause` / `resume`
   - `verifyWebhookSignature` + `parseWebhook` → normalised events only
   - Idempotency keys on every outbound call; map errors into plain English
3. **Pass the shared contract suite** in `src/contract-tests/escrow-contract.ts` against a fake HTTP server and the partner sandbox.
4. **Register the adapter** in `EscrowProviderRegistry` (disabled by default), add Worker route `/<name>`, and admin Provider settings.
5. **Configure fee model + legal wording** in config (not hard-coded). Terms/Privacy placeholders for the institution’s legal name and licence.
6. **Migration plan**: switch default provider, keep in-flight escrows pinned to `provider_key`, optional per-category overrides, kill switch and drain mode.

Never add provider-specific columns to core tables. Store provider ids in `external_refs`.
