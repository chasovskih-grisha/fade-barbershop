# T-4546 · Barber workspace: commissions, tips, performance stats, add-on services

- **Stage**: M2 (phase 7-8) · **Tags**: frontend, barber · **Complexity**: middle · **Depends on**: T-082, T-083, T-084, T-3300, T-4212
- **StoryPoints**: 8

## What

Expansion of barber mobile (T-082/083/084) into a full-featured working tool:
- **Commissions view**: view own commissions by bookings (after T-3300), period filter, payout total
- **Tips view**: tips from payments (T-4212), split by bookings/clients
- **Performance stats**: period KPIs — number of bookings, revenue, average ticket, repeat client %, no-show rate, cancellation rate, utilization (working hours / booked hours)
- **Add-on services during visit**: "Add service" button in active visit card (T-4537) — select from barber's available services, instant price recalculation, receipt update
- **Visit notes**: internal + client-visible (T-4535) with voice-to-text (optional)
- **Client preferences**: view favorite services, allergies, notes from previous visits
- **Schedule management**: if "Barber manages schedule" is enabled (T-4522/phase 22) — edit own slots

## Why

Barber is the core economic unit. Earning transparency + ability to upsell during a visit = higher revenue.

## Sources

- T-082/083/084 (barber mobile), T-3300 (payroll), T-4212 (tips), T-4537 (composite appointments)
- Altegio: barber panel — commissions, tips, statistics, adding services during visit

## Done

- [ ] API: `GET /barber/me/stats?period=`, `GET /barber/me/commissions`, `GET /barber/me/tips`
- [ ] Mobile: tabs "Today", "Schedule", "Statistics", "Earnings"
- [ ] Add-on flow: service selection modal (only services available to the barber), price confirmation, `AppointmentServiceAdded` event
- [ ] Real-time amount update in visit card (WebSocket T-081)
- [ ] Permissions: barber CANNOT see other barbers' finances, cannot see location general reports

## Risks

- [ ] **Commission calculation**: depends on T-3300 (payroll engine) — before T-3300 is ready, show "Coming soon" or simplified % of services
- [ ] **Add-on mid-visit**: requires fiscal receipt update (T-092) — billing integration