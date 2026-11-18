# T-4547 · Team management: specialties, breaks, vacations, commission rules, performance

- **Stage**: M4 (phase 16+) · **Tags**: backend, frontend, hr · **Complexity**: middle · **Dependencies**: T-023, T-3300, T-4420, T-4447, T-4546
- **StoryPoints**: 13

## What

Extend T-023 (staff assignments) to HR management:
- **Barber specialties**: "barber × service" matrix (T-4521) + expertise level (junior/middle/senior) — affects price/commission
- **Breaks & personal time**: T-4420 (time blocks) extended — types: lunch, break, personal, vacation, sick leave, holiday
- **Vacation/Leave planner**: vacation calendar, vacation requests (admin approves), automatic slot blocking
- **Commission rules per barber**: % from services, % from sales (shop), fixed base, tiered (plan exceed → higher %), bonuses, no-show fines
- **Compensation rules**: payouts (cash/card/transfer), schedule (weekly/monthly), slips, taxes, social contributions (T-3300)
- **Performance dashboard (admin)**: utilization, appointments count, revenue, avg check, repeat client rate, no-show rate, cancellation rate, commission earned, tips, client retention
- **Client retention per barber**: % clients returned to this barber within 90 days

## Why

Team scaling: schedules, vacations, commissions, KPI — operational necessity for network (M6).

## Requirement sources

- T-023 (staff assignments), T-3300 (payroll), T-4420 (time blocks), T-4447 (barber leave), T-4546 (barber workspace)
- Altegio: profil fryzjera, specjalizacje, przerwy, urlopy, prowizje, KPI, retencja klientów

## Done

- [ ] Prisma: `StaffAssignment` extension + new models `VacationRequest`, `CommissionRule`, `PerformanceSnapshot`
- [ ] Admin UI: "Team" tab → barber card with tabs (Profile, Schedule, Commission, Performance, Vacations)
- [ ] Vacation workflow: request → approve/reject → automatic slot blocking (T-4414)
- [ ] Commission engine: rules configuration, calculation on `AppointmentCompleted` events (T-3300)
- [ ] Performance snapshots: daily/monthly KPI calculation, history
- [ ] API: `GET /admin/barbers/{id}/performance`, `POST /admin/barbers/{id}/vacation-requests`

## Risks

- [ ] **HR compliance**: Labor Code of Ukraine — vacations, sick leaves, break payment — lawyer consultation
- [ ] **Commission complexity**: tiered, smart defaults, rule versioning (T-4556 rules engine)
