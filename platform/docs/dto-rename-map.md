# Type rename map — `*Dto` / `*Input` / `*Result` → `*Request` / `*Response` / `*Payload`

Slice T-4605a. This table is the single source for the mechanical rename in
T-4605b…e; a developer renames by this table, not by judgment. The rule is ADR 0055.
The gate `scripts/validate-docs/check-rename-map.mjs` rejects a contradiction here
(a name still ending in a banned suffix, a doubled suffix word, or a `Response`/`Payload`
pair for the same body).

Inventory measured 2026-11-18: **48** names in `apps/api`, **10** in `apps/web`,
**31** in `packages/contracts`. The 2026-09-28 count in T-4605 (29 / 9 / 14)
predates later modules; the table below is the complete current inventory.

`*Payload` candidates are not renamed here — they are new types from T-3102, T-3100,
T-092/T-093, T-050 and T-2001 (ADR 0055, question 6). Existing `Payload` names keep
their name: `BookedPayload`, `ReviewPayload`.

## Commit plan (for T-4605b…e)

One commit per context, `git mv` to preserve file history, no squashing of contexts into
one commit:

1. `apps/api` — one commit (T-4605b); `dto/` → `api/` and the inline controller types
   move in a separate commit from the mechanical rename.
2. `apps/web` — one commit (T-4605c).
3. `packages/contracts` + its 8 consumers — one commit (T-4605c).
4. Lint gate — one commit (T-4605d).
5. Documentation and specs — one commit (T-4605e).

Barrel exports are checked in T-4605b before `done`: the twins `LocationResponse`,
`BarberResponse`, `ServiceResponse`, `AvailableSlotResponse` must not merge into one
ambiguous export.

### apps/api

