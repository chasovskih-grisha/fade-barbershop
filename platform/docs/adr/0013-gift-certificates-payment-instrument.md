# ADR 0013: Gift certificates — payment instrument, not price

- Status: accepted
- Date: 2026-09-11
- Contexts: `gift-certificates` (new owner), `billing` (payment form and receipts), `notifications` (code delivery)

## Context

Gift certificates — standard barbershop tool before holidays: money enters service provision (prepayment on balance), margin high, part of certificates never redeemed (breakage). Architecture question: where certificate lives — in `catalog` as "service", in `billing` as payment, or separate context — and how it coexists with price snapshot model (ADR 0006/0007) and discount rules (DSC-003).

## Decision

### 1. Separate Supporting context `gift-certificates` — lifecycle owner

`GiftCertificate` — aggregate: nominal, code, balance, validity, statuses (`active → partially_used → used / expired / cancelled`), redemption history. This not "service" (not booked, not in calendar, has no `AgreedPrice`) and not "discount" (doesn't reduce `FinalPrice`). Context publishes `GiftCertificateSold` / `CertificateRedeemed` / `GiftCertificateExpired` / `GiftCertificateCancelled`; reads only its model.

### 2. Certificate — `FinalPrice` payment form, not price influence

- `AgreedPrice` snapshotted from `catalog` as always (ADR 0006); discount rules calculated as always (ADR 0007, DSC-003, cap 30%); `FinalPrice` — as always. Certificate **doesn't appear** in any of these calculations.
- At redemption `billing` receives command "pay `FinalPrice` in parts": certificate (balance write-off via `gift-certificates`) + card/cash (remainder). Certificate becomes another **payment form** beside card and cash — not new money model.
- This preserves ADR 0010 boundary: only client price path — `catalog → AgreedPrice → FinalPrice → billing`. Certificate doesn't interfere in this path.

### 3. Fiscalization: receipt on sale, separate receipt on redemption

- **Sale** of certificate (online or on-site) — settlement operation: money accepted → receipt Checkbox #1 on position "Gift certificate".
- **Redemption** — receipt #2 on actual service (`FinalPrice`), where certificate specified as payment form (if partial — multiple payment forms in one receipt; DPS position on PS/tokens).
- Receipt #2 doesn't create "second income" — accounting-wise certificate sale is prepayment, offset at redemption; this posting and Checkbox reflection **verify at integration** (same protection type as LYL-007).
- Free 7th visit: `FinalPrice = 0` → certificate write-off doesn't happen and no receipt (loyalty priority, LYL-007/DSC-005 semantics).

### 4. On-site redemption (v1 feature), online redemption — extension

Code entry in online booking flow (deposit payment by certificate) requires online balance validation in critical booking path. In first release redemption feature — **only on-site** (walk-in or remainder after booking): same flow as cash/POS payment. Online redemption added as extension without model change (same "pay in parts" command, only called from web).

### 5. Deposit and certificate don't intersect in v1

Deposit 30% applies to online booking with card (PAY-WEB-02). Client with certificate pays on-site as usual: deposit — by card (if booked online), remainder on-site — by certificate. No special "no-deposit" mode for certificate owners (may be later marketing decision).

## Consequences

- **Pros**: money enters service (prepayment on balance — visible obligation, GFT-ADM-05); zero impact on price and discount model; breakage and obligations calculated in `analytics` as extension without new event flows (`GiftCertificate*` events sufficient).
- **Cost**: two receipts for one "prepaid" hryvnia requires correct accounting offset — closed by verification at integration; `billing` gets concept "pay in parts by different forms" (card+cash already existed as two `Payment`; certificate adds write-off from owner context).
- **Future**: online redemption, purchase discounts, corporate certificates — extensions of same aggregate.

## Rejected alternatives

1. **Certificate as "service" in `catalog`** — certificate could be booked, snapshotted, enter loyalty and analytics as haircut; calendar polluted by non-visits, `AgreedPrice` loses sense. Catalog — for what provided in chair.
2. **Lifecycle inside `billing`** — `billing` Generic: payments and receipts. Sold product with balance, validity and statuses would inflate generic context to Supporting complexity; certificate list and cancellation moderation — not about payments.
3. **Certificate as discount/promo code in `discounts`** — breaks DSC-003 semantics (discount reduces price, certificate pays it), cap 30% would limit nominals, and "1 use" — balance.
