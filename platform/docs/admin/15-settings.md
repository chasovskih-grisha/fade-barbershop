# Admin Panel — Settings Domain

## Purpose
Domain integrations, template configurations, and system-wide settings for the admin panel and connected services. Single admin role (v1) controls all settings; location_manager access planned phase 9+.

## Pages & Features
- **Settings** (`MNG-ADM-18`)
  - **Domain integrations**: 
    - `media.fade.com.ua` — Photo upload domain (configured, signed URLs generated)
    - `gbp.fade.com.ua` — Google Business Profile integration (profile URLs per location; config only, no auto-import)
    - `checkout.fade.com.ua` — Payment acquiring integration (test/live mode, terminal settings)
    - `sms.fade.com.ua` — SMS provider for OTP and notifications (provider, API keys)
    - `push.fade.com.ua` — Push notification service (Expo config, certificate settings)
  - **Template configurations**:
    - Email templates (appointment reminders, confirmations, receipts, notifications)
    - SMS templates (OTP, appointment reminders, push alternatives)
    - Receipt templates (fiscal, Checkbox integration)
  - **System integrations**:
    - Billing/acquirer settings (test/live mode, merchant ID, terminal configuration)
    - Push notification credentials (Expo push token, certifications)
    - Domain settings (fade.com.ua, fade.ua, subdomains)
    - Fiscal receipt settings (receipt numbering, template configuration)

## API Endpoints
Settings API under the identity/admin module (or dedicated settings module):

- `GET /admin/settings` — Get all settings (domain integrations, templates, system config)
- `PATCH /admin/settings` — Update settings (partial update allowed; each field validated independently)
- `GET /admin/settings/domain` — Get domain integration config (media, GBP, checkout, SMS, push)
- `PATCH /admin/settings/domain` — Update domain integration settings
- `GET /admin/templates/email` — List email templates
- `PATCH /admin/templates/email/:id` — Update email template
- `GET /admin/templates/sms` — List SMS templates
- `PATCH /admin/templates/sms/:id` — Update SMS template

## Business Rules
- **Single admin control**: v1 has one `admin` role; all settings editable by admin only
- **Location_manager phase 9+**: planned to own location settings subset; not yet implemented
- **Change logging**: All setting changes logged (who, when, old value, new value); audit trail
- **Cache invalidation**: Some settings (domain URLs, templates) require service restart or cache warm; UI may show "pending deployment" status
- **Test vs Live**: Some integrations (checkout, SMS) have test mode toggle; live mode requires credentials; changes may need verification

## Permissions
- `admin` role only (v1)
- Direct URL access without role → 403
- No location scoping in v1 — all or nothing

## Development Notes
- Settings stored as key-value pairs with type validation; each domain has nested section
- Domain integrations: each service (media, GBP, checkout, SMS, push) has its own config subsection; UI shows status (configured / missing credentials / error)
- Templates: stored as HTML strings with placeholders ({{client_name}}, {{appointment_time}}, {{amount}}, etc.); rendered by notification service
- System integrations: billing acquirer config requires test mode first; live credentials only after test transactions verified; SMS provider similar flow
- Change audit: every `PATCH /admin/settings` creates `SettingChanged` event with diff; logged in DB; visible in admin UI under "Change history" (optional)
- Cache: after settings change, affected services may need `POST /admin/settings/reload-cache` or automatic via event; UI may show reload button

## Important Edge Cases
- Changing domain URL (e.g., media.fade.com.ua): new URLs take effect for new uploads; existing signed URLs remain valid until expiry; no retroactive re-generation
- GBP integration: only configures profile URLs per location; no auto-import of reviews or hours; manual setup per location; Google API quotas not platform-managed
- SMS/Email templates: placeholder substitution must match exactly; typo in placeholder → rendering failure; test mode sends to test phone/email
- Billing acquirer: test mode uses test terminal; live mode requires merchant account; changing from test to live may require reconfiguration of terminal settings
- Settings change audit: cannot be disabled; all changes permanently logged; GDPR-compliant retention policy applies (configured separately)

## Links to Related Documentation
- `docs/acceptance-criteria/04-admin-management.md` (MNG-ADM-18)
- `docs/acceptance-criteria/24-assistants.md` (ASSIST-* — settings may be relevant for assistant config)
- `docs/ubiquitous-language.md` (no direct — settings are infrastructure)
- `products.md` (§16 — settings, domain integrations)
- `docs/roadmap.md` (phase 9 — multiple locations, location_manager settings access; settings entered v1)
- `docs/adr/` (ADR 0017 — single cookie session domain; settings tie into session management)
- `docs/admin-screens.md` (§16 — settings)