| Old name | File | New name | Category | Rationale |
|----------|------|----------|----------|-----------|
| `CreateAppointmentPartyDto` | `apps/api/src/appointment-party/infrastructure/appointment-party.dto.ts` | `CreateAppointmentPartyRequest` | Request | HTTP body that starts a father-and-son party. |
| `AvailableSlotDto` | `apps/api/src/booking/dto/available-slot.dto.ts` | `AvailableSlotResponse` | Response | One free slot leaving the API. |
| `BarberDto` | `apps/api/src/booking/dto/barber.dto.ts; apps/api/src/identity/infrastructure/admin-barbers.dto.ts` | `BarberResponse` | Response | A barber leaving the API (two contexts share the name). |
| `BarberPhotoDto` | `apps/api/src/booking/dto/barber.dto.ts; apps/api/src/identity/infrastructure/admin-barbers.dto.ts` | `BarberPhotoResponse` | Response | A barber photo leaving the API (two contexts). |
| `CreateBookingDto` | `apps/api/src/booking/dto/create-booking.dto.ts` | `CreateBookingRequest` | Request | HTTP body that books a slot. |
| `LocationDto` | `apps/api/src/booking/dto/location.dto.ts; apps/api/src/locations/infrastructure/admin-locations.dto.ts` | `LocationResponse` | Response | A location leaving the API (booking and admin share the name). |
| `ServiceDto` | `apps/api/src/booking/dto/service.dto.ts` | `ServiceResponse` | Response | A service leaving the API. |
| `SlotRequestDto` | `apps/api/src/booking/dto/slot-request.dto.ts` | `SlotQueryRequest` | Request | Handler input for GET /slots; the verb Query avoids SlotRequestRequest. |
| `SlotRequestZodDto` | `apps/api/src/booking/dto/slot-request.zod.ts` | `SlotQueryZodRequest` | Request | Validated wire body for GET /slots; parallel to SlotQueryRequest. |
| `CancelWaitlistDto` | `apps/api/src/booking/dto/waitlist-command.dto.ts` | `CancelWaitlistRequest` | Request | HTTP body that cancels a waitlist entry. |
| `JoinWaitlistDto` | `apps/api/src/booking/dto/waitlist-command.dto.ts` | `JoinWaitlistRequest` | Request | HTTP body that joins a waitlist. |
| `WaitlistEntryDto` | `apps/api/src/booking/dto/waitlist-entry.dto.ts` | `WaitlistEntryResponse` | Response | A waitlist entry leaving the API. |
| `SetPriceDto` | `apps/api/src/catalog/infrastructure/admin-services.dto.ts` | `SetPriceRequest` | Request | HTTP body that sets a location price. |
| `CreateServiceDto` | `apps/api/src/catalog/infrastructure/admin-services.dto.ts` | `CreateServiceRequest` | Request | HTTP body that creates a service. |
| `UpdateServiceDto` | `apps/api/src/catalog/infrastructure/admin-services.dto.ts` | `UpdateServiceRequest` | Request | HTTP body that updates a service. |
| `UpdateSeoBlockDto` | `apps/api/src/content/application/update-seo-block.ts` | `UpdateSeoBlockRequest` | Request | Application input for the SEO block, set from the admin body. |
| `ArticleDto` | `apps/api/src/content/infrastructure/content.dto.ts` | `ArticleResponse` | Response | A full article leaving the API. |
| `ArticleSummaryDto` | `apps/api/src/content/infrastructure/content.dto.ts` | `ArticleSummaryResponse` | Response | An article row in a feed leaving the API. |
| `DraftArticleDto` | `apps/api/src/content/infrastructure/admin-content.controller.ts` | `DraftArticleRequest` | Request | HTTP body that drafts an article. |
| `UpdateArticleDto` | `apps/api/src/content/infrastructure/content.dto.ts` | `UpdateArticleRequest` | Request | HTTP body that updates an article. |
| `ClientProfileDto` | `apps/api/src/crm/infrastructure/client-profile.dto.ts` | `ClientProfileResponse` | Response | A client profile leaving the API (alias of the domain props). |
| `CreateBarberDto` | `apps/api/src/identity/infrastructure/admin-barbers.dto.ts` | `CreateBarberRequest` | Request | HTTP body that creates a barber. |
| `UpdateBarberDto` | `apps/api/src/identity/infrastructure/admin-barbers.dto.ts` | `UpdateBarberRequest` | Request | HTTP body that updates a barber. |
| `BirthdayInputDto` | `apps/api/src/identity/infrastructure/profile-dto.input.ts` | `BirthdayRequest` | Request | Nested day-and-month body for the profile. |
| `PatchProfileBirthdayInputDto` | `apps/api/src/identity/infrastructure/profile-dto.input.ts` | `PatchProfileBirthdayRequest` | Request | HTTP body that patches the birthday. |
| `PatchProfileNameInputDto` | `apps/api/src/identity/infrastructure/profile-dto.input.ts` | `PatchProfileNameRequest` | Request | HTTP body that patches the name. |
| `PatchProfilePreferencesInputDto` | `apps/api/src/identity/infrastructure/profile-dto.input.ts` | `PatchProfilePreferencesRequest` | Request | HTTP body that patches the preferences. |
| `RequestErasureDto` | `apps/api/src/identity/privacy/infrastructure/erasure.controller.ts` | `SubmitErasureRequest` | Request | HTTP body that submits a GDPR erasure; verb Submit avoids RequestRequest. |
| `AddressPartsDto` | `apps/api/src/locations/infrastructure/admin-locations.dto.ts` | `AddressPartsResponse` | Response | Nested address block in a location response. |
| `CreateLocationDto` | `apps/api/src/locations/infrastructure/admin-locations.dto.ts` | `CreateLocationRequest` | Request | HTTP body that creates a location. |
| `LocationLogoDto` | `apps/api/src/locations/infrastructure/admin-locations.dto.ts` | `LocationLogoResponse` | Response | A location logo leaving the API. |
| `UpdateLocationDto` | `apps/api/src/locations/infrastructure/admin-locations.dto.ts` | `UpdateLocationRequest` | Request | HTTP body that updates a location. |
| `NearestLocationDto` | `apps/api/src/locations/infrastructure/nearest-locations.dto.ts` | `NearestLocationResponse` | Response | One element of the nearest-locations envelope. |
| `NearestLocationsResponseDto` | `apps/api/src/locations/infrastructure/nearest-locations.dto.ts` | `NearestLocationsResponse` | Response | The envelope leaving the API; the trailing Dto is dropped. |
| `CommandDto` | `apps/api/src/scheduling/dto/appointment-command.dto.ts` | `AppointmentCommandRequest` | Request | HTTP body for an appointment lifecycle command; names the aggregate, not a bare Command. |
| `BookSlotDto` | `apps/api/src/scheduling/dto/book-slot.dto.ts` | `BookSlotRequest` | Request | HTTP body that books a slot. |
| `ClientBookingDto` | `apps/api/src/scheduling/dto/client-booking.dto.ts` | `ClientBookingRequest` | Request | HTTP body that confirms a client booking. |
| `ClientReferenceDto` | `apps/api/src/scheduling/dto/client-booking.dto.ts` | `ClientReferenceRequest` | Request | Nested reference-and-comment block in the booking body. |
| `BarberServiceAssignmentForBarberDto` | `apps/api/src/scheduling/infrastructure/admin-barber-service.dto.ts` | `BarberServiceAssignmentForBarberResponse` | Response | Barber-service assignment leaving the API. |
| `BarberServiceAssignmentsForLocationDto` | `apps/api/src/scheduling/infrastructure/admin-barber-service.dto.ts` | `BarberServiceAssignmentsForLocationResponse` | Response | Barber-service assignments for a location leaving the API. |
| `CreateOrActivateAssignmentDto` | `apps/api/src/scheduling/infrastructure/admin-barber-service.dto.ts` | `CreateOrActivateAssignmentRequest` | Request | HTTP body that creates or activates an assignment. |
| `SlotPolicyDto` | `apps/api/src/scheduling/infrastructure/admin-barber-service.dto.ts` | `SlotPolicyResponse` | Response | A slot policy leaving the API. |
| `UpdateSlotPolicyDto` | `apps/api/src/scheduling/infrastructure/admin-barber-service.dto.ts` | `UpdateSlotPolicyRequest` | Request | HTTP body that updates a slot policy. |
| `ClientCommandDto` | `apps/api/src/scheduling/infrastructure/client-appointments.controller.ts` | `ClientAppointmentCommandRequest` | Request | HTTP body for a client appointment command; names the aggregate. |
| `ReleaseSlotDto` | `apps/api/src/scheduling/infrastructure/slot-reservations.controller.ts` | `ReleaseSlotRequest` | Request | HTTP body that releases a slot reservation. |
| `ReserveSlotDto` | `apps/api/src/scheduling/infrastructure/slot-reservations.controller.ts` | `ReserveSlotRequest` | Request | HTTP body that reserves a slot. |
| `CreateTicketDto` | `apps/api/src/support/infrastructure/support.controller.ts` | `CreateTicketRequest` | Request | HTTP body that creates a support ticket. |
| `ResolveTicketDto` | `apps/api/src/support/infrastructure/support.controller.ts` | `ResolveTicketRequest` | Request | HTTP body that resolves a support ticket. |

