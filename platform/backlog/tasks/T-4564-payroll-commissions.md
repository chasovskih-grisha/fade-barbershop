# T-4564 · Payroll & commissions: configurable rules, salary, commission, tips, bonuses, periods, reports

- **Stage**: M6 (phase 40) · **Tags**: backend, hr, finance, high-risk · **Complexity**: senior · **Depends on**: T-3300, T-3301, T-3303, T-4212, T-4547, T-4556
- **StoryPoints**: 21

## What

Розширення payroll engine (T-3300/3301/3303/4212) до гнучкої системи заробітної плати:
- **Compensation rules per barber**:
  - Fixed salary (базова ставка/місяць)
  - Percentage commission від послуг (різні % по категоріях послуг, T-4548)
  - Percentage commission від продажів продуктів (shop, T-270)
  - Revenue-based commission (після досягнення плану виручки — вищий %)
  - Tiered commission: 0-100k → 40%, 100-200k → 45%, 200k+ → 50%
  - Bonuses: за нові клієнти, за реферали (T-4554), за відгуки (T-4558), за досягнення KPI
  - Tips: розподіл (індивідуальні / пул по локації / гібрид) — T-4212
  - Penalties: no-show (T-4560), пізні приходи, порушення санітарних норм
- **Payroll periods**: тижневі / півмісячні / місячні, configurable cut-off dates
- **Payslip generation**: PDF з деталізацією (база + комісії по послугах/продажах + бонуси + чайові - штрафи - податки - соцвнески = net)
- **Tax & social contributions**: розрахунок ПДФО (18%), військовий збір (1.5%), ЄСВ (22% від ФОП/ТОВ) — конфігуровано під українське законодавство
- **Payout methods**: кеш (розмінний фонд T-4530), карта (переказ на IBAN), банківський переказ
- **Payroll reports**: реєстр нарахувань, відомість виплат, звіт податковому органу, банківський реєстр для зарахування на карти
- **Commission history**: повний лог нарахувань по барберу/послузі/періоду для аудиту (T-4216)
- **Versioning**: правила комісій версіонуються (T-4556), зміна правил не впливає на вже розраховані періоди

## Why

Прозора, автоматизована зарплата — задоволені барбери, менше помилок, комплаєнс з Законом про працю.

## Sources

- T-3300/3301/3303 (payroll/HR/attendance), T-4212 (tips), T-4547 (team management), T-4556 (rules engine)
- Altegio: zarobki fryzjerów, prowizje, premie, napiwki, okresy rozliczeniowe, wypłaty, raporty ZUS/US

## Done

- [ ] Domain: `CompensationRule` (barberId, type: FIXED/PERCENTAGE/TIERED/REVENUE_BASED, config, validFrom, validTo, version), `PayrollPeriod` (from, to, status: OPEN/CALCULATING/FINALIZED/PAID), `Payslip` (barberId, periodId, breakdown[], gross, deductions, net, status)
- [ ] Calculation engine: scheduled job на кінець періоду → збирає події (AppointmentCompleted, ProductSale, ReferralQualified, FeedbackReceived, NoShow) → apply CompensationRule → create Payslip (DRAFT)
- [ ] Review workflow: адмін переглядає DRAFT payslips → коректирує (manual adjustments) → FINALIZE → PAID
- [ ] Payout integration: банківський API (приват/монобанк/інші) для масового переказу, або експорт реєстру для банку
- [ ] Tax calculation: Ukrainian tax engine (ПДФО, військовий збір, ЄСВ для ФОП/ТОВ), оновлення ставок через конфіг
- [ ] Admin UI: Compensation Rules Manager, Payroll Periods, Payslips review, Payout execution, Reports
- [ ] Barber mobile: перегляд власного payslip (PDF), історія виплат, поточний нарахований (real-time projection)

## Risks

- [ ] **Legal compliance**: Трудовий кодекс, Податковий кодекс — регулярні оновлення, аудит юристом
- [ ] **Data sensitivity**: зарплата = PII — шифрування, доступ лише HR/Founder/Barber (власні)
- [ ] **Retroactive changes**: зміна правил не повинна перераховувати минулі періоди — immutable payslips після FINALIZED