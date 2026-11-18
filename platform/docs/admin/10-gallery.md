# Admin Panel — Gallery / Media Moderation Domain

## Purpose
Moderation of media content (work photos before/after pairs). Handles consent management, publication status, and client consent withdrawal. Core flow: new item → moderation queue → admin review → publish/hide/remove; client can withdraw consent at any moment, hiding the item instantly.

## Pages & Features
- **Moderation Queue & List** (`PRT-ADM-01…04`)
  - **Layout**: Top — "Moderation queue" (new items with client consent); Below — all items filtered by barber, location, status
  - **Item statuses**: `pending_consent` → `pending_review` → `published` / `hidden` (PRT-006)
  - **Item card**: Before/after preview; Barber, Location, Visit date, Consent status (when, type: anonymized/identified), Actions
  - **Actions** on item:
    - **Publish** — immediate, visible on barber profile and gallery page; if consent withdrawn → automatic hide
    - **Hide** — immediate, removes from public view; visible in list as status change
    - **Reject** — with reason to barber; item moves to `hidden` status; client consent withdrawal hides it automatically
  - **Filters**: Status (Pending consent / Pending review / Published / Hidden), Barber, Location, Date range

- **Item Moderation** (`PRT-ADM-02`)
  - **Before/After preview**: Pair of images; hover to compare; download option
  - **Source**: Visit → appointment card photo, AI variant, or feedback photo
  - **Client consent**: Recorded at visit completion — when, which variant agreed to (identified / anonymous / none)
  - **Actions**:
    - **Publish** — immediate public release; if consent was anonymous, no client identifier shown; if identified, client name shown (opt-out possible)
    - **Hide** — immediate removal from public view; item status changes to `hidden`; visible in queue
    - **Reject** — with cause reason (textarea); item moves to `hidden`; lógico (barber can override with justification)
  - **Consent withdrawal**: If client later withdraws consent (`PRT-006`); item hides automatically from public; status changes in queue; admin sees "Consent withdrawn" tag

## API Endpoints
Gallery/moderation API under the portfolio module:

- `GET /admin/portfolio/moderation-queue` — List items pending consent or review
- `GET /admin/portfolio/items?status=&barber=&location=` — List all items with filters
- `GET /admin/portfolio/items/:id` — Get item details with before/after URLs and consent info
- `PATCH /admin/portfolio/items/:id` — Update status: publish, hide, reject (with reason)
- `POST /admin/portfolio/items` — Add new item from visit (post-visit, consent collected)
- `PATCH /admin/portfolio/items/:id/consent` — Update client consent status (withdraw/change)

## DTOs (inferred)
- `PortfolioItemDto`: id, barberId, locationId, visitId, beforeImageUrl, afterImageUrl, consentStatus (`pending_consent` / `identified` / `anonymous` / `withdrawn`), consentGivenAt, consentType, status (`pending_review` / `published` / `hidden`), rejectReason, createdAt, barberNotes
- `ConsentStatusDto`: type (`identified` / `anonymous` / `withdrawn`), givenAt, withdrawalAt?

## Business Rules
- **Two-step consent**: Client agrees to photo publication after visit; consent recorded with type: identified (name shown) / anonymous (no name) / none
- **Publish = consent + moderation**: Publishing requires both valid consent AND admin moderation approval; either one blocking publishes
- **Client withdrawal**: If client withdraws consent at any moment → item hides immediately from public; status changes to `hidden`; visible in moderation queue with "Consent withdrawn" tag
- **Status flow**: `pending_consent` → (if no consent) blocked; (if consent given) → `pending_review` → (`published` / `hidden` on admin action)
- **Reject reason**: Required when admin rejects; logged with timestamp and admin ID; barber can override with justification
- **Identified vs anonymous**: Identified items show client name (if client hasn't opted out); anonymous items show no client info; withdrawal possible for both types
- **Before/after pair**: Must be published together; cannot publish only before or only after; single action toggles both

## Permissions
- `admin` role only (v1) for moderation actions (publish, reject, hide)
- Barber: can view items related to their visits; can initiate reject with reason
- Client: cannot directly moderate; can withdraw consent (via mobile profile or web cabinet)
- Direct URL access without role → 403

## Development Notes
- Before/after URLs: signed URLs stored in MinIO/Media bucket; accessible via API; expire after configurable time
- Consent recorded at visit completion via `PortfolioCompleted` event or similar; linked to `Appointment` or `AppointmentParty`
- Consent withdrawal: real-time event `ClientConsentRevoked`; moderation queue updates instantly; item hides from public immediately (no page refresh needed for admin)
- Publish action: sets status to `published`; triggers push notification to barber mobile; item appears on barber profile and gallery page
- Reject with reason: stores reason; barber can see reason in their mobile; logged for audit trail
- Filter performance: moderate number of items (hundreds, not thousands); pagination with cursor-based scroll

## Important Edge Cases
- Client withdrawing consent: item hides immediately; admin sees "Consent withdrawn" badge in queue; previously published items remain live (no retroactive hide) — *or* do they hide? per PRT-006 this needs clarification; the spec says " hides the element immediately without admin action"
- Identified consent with later withdrawal: item hides; if already published, stays published? spec says "hide element immediately without admin action" — implies new publishes blocked, existing keep status
- Before/after pair: single atomic action; cannot publish one without the other; UI enforces this
- Reject reason: mandatory for moderation rejection; barber can override with their own justification (logged)
- Consent type "identified": client name shown on gallery; client can later opt-out via profile, which withdraws consent and hides the item
- New items: appear at top of moderation queue; timestamped; auto-expire after 90 days if not reviewed?

## Links to Related Documentation
- `docs/acceptance-criteria/15-public-gallery.md` (PRT-ADM-01…04)
- `docs/acceptance-criteria/12-no-show-policy.md` (no direct link, but gallery items tied to completed appointments)
- `docs/ubiquitous-language.md` (PortfolioItem, ClientConsent, PublicationLifecycle, ReviewGating)
- `docs/roadmap.md` (phase 19 — public gallery; phase 10 — AI haircut suggestions source)
- `docs/admin-screens.md` (§11 — gallery moderation)
- `docs/adr/` (ADR 0006 — AgreedPrice not affected; PRT-006 — consent withdrawal mechanics)