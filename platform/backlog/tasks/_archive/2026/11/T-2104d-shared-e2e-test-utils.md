# T-2104d · Спільні e2e-фікстури: пакет @fade/test-utils

- **Stage**: M0 (phase 0) · **Tags**: backend, testing · **Complexity**: junior · **Depends on**: T-2104 (батьківська), T-002
- **StoryPoints**: 3

## What
Пакет `packages/test-utils` (`@fade/test-utils`) — єдине джерело правди e2e-фікстур: `testPhone`, `seedTestLocation`/`cleanupTestLocation` (FK-впорядковане піддерево), `seedBarberUser`/`assignBarber` (примітиви розділені: чужолокаційному барберу віконце не потрібне), `seedServiceWithPrices`, `seedRawBooking`/`walkInWindow`, `postWithRetry`/`patchWithRetry`. Споживання через workspace-мепер (jest `moduleNameMapper` + tsconfig `paths` → `src`), як contracts/domain-shared.

## Why
Дублі фіксур розповзалися по сюїтах (барбер-тріо ×4, service+price ×2, сирий Booking-рядок ×3, retry-цикл ×4) — копії відхилялися: різні ліміти спроб, забутий outbox при чистці. Пакет тримає інваріанти ADR 0019 (валідні телефони, FK-порядок) в одному місці і задає правило «нова e2e-сюїта бере фікстури звідси».

## Sources
- ADR 0019 (тест-ізоляція, валідні номери)
- docs/booking-flow-tests.md (GWT-фікстури — урок колізій телефонів)
- engineering-principles.md (гейти якості)

## Критерії
- [x] Пакет створено: юніт-спеки 12/12, tsc + lint чисті
- [x] Мігровано 4 фіксурні файли; `apps/api/src/shared/testing/` видалено
- [x] Повний прогон api: 493/493, `--coverage` EXIT=0
