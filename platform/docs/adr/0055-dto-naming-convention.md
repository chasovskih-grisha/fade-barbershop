# ADR 0055: Type names at the data boundary — `*Request` / `*Response` / `*Payload`

## Status
Accepted (2026-11-18, T-4605a)

## Context
`Dto` is an empty word: it says nothing about where data came from, where it goes, or
in which direction it moves. The monorepo grew three competing conventions for the same
API answer: `*Dto` in `apps/api` and `apps/web`, `*Input` / `*Result` in
`packages/contracts`, and no suffix at all in `apps/web/src/lib/api/locations.ts`.
`CreateLocationDto` and `LocationDto` sit in one file — a request and a response whose
names do not differ by role. `NearestLocationsResponseDto` already contains the word
`Response` inside, so the `Dto` suffix is pure noise.

Renaming touches four applications and five packages. If each context decides on its
own whether it is `Request` or `Response`, or `Payload` versus `Request`, the result is
a worse convention than `Dto`. This ADR fixes one rule and one complete mapping before
any mechanical rename happens (slices T-4605b…e).

## Decision

One suffix, three values, chosen by the **role of the type in the data flow**:

| Suffix | When | Example |
|--------|------|---------|
| `*Request` | what **enters** the API (body, query, path) | `CreateLocationRequest`, `BookSlotRequest` |
| `*Response` | what **leaves** the API | `LocationResponse`, `AvailableSlotResponse` |
| `*Payload` | what is **not an HTTP boundary**: a queue message, an outbox delivery, an external system's webhook body, a provider request body (SMS/PRRO/acquiring), MCP tool arguments | `BookedPayload`, `PrroCheckoutPayload` |

`Dto` / `Input` / `Result` / `ErrorBody` are forbidden in type names and file names.
The rename mapping is `docs/dto-rename-map.md`; the gate `scripts/validate-docs/check-rename-map.mjs`
rejects a contradiction in that table (a tautology, a `Dto`, a `Response`/`Payload` pair
for the same body). `docs/ubiquitous-language.md` carries the forbidden synonyms.

Domain outbox **events** are events, not payloads, and keep their event names
(`AppointmentCompleted`, `AppointmentCancelled`). Only the body a handler reads from a
queue/webhook/provider call is a `Payload`.

### Payload boundary (question 6)
`Payload` is reserved for the non-HTTP boundary and is not a general-purpose bag.
Existing members: `BookedPayload`, `ReviewPayload`. Initial candidates from upcoming
tasks, so the suffix is not dead: `T-3102` (webhook gateway body), `T-3100`
(notification-queue message), `T-092`/`T-093` (PRRO/acquiring request body), `T-050`
(AI-generation request body), `T-2001` (MCP tool arguments). A type used only inside
`apps/api` between layers, with no wire and no queue, takes **no** suffix
(`SlotQuery`, `GeoQuery`, `PriceSlug`).

## Open questions — decisions

1. **Suffix collision.** A mechanical `SlotRequestDto` → `SlotRequestRequest` is a
   tautology. Rule: when the stem already carries the suffix word, change the leading
   verb to a non-colliding one. `SlotRequestDto` →    `SlotQueryRequest` (`SlotRequestZodDto` → `SlotQueryZodRequest`);
   `RequestErasureDto` → `SubmitErasureRequest`; `RequestOtpInput` → `SendOtpRequest`;
   `RequestPhoneChangeOtpInput` → `SendPhoneChangeOtpRequest`. The gate rejects any new
   name where a suffix word appears twice.
2. **Nested types in an envelope.** A list element stays suffixed: `NearestLocationDto`
   → `NearestLocationResponse` (a bare `NearestLocation` would collide with the domain
   `Location` and with web's `LocationChannel`/`LocationPhoto`). Same for `AddressPartsDto`
   → `AddressPartsResponse` and the nested request `ClientReferenceDto` →
   `ClientReferenceRequest`.
3. **`packages/contracts`.** `*Input` → `*Request`, `*Result` → `*Response`, renamed in
   one epic PR together with the 8 consuming files. No compatibility shim: it is an
   internal contract library with no external publication.
4. **`*ErrorBody`.** An API answer: `ContentErrorBody` → `ContentErrorResponse`,
   `IdentityErrorBody` → `IdentityErrorResponse`.
5. **The `dto/` folder.** The folder becomes `api/` and the inline declarations move out
   of controllers (option b) — they help the `max-lines ≤ 100` gate. Moving the inline
   types is a separate slice from the mechanical rename. This amends ADR 0019: a
   controller stays its own file, and request/response/validator/mapper types live in a
   sibling `api/` file, not a `dto/` one.
6. **`*Payload`** — see the boundary above.

## Consequences
- One convention read without opening a file; a name tells the direction of data.
- `apps/api`, `apps/web`, `apps/admin`, `apps/mobile` and `packages/contracts` share it.
- Two gates hold it: `check-rename-map` (this ADR's table) and the T-4605d lint gate.
- Two contexts keep same-named twins (`LocationResponse`, `BarberResponse`,
  `ServiceResponse`, `AvailableSlotResponse`). T-4605b must verify the barrel exports do
  not merge them into one ambiguous export.

## Sources
- `docs/engineering-principles.md`, `docs/review-checklist.md`, `docs/ubiquitous-language.md`
- ADR 0019 (file size limit), T-4605 (epic), T-4605a (this slice)
