# T-043 · Haircut Reference + Appointment Comment

- **Stage**: M1 (phase 4) · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-041
- **StoryPoints**: 5

## What

Flow screen 4: three reference sources (AI — from phase 10, uploaded photo, none), comment ≤ 500 plain text; snapshot on booking. Client edits before barber confirmation (REF-WEB-04); admin sees in calendar (REF-ADM-01…04).

## Why

Source of trust and exact client expectations; phase 4 gate.

## Sources

- `REF-WEB-01…06`, `REF-ADM-01…04`; `booking-flow.md` screen 4

## Done

- [x] Uploaded photo and comment work end-to-end (comment and reference ID — backend done 2026-09-26; **photo upload done 2026-09-28**: `POST /booking/reference-photos` → private MinIO/S3 bucket, photoId → Booking snapshot; live verification 201 + object in bucket)
- [x] Editing blocked after confirmation (client — only while `booked`; admin — any live status; barber does not edit)
- [x] "My Visits" UI: client sees comment and **edits** reference/comment (REF-WEB-03/04/05) — closed 2026-10-02, see "Current slice (2026-10-02)"
- [x] Reference visible on booking confirmation screen (REF-WEB-03) — closed 2026-10-02: `GET /booking/reference-photos/:id` with short-lived signed URL, ACL in application layer (ADR 0008 §2)
- [x] Reference photo thumbnail in "My Visits" (REF-WEB-03) — closed 2026-10-02: read-model returns `referenceId` instead of empty `referenceUrl`, client fetches short-lived signed URL via separate request (`useReferencePhotoUrl`)
- [x] Barber sees reference in visit card (REF-BARBER) — closed 2026-10-05: `GET admin/reference-photos/:id` + `BookingReferenceCard` in admin visit card (see "Current slice (2026-10-05)"). Day calendar remains with "has reference" marker without photo (REF-BARBER-03 partial), "processed" — out of v1.
- [x] "My Visits" UI on mobile (REF-MOB-02) — closed 2026-10-09, see "Current slice (2026-10-09)"
- [ ] Subscriber `scheduling.appointment.reference_changed` is idempotent (T-061 pattern)

## Current slice (2026-09-26, backend)

- Schema: nullable `haircutReferenceId` + `appointmentComment` on Booking row (migration `20261102020000_haircut_reference`) — reference ID only without copying photo (bounded-contexts invariant). Snapshot on booking: `POST /admin/bookings` accepts `reference: { haircutReferenceId, appointmentComment }` (`BookAppointment` validates comment ≤500, REF-WEB-02, to any booking).
- `SetAppointmentReference` (`scheduling/application/set-appointment-reference.use-case.ts`) + `POST /admin/appointments/:id/reference`: client — while `booked` (after confirmation `ReferenceLockedError` → 409, REF-WEB-04); admin — any live status (REF-ADM-04); barber — 400; terminal statuses — `InvalidTransitionError` → 409; comment >500 → 400 without booking.
- Aggregate: `setReference` (empty string clears value; event `scheduling.appointment.reference_changed` in outbox in the same transaction — change log for REF-ADM-03, payload without undefined fields).
- Coverage: unit (aggregate, events — 2 new contract table rows, use case 100%, BookAppointment snapshot/validation) + e2e (snapshot on booking, edit/lock/admin/barber/501/404/clear, event in outbox). Full suite 459/459.
- Remaining: photo thumbnail in "My Visits" (requires `referenceId` in `GET /booking/appointments` read model), mobile REF-MOB-*, barber view in visit card (REF-BARBER-*), idempotent event subscriber (T-061 pattern).

## Current slice (2026-09-28, photo upload)

- `haircut-ai` context organized per convention: `domain/ports.ts` — **`PhotoStorage`** port (`put` → metadata, `signedUrl` — short-lived); `application/upload-photo.use-case` — format validation (jpg/png/webp) and size (≤10 MB, REF-WEB-05) + save via port; `infrastructure/s3-photo-storage` — single adapter with contact to `@aws-sdk/client-s3` (private bucket `haircut-ai-photos`, key `ownerId/date/uuid`, SSE per env `S3_SSE` — MinIO rejects without KMS).
- `POST /booking/reference-photos` (multipart, multer memoryStorage): controller in booking flow, `InvalidPhotoError` → 400, missing file → 400. Without client session (T-041) ownerId → `anonymous/`; listing per identity session — along with clientId.
- Web: `HaircutReferenceStep` uploads file to server immediately upon selection (`referencePhotoApi.uploadReferencePhoto` → FormData → rewrite `/booking/*`), preview — data URL (private bucket does not serve public URLs), photoId goes into `confirmBooking` as `haircutReferenceId` (placeholder removed).
- Live verification on dev stack: POST jpeg → **201 `{photoId}`**, object in bucket (`mc ls`), gif → **400**; use case unit 6/6, api suite 616/616, web 44/44, tsc clean.
- Remaining (conscious): metadata listing on Postgres — along with SourcePhoto (phase 10, T-050); webhook redirect does not apply.

