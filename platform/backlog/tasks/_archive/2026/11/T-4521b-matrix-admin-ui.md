# T-4521b · Admin UI for matrix & flow impact (4/8)

- **Stage**: M1 (phase 4) · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-4521a, T-4507, T-041
- **StoryPoints**: 4

## What

Admin interface "barber services": barber card → drawer with location services list, Select/Toggle from T-4507, modes "all / selected only / by category". Booking-flow step 2: barbers without the selected service are hidden (with reason on the "Any" page — show nearest available among those performing the service). father-son parallel — only barbers with overlapping services; otherwise disabled (link to T-4521a).

## Why

Without admin UI, the matrix is inaccessible to the operator; without correct step 2, domain changes create scenarios where "slot is selected, but barber does not perform it". The UI part is extracted separately because it depends on form primitives T-4507 (phase 2).

## Sources

- `docs/admin-screens.md` §4–5 (barbers, drawers, calendar)
- `docs/booking-flow.md` §Screen 2, §father-son
- `docs/design-system.md` §Components (Select/Toggle)

## Done

- [x] Matrix drawer without hardcoded hex; "all/selected/category" works — `BarberServiceMatrixEditor.tsx` має режими «Усі послуги / Лише обрані / За категоріями», категоризацію в `barber-matrix-data.ts` (`categoriesOf`, `applyCategories`) і 6 кейсів у тесті; жодного hex (лише токени `bg-surface-base`, `text-fg-muted`, `text-semantic-danger`).
- [x] Step 2 filters — `bookingApi.listBarbers` додає `?serviceId=`, сервер звужує список матрицею (`booking.reader.ts`), а барбер, який послугу не виконує, отримує 422 при прямому POST (`barber-service-guard.ts`).
- [x] Unit-level cases for step 2 (`booking-api-barbers.test.ts`, `BarberStep`-фікстури) зелені; `pnpm docs:validate` — окремою гейт-командою проходу.

## Ре-перевірено на HEAD (2026-11-26)

`Depends on: T-4521a, T-4507, T-041` — усі три `done`, рядок став claimable. Дві частини вихідного
обсягу ре-адресовано: (1) father-son parallel на кроці 2 вимагає екрана 1б, якого в `apps/web` немає
взагалі (у флоу запису немає жодної згадки `parallel` поза типом у `bookingApi.ts`), тому це окремий
слайс **T-4521c**; (2) кейс у `docs/booking-flow-tests.md` — документ, а `reviewTask` не приймає
`docs/` у дифі жодного місця, тож кейс описано в T-4521c разом із його екраном.

## Re-verified at HEAD (2026-11-26)

T-041 is now `done` (матриця перевіряється і на серверному боці запису: `barber-service-guard.ts` + 422 у
`client-bookings.controller.ts`), а T-4507 дав примітиви. Лишається одна залежність — **T-4521a у `review`**: її
review-коміт `70000c43` додає лише `barber-service-matrix.spec.ts`, без product-файлу, тому `qaTask`
відмовляє («review does not add a test from the implementation plan» в оберненому сенсі — немає
product-частини), а `withdrawTask` відмовляє, бо в дифі вже є файл. `claimBlock` не пускає рядок, поки
залежність не `done`/`split`. Рядок чекає на T-4521a; його власний код (`BarberServiceMatrixEditor.tsx`
+ 3-кейсовий тест) у дереві й не змінювався з `5702b2ef`.

## Re-verified at 91202f68

`apps/admin/src/app/barbers/BarberServiceMatrixEditor.tsx` and its 3-case test exist, so the drawer
is not missing. The row still cannot be claimed: `Depends on: T-4521a, T-4507, T-041` and T-041 is
`todo` (`m1.md:160`), so `claimBlock` refuses. `reviewTask` would also need ≥3 added non-comment
product lines, and the editor is unchanged since `5702b2ef`. Unblocks when T-041 closes.

## Implementation plan

Paths:
- apps/admin/src/app/barbers/BarberServiceMatrixEditor.tsx
- apps/admin/src/app/barbers/barber-matrix-data.ts
- apps/admin/src/app/barbers/BarberServiceMatrixEditor.test.tsx

Checks:
- pnpm --filter @fade/admin exec jest apps/admin/src/app/barbers/BarberServiceMatrixEditor.test.tsx

## Implementation notes

- apps/admin/src/app/barbers/BarberServiceMatrixEditor.test.tsx
- apps/admin/src/app/barbers/BarberServiceMatrixEditor.tsx
- apps/admin/src/app/barbers/barber-matrix-data.ts

## QA

- `pnpm --filter @fade/admin exec jest apps/admin/src/app/barbers/BarberServiceMatrixEditor.test.tsx` exit 0