### apps/web

| Old name | File | New name | Category | Rationale |
|----------|------|----------|----------|-----------|
| `AvailableSlotDto` | `apps/web/src/app/booking/types.ts` | `AvailableSlotResponse` | Response | Client-side copy of the slot response. |
| `BarberDto` | `apps/web/src/app/booking/types.ts; apps/web/src/lib/api/staff.ts` | `BarberResponse` | Response | Client-side copy of the barber response. |
| `BarberPhotoDto` | `apps/web/src/app/booking/types.ts; apps/web/src/lib/api/staff.ts` | `BarberPhotoResponse` | Response | Client-side copy of the barber photo response. |
| `ChannelDto` | `apps/web/src/app/booking/types.ts` | `ChannelResponse` | Response | Client-side copy of a location channel element. |
| `DayHoursDto` | `apps/web/src/app/booking/types.ts` | `DayHoursResponse` | Response | Client-side copy of a day-hours element. |
| `LocationDetailsDto` | `apps/web/src/app/booking/types.ts` | `LocationDetailsResponse` | Response | Client-side copy of the location details response. |
| `LocationDto` | `apps/web/src/app/booking/types.ts` | `LocationResponse` | Response | Client-side copy of the location response. |
| `NearestLocationDto` | `apps/web/src/app/booking/types.ts` | `NearestLocationResponse` | Response | Client-side copy of the nearest-location element. |
| `PhotoDto` | `apps/web/src/app/booking/types.ts` | `PhotoResponse` | Response | Client-side copy of a photo element. |
| `ServiceDto` | `apps/web/src/app/booking/types.ts` | `ServiceResponse` | Response | Client-side copy of the service response. |

### packages/contracts

