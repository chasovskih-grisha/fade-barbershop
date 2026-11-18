# T-4556 · Business rule engine: configurable rules for booking, cancellation, loyalty, pricing, etc.

- **Stage**: M4 (phase 16+) · **Tags**: backend, architecture, business-rules · **Complexity**: senior · **Depends on**: T-4522, T-4444, T-4450, T-4545, T-4553, T-4000
- **StoryPoints**: 21

## What

Універсальний двигун бізнес-правил (P2 з Canvas) — замінює hardcoded умови в коді на конфігуровані правила:
- **Rule types**: BookingRules, CancellationRules, ReschedulingRules, DepositRules, NoShowRules, LoyaltyRules, MembershipRules, DiscountRules, ReferralRules, CommissionRules, NotificationRules, ResourceRules
- **Rule definition**: JSON Logic (або CEL) — декларативні вирази над контекстом (appointment, client, barber, service, location, time, policy)
- **Versioning**: правила мають версії, ефективні дати (from/to), чернетка/активне/архівне
- **Evaluation context**: увесь необхідний стан для прийняття рішення (напр., для cancellation: hoursUntilSlot, clientNoShowCount, depositPaid, policyConfig)
- **Rule registry**: CRUD в адмінці, тестування (playground з прикладом контексту), версіонування
- **Integration points**: use cases викликають `RuleEngine.evaluate(ruleType, context)` → `{ allowed: boolean, reason?: string, modifications?: Partial<Context> }`
- **Audit**: кожне спрацювання правила логується (ruleId, version, context, result) для T-4216

## Why

Уникнути розкиданих `if (client.noShowCount > 2) ...` по коді. Централізована конфігурація, безпечні зміни бізнес-логіки без деплою.

## Sources

- T-4522 (slot policy), T-4444 (deposit policy versioning), T-4450 (loyalty config), T-4545 (segmentation), T-4553 (promotions), T-4000 (pricing engine)
- Canvas P2: "Rules governance — create only after deposit, slot, loyalty, and promotion policies demonstrate shared versioning, permissions, and audit needs"
- Altegio: reguły biznesowe, konfiguracja polityk, wersjonowanie, audyt

## Done

- [ ] Core: `RuleEngine` (parser JSON Logic/CEL, sandboxed evaluation, type-safe context), `RuleRegistry` (CRUD, versioning)
- [ ] Context providers: для кожного ruleType — провайдер що збирає контекст з DB (appointment, client, barber, location, policy)
- [ ] Integration: заміна hardcoded перевірок в `bookAppointment`, `cancelAppointment`, `rescheduleAppointment`, `calculatePrice`, `calculateCommission`, `sendNotification`
- [ ] Admin UI: Rule Builder (visual), Playground (test context → result), Version history, Activation toggle
- [ ] Testing: unit Tests правил, property-based Tests engine, integration Tests use cases
- [ ] Migration: існуючі hardcoded правила → конфігурація в RuleRegistry (поетапно)

## Risks

- [ ] **Performance**: evaluation на критичному шляху (booking) — кешування скомпільованих правил, < 5ms
- [ ] **Complexity creep**: не робити Turing-complete — обмежити JSON Logic примітивами, без циклів/функцій
- [ ] **Rollback**: погане правило може зламати продажі — feature flag на engine, швидкий відкат до hardcoded