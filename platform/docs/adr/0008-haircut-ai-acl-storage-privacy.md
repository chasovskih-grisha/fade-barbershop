# ADR 0008. `haircut-ai`: ACL of provider, photo storage and privacy

- Status: accepted
- Date: 2026-09-09

## Context

`haircut-ai` (Supporting) generates 3–4 AI haircut variants from client photo (`SourcePhoto` → `HaircutSuggestion`). Criteria `02-ai-haircut-suggestion.md` require: client consent before generation (AI-WEB-02), delete photo anytime (AI-WEB-07), ban public routes (AI-WEB-08), access only to owner, barber of assigned visit and admin (AI-ADM-05).

Three open risks to close by decision:

1. **Provider** — external AI generation service (choice and budget — open question `02`). If its API "leaks" into domain or photo goes directly to provider, we lose control: provider replacement = domain rewrite, photo recall impossible, provider-side retention terms unknown.
2. **Storage** — photo with client face — personal data. Postgres bytes bloat database, complicate backups and streaming.
3. **Privacy** — access, consent, retention and deletion must be controlled and verifiable.

Alternatives:

1. **Photo goes directly from client to provider** — we have no master copy: can't recall, guarantee deletion, change provider without losing history.
2. **Store photo in Postgres (`bytea`)** — bloated backups, no CDN/object access, complicated audit.
3. **Store "raw" provider response in domain** — domain depends on foreign schema; provider change breaks models.

## Decision

### 1. Provider — via ACL, generation asynchronous

- In domain `haircut-ai` — only port **`AiGenerationGateway`** (interface: "create generation task", "get result by ID"). No provider types in domain.
- Infrastructure adapter (`infrastructure/`) — only place knowing specific API. Provider choice — config (env), not code.
- Generation **asynchronous**: `request` → queue (Redis jobs) → poll → result. Decision: result — via **polling** from our worker, not webhook (no public endpoint; webhook possible later only as HMAC signal "poll earlier", content never result source). Port and conveyor details — README `haircut-ai`. `HaircutSuggestion` has `GenerationStatus: pending | processing | ready | failed` (see `ubiquitous-language.md`).
- Provider receives **only** what needed for generation (photo, parameters); provider response translated to our variants and not stored "raw".
- `SourcePhoto` uploaded first **to our storage**, and from there passed to provider — we hold master copy and retention control.

### 2. Photos — object storage, in Postgres only metadata

- `SourcePhoto` and results — in **private S3-compatible bucket** (server-side encryption), not in Postgres.
- In Postgres — metadata: object key, content type, size, `ClientProfileId`, status, creation time.
- Access — **short-lived signed URLs** (TTL minutes) via API; no public URLs. Authorization in application layer: owner | barber of assigned visit (via `scheduling`) | admin.
- Bucket private at policy level; public route in API for client photos doesn't exist (AI-WEB-08).

### 3. Privacy — consent, retention, deletion

- **Consent**: before first generation fixes record of consent to AI photo processing (AI-WEB-02); without it generation unavailable.
- **Retention**: auto-deletion after **12 months** after last client activity — **founder decision accepted** (default; configurable by admin, AI-ADM-06). "Activity" = last visit or last upload/generation — whichever later. Client can delete photos and results anytime (AI-WEB-07).
- **Deletion**: hard-delete from storage and metadata; when deleting photo that was visit reference (`HaircutReference`), link from `scheduling` nullified (AI-ADM-05).
- **Audit**: admin access to photos and limit corrections logged; event `SuggestionFailed` stores reason (for monitoring, AI-ADM-04).

## Consequences

- Provider **replaced by config** without domain changes: budget/quality decision doesn't block implementation.
- Client rights (consent, deletion, recall) fulfilled because master copy ours.
- Need S3-compatible provider and queue (Redis jobs) — both already in stack (`infra/`).
- Cost: pay for storage and egress, not for transit through provider.
- Test invariant: no domain test imports provider types; photo without valid ACL check unavailable even with valid signed URL.