## Current slice (2026-10-02, editing in "My Visits" — REF-WEB-04)

Backend was ready since 2026-09-26, but client route had no UI, and button was **unreachable**: reference block in visit card rendered only under `app.referenceUrl`, and read model returns empty string (`list-client-appointments.ts:69` — `referenceUrl: ''` unconditionally). Thus "Edit" never rendered — REF-WEB-04 was unreachable, not unimplemented.

- **Button availability.** Block now visible when photo, comment, or `canEditReference` present; photo not attached — honest state instead of empty hole. Edit permission comes from server (`canEditReference: domainStatus === 'booked'`), client does not invent it.
- **Dialog** `ReferenceEditDialog` + `ReferenceEditForm` (LOC gate): comment with 500-char counter (REF-WEB-02), photo replacement via existing `useReferenceUpload`/`UploadReferencePanel` (without duplicating format/10MB validation), photo removal. `useReferenceEditor` holds state, `useVisitCommands` — commands (page hook was near 100 lines).
- **`undefined` ≠ `''` contract.** Unchanged field **not sent** (`undefined`), empty — clears value (`''`). Difference is non-obvious and breaks editing, so fixed with tests on both ends.
- **Lock after confirmation.** Server responds 409 (`ReferenceLockedError`); error shown in dialog, not swallowed.
- **Coverage.** web 9 tests (`reference-edit.test.tsx`): button availability/lock, comment change, unchanged comment, space clearing, 500 limit, photo removal, 409 display, block without photo. **Closed API test gap:** client route `POST /appointments/:id/reference` not covered (only admin was) — added `client-appointment-reference.spec.ts` (5 tests: 401 without session, actor from session, ignore `actorId` from body, `undefined`/`''`, 404 on other's visit). Gates: web **70/70**, api unit **785/785** (175 suites), e2e **78/78** (26), typecheck/lint clean.
- **Remaining open (within this task):** haircut reference thumbnail in "My Visits" — read model does not return `referenceId`, and photo is in private bucket, so signed URL needed (`list-my-ai.ts` pattern). This is REF-WEB-03 "reference as reduced image" and currently unclosed; barber view (REF-BARBER) and idempotent event subscriber — separate items.

## Current slice (2026-10-02, signed reference URL — REF-WEB-03)

Thumbnail on confirmation screen is REF-WEB-03, but not public photo: bucket is private (ADR 0008 §2), so **short-lived signed URL** with application-layer permission check is needed.

- **Route.** `GET /booking/reference-photos/:id` → `GetReferencePhotoUrl` (`haircut-ai/application/get-reference-photo-url.ts`) → `storage.signedUrl(objectKey, SIGNED_URL_TTL_SEC)`. Rewrite `/booking/:path*` in [next.config.js](apps/web/next.config.js) already covers route — no separate rule added. Session mandatory (`webClientId(..., required: true)`), without it 401 and use case not called.
- **ACL in application layer (ADR 0008 §2).** Implemented **own** half of rule: `photo.ownerId === actorId`. Barber of assigned visit and admin belong to their surfaces (admin visit card), not this client endpoint. Unknown `photoId`, other's photo, and soft deleted (`deletedAt`) give **single** `404` response — to prevent leaking photo existence.
- **Session bypass.** Anonymous upload writes `ownerId = 'anonymous'` (`upload-photo.use-case.ts`), so guest **will not get** photo through this endpoint. For them UI shows local data-URL preview already in memory after upload. This is conscious decision, not bypass: endpoint requires session to avoid handing out photos to anonymous users by any id.
- **UI.** `ReferenceThumbnail` tries to get signed URL, and if unavailable (401/404/network) — falls back to local preview; error **does not** surface on confirmation screen. Promise rejection caught, otherwise unhandled rejection bubbles as global error. URL not cached long — TTL minutes.
- **Coverage.** `get-reference-photo-url.spec.ts` (6) + `reference-photo-url.controller.spec.ts` (3): owner gets URL with short TTL, object signature (not public bucket), other client, unknown id, soft deleted, guest photo not given to authorized, 401 without session, 404 without reason disclosure. Web: `success-step.test.tsx` (6) — signed URL, fallback to preview, promise rejection, no request without `photoId`, empty state. Gates: web **76/76**, api unit **794/794** (177 suites), e2e **78/78**, typecheck/lint clean.
- **Fixed nearby.** `fresh-bootstrap.docker.ts` had `../../../infra/...` instead of `../../../../` — i.e., compose file not found (`apps/infra` doesn't exist) and suite would fail on any machine.
- **Remaining open:** thumbnail in "My Visits" (read model does not return `referenceId` — needed field in `list-client-appointments`), barber photo view (REF-BARBER), idempotent event subscriber.

## Current slice (2026-10-02, thumbnail in "My Visits" + dead cabinet UI)

Thumbnail on confirmation screen was REF-WEB-03, but this is **not a public photo**: private bucket (ADR 0008 §2), so short-lived signed URL needed. For cabinet done similarly, but **without signing on list side**: `ListClientAppointments` returns only `referenceId` (raw `haircutReferenceId`), and client fetches signature via existing `GET /booking/reference-photos/:id`. Reason — otherwise would have to sign URLs for every row, including those whose thumbnails aren't opened, and pull `haircut-ai` into `scheduling`.

In parallel, **dead cabinet UI** sorted out — types promised `finalPrice`/`discounts`/`depositPaid`/`depositRefundStatus`/`reviewSubmitted` and `awaiting_deposit` status, which API never sent (deposit columns in `Booking` none, `Review` model in schema none, `pay-deposit` routes and reviews don't exist). Thus "Pay Deposit" could never render, and "Leave Review" showed on every completed visit and output "Reviews not accepted yet". UI removed by agreement with client; deposit and review backend — separate M4 task (LYL/REV). Also removed "deposit will be refunded to card" banner in cancel dialog (deposit systems none) and fixed regression where `404` turned into empty list — missing route looked like "you have none visits".

Coverage: web **90/90** (21 suite), api unit **796/796**. Live: OTP via Mailpit → `verify` → `GET /booking/appointments` returns `referenceId`.

## Current slice (2026-10-05, reference in visit card for barber — REF-BARBER)

- **Separate route for barber/admin.** Client `GET /booking/reference-photos/:id` has ACL `photo.ownerId === actorId`, and guest photos written with `ownerId = 'anonymous'` (`upload-photo.use-case.ts`), so barber/admin won't get photo through it — this was reason for separate route. Added `GET admin/reference-photos/:id` → `GetAdminReferencePhotoUrl` (`haircut-ai/application/get-admin-reference-photo-url.ts`): role-oriented access (without owner ACL, guest photos allowed), unknown or soft-deleted photo → `ReferencePhotoNotFoundError` → 404 without reason disclosure. Route under global `AdminSessionGuard`; rewrite `/admin/:path*` in [next.config.js](apps/admin/next.config.js) covers it without new rule.
- **Admin visit card UI.** `BookingReferenceCard` (+ `useBookingReferencePhoto`) renders between summary and people block: thumbnail and comment together, without clicks (REF-BARBER-01); click on photo expands it (REF-BARBER-02, `aria-pressed`); when reference/comment absent — honest state without photo and errors (REF-BARBER-04: "Photo not attached" / "Photo unavailable" / "Loading..."). Reference line and comment block removed from `BookingSummaryCard` to avoid duplication.
- **Day calendar — partial.** `VisitCard` shows only "has reference" indicator (without photo and comment), so REF-BARBER-03 closed only for visit card.
- **REF-BARBER-05** ("processed") consciously not enabled in v1.
- **Mobile "My Visits" (REF-MOB-02, partial).** Screen `(client)/account/appointments` reads same `GET /booking/appointments`: statuses via shared dictionary `CABINET_STATUS`, sections "Upcoming"/"Past", thumbnail fetches short-lived signed URL via separate request (same `referenceId` contract as web cabinet). Editing (second half of REF-MOB-02) not yet implemented at that time — "Edit" button only led to visit card; closed 2026-10-09 (see below).
- **Coverage.** api: `get-admin-reference-photo-url.spec.ts` (4) + updated `reference-photo-url.controller.spec.ts`; `jest src/haircut-ai` = **112/112** (21 suite). admin: `BookingReferenceCard.test.tsx` (6); `jest "bookings/[uuid]"` = **13/13**. mobile: `appointments.test.ts` + `reference-photo.test.ts` = **9/9**. Typecheck api/admin/mobile clean.
- **Test infrastructure mobile.** `apps/mobile/jest.config.js` had pnpm-incompatible `transformIgnorePatterns` (React Native Flow syntax not transpiled) — added `.pnpm` to allowlist; `apps/mobile/babel.config.js` resolves `babel-preset-expo` via expo (preset lives in expo dependency tree).
- **Conscious gap.** `pnpm --filter @fade/admin lint` remains red due to **pre-existing** errors in `apps/admin/src/app/bookings/phone/VisitFormFields.tsx` (unused `today`, unused `selectedDateLabel`, complexity 16, 181 lines > 100) — out of scope. From `phone-test-helpers.tsx`, line limit (103 > 100) removed by moving mockators to `phone-route-mocks.ts`.

## Current slice (2026-10-09, editing in mobile visit card — REF-MOB-02)

"Edit" button in mobile card existed, but led to `/appointments/<id>` route which doesn't exist in Expo Router, and `lib/api` had no command — i.e., editing was **unreachable**: lacked both command and form.

- **Command.** `setAppointmentReference` in `lib/api/appointments` (same `POST /appointments/:id/reference`, `credentials: 'include'`) + `ApiError` with status so 409 differs from network error. `useReferenceEditing` holds "which visit is open", busy, and error text; after success list refetches **silently** (without skeleton blink).
- **Access rule same as REF-WEB-04.** Form shown only by `canEditReference` from server (client doesn't invent it); lock after barber confirmation remains server-side — 409 shown in card, not swallowed.
- **`undefined` ≠ `''` contract carried 1:1** from web editor: unchanged field not sent, empty clears value. Save button disabled while no changes — request doesn't search for server error.
- **Photo.** `expo-image-picker` (`~14.7.1`, via `npx expo install`) + `lib/reference-picker` with same limits as web (jpg/png/webp, ≤ 10 MB — ADR 0015 §1), and same multipart route `/booking/reference-photos` (`file` field). Gallery permission checked before picker opens; cancelled selection doesn't touch state. Preview — local file, because bucket private (ADR 0008 §2).
- **LOC/complexity (ADR 0019).** Card exceeded 100 lines → styles in `list-item-styles.ts`; form had complexity 16 → extracted `reference-edit-fields` (comment / photo / checkbox) and `reference-edit-actions` (buttons) with their own styles.
- **Coverage.** mobile **38/38** (7 suite): API — `appointments-reference.test.ts` (5) and `uploadReferencePhoto` in `reference-photo.test.ts` (3); components — `reference-thumbnail.test.tsx` (7: availability and button lock, thumbnail via signed URL, fallback "Photo unavailable", empty block, form only for open visit), `reference-edit.test.tsx` (6: comment change/clear, 500 limit, photo removal, 409 display) and `page.test.tsx` (3: end-to-end from screen — save → refetch, `confirmed` → view only, 409 in card). Typecheck and eslint clean.
- **Remaining open:** reschedule and cancel visit from mobile card (routes in API already exist) and idempotent event subscriber (T-061).

## Risks

- [x] **Migrations**: schema changes break existing data — migration with backfill plan (nullable columns, no backfill — existing rows valid)
- [x] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern) (event written atomically with log; subscribers — T-061)

### Re-verified at 78dab8f8 (2026-11-26)

`grep -rn reference_changed apps/api/src` finds only the admin label
(`scheduling/application/admin-booking-detail.events.ts:13`), the use case and its specs — there is no
subscriber module, so the open Done item (idempotent subscription) is genuine backend work, while this
row is tagged `frontend`. Unblock: a `backend` slice for the subscriber, or retag the row.

## Re-verified at 91202f68

Every `Done` box is ticked except the idempotent `reference_changed` subscriber, and that consumer
still does not exist: `grep -rn reference_changed apps/api/src` finds the event class
(`scheduling/domain/appointment.events.ts:71`), the use case and the outbox assertions, but no
subscriber. That is backend work while the row is tagged `frontend`, and it depends on T-041
(`todo`). Unblocks with a backend row that owns the subscriber.
