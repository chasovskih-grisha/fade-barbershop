# Gift certificates (prepaid)

> Certificate — **payment instrument, not price and not discount** (ADR 0013): service costs `AgreedPrice` (ADR 0006) as always, certificate only **pays** `FinalPrice`. Money enters service; part of certificates not redeemed (breakage — actual margin). Doesn't combine with DSC-003 — those rules apply to price, certificate — to payment.
>
> Criteria: `acceptance-criteria/16-gift-certificates.md` (GFT-*). Phase: **20** (after v1, before first holiday season).

## Money and receipts

```
Sale (online card / on-site cash-POS)
  → Payment + receipt #1 "Gift certificate"   ← settlement operation, money received
  → GiftCertificateSold → analytics: obligation (remainders on balance)

Redemption (on site, v1 feature)
  → receipt #2 on FinalPrice; payment forms: certificate (full/partial) + card/cash
  → CertificateRedeemed → analytics: obligation ↓
  → expired remainders → GiftCertificateExpired → breakage

Exception: free 7th visit → FinalPrice = 0 → certificate NOT written off (LYL-007)
```

Accounting essence: certificate sale — **prepayment**, offset on redemption; receipt #2 doesn't create second income. Posting and Checkbox display verify at integration (same protection type as LYL-007).

## Lifecycle

`active → partially_used → used / expired / cancelled`

- Nominals: admin-set (default 500 / 1000 / 2000 UAH), term — 12 months (configurable).
- Balance: one certificate — multiple visits, while balance > 0 and term not expired (GFT-004).
- Transferability: buyer ≠ recipient; no profile binding (GFT-007).
- Admin cancellation — with reason and log (GFT-008); remainder return — manual `billing` action.

## Surfaces

| Surface | What it does |
|----------|-----------|
| Web `/gift` (public) | nominals, card payment, code immediately on screen + SMS/push (GFT-WEB-01/02) |
| Cabinet | "My certificates": codes, remainders, term (GFT-WEB-03) |
| Barber (mobile) | "paid by certificate (code)" mark in visit (GFT-BAR-01) |
| Admin | manual on-site issuance, list/remainders, settings, cancellation, statistics (GFT-ADM-01…05) |

## Analytics (ANL extension)

- **Obligation** — sum of unredeemed remainders (prepayments on balance): how much money "we owe" in services.
- **Breakage** — expired unused remainders: actual feature margin.
- Sale/redemption per period, average time to redemption.

## Related

- Money flow: `acceptance-criteria/01-billing-payments.md` (deposit — same "money upfront" logic, different instrument)
- Screens: `web-screens.md` (`/gift`), `admin-screens.md` (§12 issuance/write-off)
- Free visit: `05-loyalty-free-visit.md` (priority `FinalPrice = 0`)
- Criteria: `acceptance-criteria/16-gift-certificates.md`
- ADR: `adr/0013-gift-certificates-payment-instrument.md`
- Context: `apps/api/src/gift-certificates/README.md`
