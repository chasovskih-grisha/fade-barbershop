# T-4550 · Memberships: plans, pricing, duration, visits, discounts, renewals, reporting

- **Stage**: M4 (phase 11) · **Tags**: backend, frontend, billing, crm · **Complexity**: senior · **Depends on**: T-090, T-091, T-140, T-3901, T-4549
- **StoryPoints**: 13

## What

Full-fledged membership system — extending T-3901 (service packages) to subscriptions:
- **Membership plans**: name, price, duration (30/90/180/365 days), included services (serviceId list or category), visit limit (unlimited or N), discount on additional services (%)
- **Membership purchase**: online (web/mobile) or in admin/onsite — creating `MembershipInstance` with `startDate`, `endDate`, `remainingVisits`, `status: ACTIVE/PAUSED/EXPIRED/CANCELLED`
- **Membership usage**: during booking — select "Pay with membership" → decrement `remainingVisits`, `FinalPrice = 0` (if within limit), receipt without payment
- **Over-limit handling**: if visits exceed the plan — pay the difference (service price - membership discount)
- **Pause/Resume**: client/admin can pause (e.g., illness) — extending `endDate` by pause days
- **Auto-renewal**: optional — Stripe/Wayforpay subscription (recurring), charge attempt 3 days before expiration, notification
- **Cancellation**: expiration of unconsumed visits (policy: refund / no refund / balance transfer)
- **Expiration notifications**: push/SMS/email 7/3/1 day before expiration (T-080, T-3100)
- **Membership sales reporting**: sold memberships, revenue, usage (redeem rate), membership churn
- **Gift membership**: buying a membership as a gift (certificate for membership)

## Why

Repeat sales, prepaid revenue, customer retention. Altegio: abonamenty, karnety, automatyczne przedłużanie.

## Sources

- T-3901 (service packages), T-090/091 (billing), T-140 (loyalty), T-4549 (payments), T-080/3100 (notifications)
- Altegio: abonamenty, karnety, automatyczne odnawianie, raporty sprzedaży

## Done

- [ ] Domain: `MembershipPlan`, `MembershipInstance` (clientId, planId, startDate, endDate, remainingVisits, status, pauseHistory[])
- [ ] Purchase flow: web/mobile/admin → Payment (T-4549) → MembershipInstance created → event `MembershipPurchased`
- [ ] Booking integration: selection of membership as payment method, validation of `remainingVisits > 0`, `endDate > now`
- [ ] Pause/Resume use cases, admin UI
- [ ] Auto-renewal: integration with acquiring (recurring payments), webhook handling of success/failure
- [ ] Notifications: scheduled jobs for expiration reminders
- [ ] Admin reporting: dashboard with sales, usage, churn
- [ ] Gift membership: purchase → certificate code → activation by recipient

## Risks

- [ ] **Recurring payments**: PCI DSS, card token storage — via acquiring gateway (T-090), not in-house
- [ ] **Pause abuse**: limit of pauses per year, minimum pause duration
- [ ] **Over-limit pricing**: clear rule: membership discount applies to the full service price
