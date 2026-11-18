# T-4562 · Resources: chairs, rooms, equipment, assignment, conflicts, capacity, blocking

- **Stage**: M4 (phase 16+) · **Tags**: backend, scheduling, resources · **Complexity**: senior · **Depends on**: T-023, T-040, T-4420, T-4521, T-4537, T-4548, T-4213
- **StoryPoints**: 13

## What

Управління фізичними ресурсами (крісла, кабінки, обладнання) для запобігання подвійному букінгу:
- **Resource types**: CHAIR (крісло), STATION (робоча станція), ROOM (кабінка), EQUIPMENT (фен, машинка, sterilizer), BOOTH (арендоване крісло T-4213)
- **Resource properties**: назва, тип, локація, capacity (зазвичай 1), metadata (для equipment — серійний номер, дата обслуговування)
- **Resource assignment to services**: послуга вимагає ресурсів (напр., "Фарба" → CHAIR + EQUIPMENT: mixer, bowl) — T-4548 `resourceIds[]`
- **Resource assignment to appointments**: при букінгу — автоматичне призначення вільного ресурсу за типом/локацією, або ручне адміном
- **Availability calculation**: слот вільний тільки якщо є вільні ресурси, потрібні для послуг (T-040 availability + resource constraints)
- **Resource conflicts**: запобігання подвійному букінгу одного ресурсу (інваріант: resource.capacity = 1 → максимум 1 запис на час)
- **Resource booking**: адмін може забронювати ресурс на час (технічне обслуговування, тренінг) — time-block з типом RESOURCE_BLOCK
- **Resource capacity**: для майбутнього — ресурси з capacity > 1 (напр., зона очікування)
- **Resource blocking**: тимчасове виведення з експлуатації (зламаний фен, ремонт кабінки) — статус INACTIVE, автоматичне виключення з доступності
- **Booth rental integration**: T-4213 — ресурс TYPE=BOOTH, прив'язка до договору оренди, автоматичне блокування для не-орендаря

## Why

Фізичні обмеження: 2 крісла (T-040c) — це ресурси. Кабінки для спрінгу, обладнання для фарбування — теж. Без ресурсів — конфлікти.

## Sources

- T-023 (staff assignments), T-040 (availability), T-4420 (time blocks), T-4521 (barber-service matrix), T-4537 (composite), T-4548 (service resources), T-4213 (booth rental)
- Altegio: zasoby (fotele, pokoje, sprzęt), przydział do usług, konflikty, pojemność, blokady

## Done

- [ ] Domain: `Resource` (id, type, locationId, name, capacity, status: ACTIVE/INACTIVE, metadata), `ResourceAssignment` (resourceId, serviceId?/appointmentId?, type: SERVICE_REQUIREMENT/APPOINTMENT_ALLOCATION/BLOCK)
- [ ] Availability engine: розширення `Availability` (T-040) з resource constraints — слот вільний якщо ∃ resource для кожного wymaganого типу
- [ ] Allocation algorithm: при букінгу — greedy allocation вільних ресурсів, детерміноване (по id) для відтворюваності
- [ ] Conflict detection: валідація в `bookAppointment` / `rescheduleAppointment` — resource double-booking = error
- [ ] Admin UI: Resources CRUD, календар ресурсу (як T-045 але по ресурсах), bulk block/unblock
- [ ] Service config: UI для прив'язки ресурсів до послуг (T-4548)
- [ ] Booth rental: ресурс BOOTH → доступний лише орендарю + адміну

## Risks

- [ ] **Performance**: resource constraints в availability — додаткові JOIN, кешування free resources по слотах
- [ ] **Circular deps**: scheduling ↔ resources — resources в shared kernel, scheduling залежить від resources