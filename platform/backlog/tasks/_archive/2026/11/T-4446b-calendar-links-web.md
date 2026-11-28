# T-4446b · Add to calendar: links on the cabinet visit card

- **Stage**: M3 (phase 7) · **Tags**: frontend · **Complexity**: junior · **Depends on**: T-4446a
- **StoryPoints**: 2

## What

Слайс T-4446 для веб-кабінету: на картці візиту (`/account/appointments`) — «Додати в календар».

- `.ics` — посилання на власний файл візиту через cookie-проксі Next (`/api/appointments/:id/calendar`), клік відкриває системний календар.
- Google Calendar — посилання `TEMPLATE` з початком і кінцем візиту (UTC-штампи), назвою, майстром і локацією.
- Скасований візит посилань не показує; без `startsAt`/`endsAt` блок не рендериться.

## Sources

- T-4446; `booking-flow.md` («Після підтвердження»), `client-screens.md` (кабінет)

## Implementation plan

- `apps/web/src/lib/calendar-links.ts`
- `apps/web/src/lib/__tests__/calendar-links.test.ts`
- `apps/web/src/app/account/appointments/AddToCalendar.tsx`
- `apps/web/src/app/account/appointments/__tests__/add-to-calendar.test.tsx`
- `apps/web/src/app/api/appointments/[id]/calendar/route.ts`
- `apps/web/src/app/account/appointments/AppointmentCard.tsx`
- `apps/web/src/lib/api/appointment-types.ts`
- `apps/web/src/lib/api/appointments.ts`

Checks:

- `pnpm --filter @fade/web exec jest --runTestsByPath $PWD/apps/web/src/lib/__tests__/calendar-links.test.ts $PWD/apps/web/src/app/account/appointments/__tests__/add-to-calendar.test.tsx`

## Done

- [x] Кнопка календаря на картці візиту з початком і кінцем
- [x] `.ics` і Google Calendar відкриваються з кабінету

## Risks

- [x] **Застарілий час у посиланні**: картка бере `startsAt`/`endsAt` з відповіді сервера, не з локального стану

## Out of scope

- Кнопка на екрані підтвердження запису (гостьовий флоу без сесії)

## Implementation notes

- apps/web/src/app/account/appointments/AddToCalendar.tsx
- apps/web/src/app/account/appointments/__tests__/add-to-calendar.test.tsx
- apps/web/src/app/api/appointments/[id]/calendar/route.ts
- apps/web/src/lib/__tests__/calendar-links.test.ts
- apps/web/src/lib/api/appointment-types.ts
- apps/web/src/lib/api/appointments.ts
- apps/web/src/lib/calendar-links.ts

## QA

- `pnpm --filter @fade/web exec jest --runTestsByPath $PWD/apps/web/src/lib/__tests__/calendar-links.test.ts $PWD/apps/web/src/app/account/appointments/__tests__/add-to-calendar.test.tsx` exit 0
