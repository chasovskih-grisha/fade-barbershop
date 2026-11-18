# Admin Panel — Payments Domain

## Purpose
Management of payment records: deposits, balances, refunds, and fiscal receipts. Handles deposit policy (default 30%, rounding, 4-hr cancellation window), refund processing with logging, and receipt management. All financial operations tied to `Payment` events and fiscal integration.

## Pages & Features
- **Payments List** (`PAY-ADM-01…09`)
  - **Layout**: Filter bar (Location, Period, Status: awaiting deposit deposit paid / awaiting balance / paid / refund in process / refund failed), Type (deposit / balance / refund); Table
  - **Columns**: Appointment, Client, Amount, Form (card/POS/cash), Status (badge), Check (icon → open/download, PAY-ADM-03), Time
  - **Refunds visible** in same list with cause and initiator (PAY-ADM-08); `refund_failed` — with reason and "Retry refund" button (PAY-009)

- **Deposit Policy** (`PAY-ADM-09`)
  - **Fields**: Deposit % of `FinalPrice` (0–100; default **30**; 0 = disabled), Rounding (select 1/5/10 UAH; default **10**), Cancellation window (hours 0–72; default **4**)
  - **Scope**: Single policy for entire network in v1; per-location override planned phase 9 (currently denied — PAY-ADM-09)
  - **Per-appointment snapshotting**: Deposit % and rounding snapshotted on appointment at booking time; changes apply only to new appointments (confirm-banner: "Applies only to new appointments; % and window snapshop on Appointment")
  - **Client-facing text**: Link to client policy text (PAY-WEB-07) showing what client sees on deposit screen

- **Refund Processing** (`PAY-ADM-08, PAY-009`)
  - **List refunds**: Same payments list; filter by `refund status`; shows cause, initiator, timestamp
  - **Refund action**: Confirmation with reason field; lógico required; on success: `PaymentRefunded` event → status "Refunded", link to refund receipt; failure → `refund_failed` status with reason and "Retry refund" button
  - **Retry refund**: One retry attempt; if fails again, stays `refund_failed`; max 2 attempts total
  - **Fiscal receipt**: Refund = issuance of debit/credit Checkbox; `ReceiptIssued` on `DONE`; idempotent via receipt ID

- **Payment Details/Checkout** (PAY-ADM-03 — check icon)
  - Open/download fiscal receipt (Checkbox); receipt number, date, items, amounts, payment form, status
  - Cancellation policy displayed (deposit %, rounding, window)

## API Endpoints
Payment API under the billing module:

- `GET /admin/payments` — List payments with filters (location, period, status, type)
- `GET /admin/payments/:id` — Get payment detail (appointment, client, amounts, form, status, receipt link)
- `POST /admin/payments/refund` — Process refund (body: paymentId, reason); returns `{ refundId, status }`
- `POST /admin/payments/refund/:id/retry` — Retry failed refund
- `GET /admin/payments/receipt/:id` — Download fiscal receipt (Checkbox)

## DTOs (inferred)
- `PaymentDto`: id, appointmentId, clientId, amount, form (`cash` / `card` / `pos`), status (`awaiting_deposit` / `deposit_paid` / `awaiting_balance` / `paid` / `refund_processing` / `refund_failed`), createdAt, receiptId?, refundId?, refundReason?, initiatedBy (adminId)
- `RefundDto`: id, paymentId, reason, status (`processing` / `completed` / `failed`), attemptedAt, completedAt?, receiptId
- `DepositPolicyDto`: depositPercent, rounding, cancellationWindowHours, validFrom (snapshotted per appointment)

