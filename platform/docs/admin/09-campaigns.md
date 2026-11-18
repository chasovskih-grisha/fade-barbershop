# Admin Panel — Campaigns Domain

## Purpose
Marketing campaigns with client segmentation and push notification delivery. Creates personal promo codes for segments, tracks send count and conversion, and provides ROI analysis linked to discount leakage (ANL-006).

## Pages & Features
- **Campaigns List** (`WNB-ADM-01…04`)
  - **Layout**: Header + "Create campaign" → Table with columns: Name, Segment, Promo code, Sent count, Usage count, Status (active/closed), Actions (Edit, View details)
  - **Empty state**: "No campaigns yet — create first."

- **Campaign Form** (`WNB-ADM-02`)
  - **Fields**: Name, **Segment** (select with live preview "Clients in segment: N"), Discount (type % / fixed amount, value, validity N days), Push text (~140 chars) with preview, Button "Send to N clients?" (confirmation)
  - **Segment**: Dynamic list of clients matching criteria; live count preview updates as segment is configured
  - **Discount**: Optional; linked to promo code creation (1 use per client in segment, WNB-003); visible in §7.1 with campaign badge
  - **Push text**: Limited to ~140 characters; real-time preview with character count
  - **Send confirmation**: "Send personal promo code to N selected clients?" — confirmation modal; on send: promo code created with "1 use per client in segment" restriction; push sent; usage/conversion tracked

- **Campaign Card** (`WNB-ADM-03/04`)
  - **Metrics**: Sent count, Usage count, Conversion rate (usage / sent), Revenue from campaign, Discount amount leaked
  - **Segment details**: Breakdown (location, loyalty level, VIP status), live client count preview
  - **History**: Sent/used timeline; per-client usage if needed (limited by privacy)
  - **Conversion analytics**: Linked to ANL-006 (discount leakage); shows how campaign discount impacted overall leakage

## API Endpoints
Campaign API under the marketing/wnb module:

- `GET /admin/campaigns` — List campaigns with filters (status, period)
- `POST /admin/campaigns` — Create new campaign
- `GET /admin/campaigns/:id` — Get campaign details with metrics and segment preview
- `POST /admin/campaigns/:id/send` — Send campaign to segment (creates promo code, sends push, starts tracking)
- `GET /admin/campaigns/segment-preview?filters=` — Get live client count for segment preview

## DTOs (inferred)
- `CreateCampaignDto`: name, segmentFilters (location, loyalty level, VIP, etc.), discountType, discountValue, validityDays, pushText
- `CampaignDto`: id, name, segmentDescription, promoCode, sentCount, usageCount, conversionRate, revenue, discountLeakage, status, createdAt
- `SegmentPreviewDto`: clientCount, breakdownByLocation, breakdownByLoyaltyLevel, breakdownByVipStatus

## Business Rules
- **Segment**: Live client count preview; segment can filter by location, loyalty level (X/7 status), VIP status, last visit date, etc.
- **Promo code creation**: On campaign send, a personal promo code is created with restriction "1 use per client in segment" (`WNB-003`); regular promo code in `discounts` with additional campaign flag
- **Discount**: Type % or fixed UAH; validity N days from send; applies only to selected segment clients
- **Conversion tracking**: Usage counted when promo code applied at booking; conversion rate = usage / sent; linked to ANL-006 (discount leakage)
- **ROI**: Revenue from campaign (sales where promo code used) minus discount leakage; tracked per campaign
- **Sent limit**: "Send to N clients?" — N is the current segment count at send time; if clients added/removed later, already-sent codes remain valid for original N clients
- **Campaign status**: Active → Closed; closed campaigns read-only (no new sends)

## Permissions
- `admin` role only (v1)
- Direct URL access without role → 403
- Segmentation data sensitive; only admin can view full client counts and send campaigns

## Development Notes
- Segment preview: API query with filters; returns count and breakdown; updated in real-time as form is edited
- Promo code on send: creates regular `PromoCode` + adds campaign flag + restriction "1 use per client in segment"; code visible in §7.1 with campaign badge
- Push sending: uses messaging module (phase 7); per-client push with personal promo code in text
- Conversion tracking: when promo code applied at booking → `AppliedDiscount` event → increments campaign usage count; linked to appointment for KPI calculations
- Character counter for push text: real-time in UI; warning at 130+ chars; truncation at 140
- Campaign send: async process; returns immediately; progress tracked; errors logged per-client
- Existing campaigns cannot be modified after send; clone/create new for changes

## Important Edge Cases
- Segment count at send time is fixed; new clients added later do not receive the already-sent promo code
- Campaign discount tracked separately from regular promo codes in statistics; linked to ANL-006 for discount leakage
- Conversion rate can be > 100% if usage > sent (investigation needed — possible double-counting or code reuse)
- ROI calculation: revenue from campaign sales minus the discount amount; displayed on campaign card
- If segment is emptied after send (clients deleted), already-sent codes remain valid for original recipients
- Closed campaigns: read-only; no new sends; metrics preserved for historical analysis

## Links to Related Documentation
- `docs/acceptance-criteria/11-winback-campaigns.md` (WNB-ADM-01…04)
- `docs/acceptance-criteria/07-discounts.md` (DSC-ADM-01 — promo code mechanism, synergy with campaigns)
- `docs/acceptance-criteria/08-analytics-dashboard.md` (ANL-ADM-04 — discount leakage link, ANL-006)
- `docs/ubiquitous-language.md` (WinbackCampaign, PromoCode, AppliedDiscount, ConversionRate, DiscountLeakage)
- `products.md` (§10 — campaigns, §7 — discounts promo codes)
- `docs/roadmap.md` (phase 18 — win-back campaigns; phase 14 — analytics linkage)
- `docs/admin-screens.md` (§10 — campaigns)
- `docs/adr/` (related ADRs in marketing module)