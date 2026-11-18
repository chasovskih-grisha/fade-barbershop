# ADR 0015. `feedback`: feedback photo storage, access and privacy

- Status: accepted
- Date: 2026-09-11

## Context

`feedback` (Supporting) stores reviews about completed visits: rating, text, **optional photos — up to 3 per review** (`FeedbackPhoto`). Criteria `06-feedback-reviews.md` require: review right only from `scheduling.AppointmentCompleted` event (FDB-001), editing/deletion by client, site publication — later (phase 25, `21-public-reviews.md`) with explicit consent (FDB-WEB-05) and default-deny moderation (PUB-001/002).

Feedback photo — personal data. Storage pattern already proven in ADR 0008 (`haircut-ai`): private object storage, metadata in Postgres, short-lived signed URLs, ACL in application layer. This decision applies same pattern and fixes **differences**, not repeats 0008 verbatim.

Two things here fundamentally different from `haircut-ai`:

1. **Lifecycle tied to review, not client activity.** Rule "12 months after last activity" (AI-ADM-06) not applicable here: review — part of client history, and after phase 25 — public site.
2. **Public projection exists.** `haircut-ai` never shows photos publicly; published review (PUB-*) — shows. This adds revocation obligation, which 0008 doesn't have.

Alternatives:

1. **Photos in Postgres (`bytea`)** — same problems as in ADR 0008: bloated backups, no streaming/CDN, complicated audit.
2. **Shared bucket with `haircut-ai`** — lifecycles and policies different; error at mass deletion/moderation of feedback photos shouldn't have blast radius on AI photos (and vice versa).
3. **Public bucket/CDN from start** — private review photos would become public by URL; breaks FDB-006 (private in first release) and not subject to revocation.
4. **Store forever "just in case"** — photo without live review — personal data without legal basis; retention must flow from aggregate lifecycle.

## Decision

### 1. Same storage pattern, separate bucket

- `FeedbackPhoto` — in **private S3-compatible bucket, separate from `haircut-ai`** (server-side encryption). In Postgres — only metadata: object key, content type, size, `FeedbackId`, order in gallery.
- Access — **short-lived signed URLs** (TTL minutes) via API. Authorization in application layer: **review owner | barber of completed visit | admin** (moderation/support) — same ACL triangle as in 0008.
- Upload in v1 — **via API** (proxy): format control (jpg/png/webp), size (up to 10 MB) and count (≤ 3) in one place, without separate flow with presigned-PUT. Presigned upload directly to bucket — optimization later, when volume grows; client contract unchanged.

### 2. Photo lifecycle = review lifecycle

- Photo has no own retention: lives exactly as long as aggregate `Feedback` lives. No separate background cleanup needed.
- **Review deletion by client** (FDB-WEB/MOB) or moderation → hard-delete all its photos from storage and metadata.
- **Editing**: client-replaced photo deleted immediately, not "written over" — no orphans in bucket.
- Client deletion as person (right to be forgotten) → cascade: reviews (and photos) deleted completely; published copies — see below.

### 3. Public projection (phase 25) — copy, not link

- At review publication (PUB-001: consent + moderation + toggle) photo **copied** to separate public artifact (`content` OHS — same path site reads public data generally; public page never pulls from private bucket).
- Private copy remains source of truth. Consent revocation or moderation removal (PUB-002/003) → immediate site removal **and public copy deletion** + CDN invalidation.
- Review deletion by client after publication → same: delete private and public copies by one cascade.
- On public pages photos optimized (resize/formats) — this transformation executed once at publication, not on the fly from private bucket.

### 4. Audit and tests

- Admin access to photos outside moderation queue logged (as in 0008).
- Test invariants: feedback photo unavailable even with valid signed URL without ACL check; public route returns only published copies from `content`; no site component contains links to private bucket.

## Consequences

- Pattern 0008 reused without approach change — team gets second context under same rules; difference fixed and justified (bucket, lifecycle, public copy).
- Public projection adds **new operational obligation**: deletion = cascade to two storages + CDN invalidation. Appears only with phase 25 and already built into deletion contract.
- Cost: storage and egress, without external provider (unlike `haircut-ai`, ACL here — only to storage, not to AI service).
- Retention reports (AI-ADM-06 style) for feedback not needed — lifecycle self-sufficient.