## Business Rules
- **Deposit policy**: 30% of `FinalPrice` default; rounded to 1/5/10 UAH (default 10); 4-hour cancellation window default; policy snapshotted on appointment booking; changes apply only to new appointments
- **Cancellation window**: 0–72 hours; within window → deposit refunded (ideempotently); outside window → deposit kept; policy snapshotted per appointment
- **Refund**: Only for payments with `status: paid`; requires reason; produces `PaymentRefunded` event; idempotent via receipt ID; max 2 attempts
- **Fiscal receipt**: Each payment → Checkbox receipt #1 (deposit) or #2 (balance/refund); `ReceiptIssued` event; numbers sequential; linked to accounting
- **Refund failure**: Button "Retry refund" appears once; second failure → `refund_failed` status; no further retries without admin intervention
- **Deposit not returned**: Auto-refund on timely cancellation: command sent to acquiring immediately; retries → `refund_failed` with button "Retry"; debit note issued; `ReceiptIssued` for return
- **Payment form**: Cash (hand-entered amount), Card POS (integrated acquiring), POS receipt generated; all forms recorded

## Permissions
- `admin` role only (v1) for refund actions and policy changes
- `location_manager` (phase 9+): own location payments, own locale deposit policy override (if enabled)
- Direct URL access without role → 403
- Barber: no access to admin payments (mobile has own payment flow)

## Development Notes
- Deposit policy stored globally; snapshotted on each `Appointment` creation via `BookingCreated` event; snapshot includes: depositPercent, rounding, cancellationWindowHours, validFrom
- Persisted snapshot: `Booking` carries `depositAmount`, `depositPercent`, `depositRounding`, `cancellationWindowHours` (all NULL — no deposit for this visit). The cancellation deadline is derived from the current `start`, so rescheduling moves it with the visit; `GET /booking/appointments` returns `deposit: { amount, freeCancelUntil } | null` for the cabinet
- Cancellation: client can cancel within window → deposit auto-refunded; admin can also refund from payments list; both paths produce `PaymentRefunded` event
- Refund retry: single button in UI; backend allows 2 total attempts; after 2 failures, manual intervention required; logged with timestamps
- Fiscal receipt: Checkbox integration; receipt #1 on sale, #2 on balance payout/refund; numbers stored in DB; receipt PDF generated via template
- Payment status flow: `awaiting_deposit` → `deposit_paid` (on-site) → `awaiting_balance` → `paid` (on-site payment complete); or `cancelled` within window → `deposit_refunded`
- Refund reason: required text field; logged with admin ID and timestamp; shown in payments list; client receives neutral push notification (NSH-ADM pattern)

## Important Edge Cases
- Changing deposit policy: applies only to new appointments; existing appointments keep their snapshotted policy; confirm-banner references this
- Cancellation within window: deposit automatically refunded; client receives push notification; payment status updated; no admin action needed
- Refund failure retry: single retry allowed; if fails twice, status `refund_failed`; "Retry" button disappears; admin must investigate
- Fiscal receipt numbers: sequential; gap if receipt voided; audit trail for accounting integration
- Payment form "Cash": amount hand-entered by admin; must be ≤ FinalPrice − deposit already paid; change given if cash > final amount (business rule)
- Refund to original payment method: card → refund to card; cash → cash handover or account credit; logged with method details
- No-show: deposit not returned automatically; manual `Mark no-show` action required; separate from cancellation window refund policy

## Links to Related Documentation
- `docs/acceptance-criteria/23-online-shop.md` (no direct, but payment mechanics shared)
- `docs/acceptance-criteria/04-admin-management.md` (PAY-ADM-01…09)
- `docs/acceptance-criteria/12-no-show-policy.md` (NSH-ADM-01, integration with deposit/cancellation)
- `docs/acceptance-criteria/08-analytics-dashboard.md` (ANL-ADM linkage, deposit impact on revenue)
- `docs/ubiquitous-language.md` (RevenuePerDay, ChairOccupancy, AppliedDiscount, FinalPrice, Payment, FiscalReceipt, CancellationPolicy)
- `products.md` (§14 — payments, deposit policy, refund mechanics)
- `docs/roadmap.md` (phase 8 — billing; phase 14 — payments; phase 16 — no-show policy)
- `docs/adr/` (ADR 0006 — AgreedPrice snapshot affects deposit; ADR 0017 — single cookie session domain)
- `docs/admin-screens.md` (§14 — payments)