# Admin Panel — Gift Certificates Domain

## Purpose
Management of pre-paid gift certificates. Handles issuance on-site (cash/POS), tracking balances, validity periods, and statistics (sold, redeemed, expired, breakage). Certificate is not a price discount — does not interact with DSC-003 cap (GFT-002).

## Pages & Features
- **Certificates List** (`GFT-ADM-01…05`)
  - **Layout**: Filter bar (Status: active/partially_used/used/expired/cancelled), Nominal filter, Period filter; Table
  - **Columns**: Code, Nominal, Balance, Sold, Validity period, Status (badge), Actions (Issue on-site, Cancel)
  - **Empty state**: "No certificates yet."

- **Issue Certificate On-Site** (`GFT-ADM-02`)
  - **Process**: Nominal value selection → Payment (cash / Card POS) → Receipt #1 generated → Code issued (SMS/Email/Print) → Code sent to purchaser
  - **Payment forms**: Cash (hand-entered amount) | Card POS (integrated acquiring gateway, receipt #2)
  - **Receipt generation**: Checkbox #1 on sale, Checkbox #2 on payout (refund); `ReceiptIssued` event on `DONE`, idempotent via receipt ID
  - **Code distribution**: SMS, email, or printed card; unique alphanumeric code; immediate validity

- **Configuration** (`GFT-ADM-03`)
  - **Nominal values**: Pre-set set of values (e.g., 100, 500, 1000 UAH); can be customized
  - **Validity period**: Months from issuance (e.g., 6, 12, 24); configurable per nominal or global

- **Cancellation** (`GFT-ADM-04`)
  - **Confirmation**: With mandatory reason log; reason recorded for audit
  - **Balance return**: Partial refund of remaining balance to payment method (billing module); full cancellation voids certificate
  - **Leftover balance**: Partial cancellation keeps remaining balance on certificate; full cancellation zeroes it

- **Statistics** (`GFT-ADM-05`)
  - **Sold / Redeemed**: Count and UAH total for period
  - **Breakage**: Unredeemed (expired or abandoned) balances — actual margin (GFT-ADM-05)
  - **Obligation**: Sum of unredeemed balances — liability on balance sheet
  - **Period filters**: Location, date range, status

## API Endpoints
Gift certificates API under the gift-certificates module:

- `GET /admin/gift-certificates` — List certificates with filters (status, nominal, period)
- `POST /admin/gift-certificates` — Create/issue new certificate (on-site process)
- `GET /admin/gift-certificates/:id` — Get certificate detail (balance, history, transactions)
- `PATCH /admin/gift-certificates/:id` — Update status (cancel, partial use)
- `POST /admin/gift-certificates/:id/redeem` — Redeem certificate on appointment payment (reduces balance)
- `GET /admin/gift-certificates/statistics` — Sold, redeemed, breakage, obligation reports

## DTOs (inferred)
- `GiftCertificateDto`: id, code, nominal, balance, validityExpiry, status (`active` / `partial` / `used` / `expired` / `cancelled`), issuanceDate, lastRedemptionAt, ownerPhone, transactionHistory (array)
- `RedeemDto`: certificateId, appointmentId, amountRedeemed (partial), newBalance
- `StatisticsDto`: soldCount, soldAmount, redeemedCount, redeemedAmount, breakageAmount, obligationAmount, period

## Business Rules
- **Certificate ≠ discount**: `AgreedPrice`/`FinalPrice` and DSC-003 30% cap do not apply to gift certificates (GFT-002); certificate is a pre-paid form of payment, not a price reduction
- **On-site issuance**: Nominal value selected → Payment (cash/POS) → Receipt #1 (sale) → Code issued + SMS/print (Receipt #2 if POS); immediate validity start
- **Partial redemption**: Certificate balance reduced by redeemed amount; remaining balance stays on certificate; can be used for future appointments
- **Full redemption**: When balance reaches 0, certificate status changes to `used`; no further redemption possible
- **Expiration**: Validity period from issuance; after expiry, status → `expired`; balance not redeemed → counted as breakage
- **Cancellation**: Admin can cancel with reason; balance refunded to original payment method (billing integration); cancelled status prevents further use
- **Breakage**: Unredeemed expired certificates → actual margin for the business; tracked in statistics (GFT-ADM-05)
- **Obligation**: Sum of all non-expired, non-used balances — liability; reported in financial statements

## Permissions
- `admin` role only (v1)
- Direct URL access without role → 403
- Location scoping for statistics (manager sees own location only in phase 9+)

## Development Notes
- Certificate code: unique alphanumeric; generated on issuance; stored encrypted; displayed on receipt and SMS
- Balance tracking: decimal precision for UAH; partial redemption subtracts amount; never goes negative
- Receipt idempotency: `ReceiptIssued` event with receipt ID; same receipt ID reused → no duplicate charge; backend handles idempotency
- Validity: stored as expiry date; backend checks on every appointment payment; if certificate expired → cannot redeuce, shows expired status
- Cancellation refund: integrates with billing/acquiring; refund amount = remaining balance; payment method returned to original; logs `GiftCertificateCancelled` event
- Breakage calculation: at period end, sum of balances on `expired` certificates; recognized as revenue (GFT-ADM-05)
- Owner phone: stored at issuance (for SMS/email); can be updated later if purchaser changes contact

## Important Edge Cases
- Certificate balance can be partially redeemed multiple times; each redemption reduces balance; never exceeds nominal
- Expired certificates: balance written off as breakage; no further redemption possible
- Cancellation: full balance refunded; partial cancellation keeps remaining balance; cancelled status blocks further actions
- On-site issuance without POS: cash hand-entered; receipt #1 generated manually; code issued same day
- Certificate used for walk-in booking: same flow; balance deducted; no additional deposit required
- Breakage recognized at period end; not real-time; administrative decision per accounting policy
- Multiple certificates can be combined for a single appointment payment; each certificate balance deducted proportionally or sequentially (business rule)

## Links to Related Documentation
- `docs/acceptance-criteria/16-gift-certificates.md` (GFT-ADM-01…05)
- `docs/acceptance-criteria/08-analytics-dashboard.md` (ANL-ADM linkage, breakage in KPI)
- `docs/acceptance-criteria/09-walk-in-booking.md` (WALK-ADM-02 — on-place certificate issuance)
- `docs/ubiquitous-language.md` (GiftCertificate, CertificateBalance, Redemption, Breakage, Obligation)
- `products.md` (§20 — gift certificates, ADR 0013)
- `docs/roadmap.md` (phase 20 — gift certificates; phase 8 — billing integration)
- `docs/adr/` (ADR 0013 — gift certificate financial mechanics; GFT-002 — no discount interaction)
- `docs/admin-screens.md` (§12 — gift certificates)