| Old name | File | New name | Category | Rationale |
|----------|------|----------|----------|-----------|
| `AdminLoginInput` | `packages/contracts/src/identity.ts` | `AdminLoginRequest` | Request | Contract input entering the identity API. |
| `AdminLoginResult` | `packages/contracts/src/identity.ts` | `AdminLoginResponse` | Response | Contract answer leaving the identity API. |
| `ClientProfileResult` | `packages/contracts/src/identity.ts` | `ClientProfileResponse` | Response | Contract answer for the client profile. |
| `ListClientSessionsResult` | `packages/contracts/src/identity.ts` | `ListClientSessionsResponse` | Response | Contract answer listing client sessions. |
| `PatchProfileBirthdayInput` | `packages/contracts/src/identity.ts` | `PatchProfileBirthdayRequest` | Request | Contract input that patches the birthday. |
| `PatchProfileNameInput` | `packages/contracts/src/identity.ts` | `PatchProfileNameRequest` | Request | Contract input that patches the name. |
| `PatchProfilePreferencesInput` | `packages/contracts/src/identity.ts` | `PatchProfilePreferencesRequest` | Request | Contract input that patches the preferences. |
| `PatchProfilePreferencesResult` | `packages/contracts/src/identity.ts` | `PatchProfilePreferencesResponse` | Response | Contract answer for the patched preferences. |
| `RefreshSessionInput` | `packages/contracts/src/identity.ts` | `RefreshSessionRequest` | Request | Contract input that refreshes a session. |
| `RefreshSessionResult` | `packages/contracts/src/identity.ts` | `RefreshSessionResponse` | Response | Contract answer for the refreshed session. |
| `RegisterPushTokenInput` | `packages/contracts/src/identity.ts` | `RegisterPushTokenRequest` | Request | Contract input that registers a push token. |
| `RegisterPushTokenResult` | `packages/contracts/src/identity.ts` | `RegisterPushTokenResponse` | Response | Contract answer for the registered push token. |
| `RequestOtpInput` | `packages/contracts/src/identity.ts` | `SendOtpRequest` | Request | Contract input that requests an OTP; verb Send avoids RequestOtpRequest. |
| `RequestOtpResult` | `packages/contracts/src/identity.ts` | `SendOtpResponse` | Response | Contract answer for the OTP request. |
| `RequestPhoneChangeOtpInput` | `packages/contracts/src/identity.ts` | `SendPhoneChangeOtpRequest` | Request | Contract input that requests a phone-change OTP; verb Send avoids the tautology. |
| `RevokeAllSessionsResult` | `packages/contracts/src/identity.ts` | `RevokeAllSessionsResponse` | Response | Contract answer for revoking all sessions. |
| `RevokePushTokenInput` | `packages/contracts/src/identity.ts` | `RevokePushTokenRequest` | Request | Contract input that revokes a push token. |
| `RevokePushTokenResult` | `packages/contracts/src/identity.ts` | `RevokePushTokenResponse` | Response | Contract answer for the revoked push token. |
| `RevokeSessionInput` | `packages/contracts/src/identity.ts` | `RevokeSessionRequest` | Request | Contract input that revokes a session. |
| `RevokeSessionResult` | `packages/contracts/src/identity.ts` | `RevokeSessionResponse` | Response | Contract answer for the revoked session. |
| `SetClientEmailInput` | `packages/contracts/src/identity.ts` | `SetClientEmailRequest` | Request | Contract input that sets the client email. |
| `SetClientEmailResult` | `packages/contracts/src/identity.ts` | `SetClientEmailResponse` | Response | Contract answer for the set email. |
| `VerifyOtpInput` | `packages/contracts/src/identity.ts` | `VerifyOtpRequest` | Request | Contract input that verifies an OTP. |
| `VerifyOtpResult` | `packages/contracts/src/identity.ts` | `VerifyOtpResponse` | Response | Contract answer for the verified OTP. |
| `VerifyPhoneChangeInput` | `packages/contracts/src/identity.ts` | `VerifyPhoneChangeRequest` | Request | Contract input that verifies a phone change. |
| `VerifyPhoneChangeResult` | `packages/contracts/src/identity.ts` | `VerifyPhoneChangeResponse` | Response | Contract answer for the verified phone change. |
| `IdentityErrorBody` | `packages/contracts/src/identity.ts` | `IdentityErrorResponse` | Response | Contract error body; it is an API answer. |
| `DraftArticleInput` | `packages/contracts/src/content.ts` | `DraftArticleRequest` | Request | Contract input that drafts an article. |
| `UpdateArticleInput` | `packages/contracts/src/content.ts` | `UpdateArticleRequest` | Request | Contract input that updates an article. |
| `PublishArticleResult` | `packages/contracts/src/content.ts` | `PublishArticleResponse` | Response | Contract answer for a published article. |
| `ContentErrorBody` | `packages/contracts/src/content.ts` | `ContentErrorResponse` | Response | Contract error body; it is an API answer. |

