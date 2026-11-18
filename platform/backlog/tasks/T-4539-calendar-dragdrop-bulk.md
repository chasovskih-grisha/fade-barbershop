# T-4539 · Admin calendar: drag&drop reschedule, bulk actions, multi-view

- **Stage**: M1 (phase 4) · **Tags**: frontend, backend, design · **Complexity**: middle · **Depends on**: T-045, T-4524, T-4524a, T-4524b
- **StoryPoints**: 8

## What

Розширення T-4524 (admin calendar productivity) до повноцінного інструменту:
- **Views**: Day / Week / Month / Barber (колонки по барберах) / Team (combined)
- **Filters**: по барберу, послузі, статусу, локації, джерелу (T-4536), клієнту (пошук)
- **Drag&drop**: перетягування запису між слотами/барберами/днями з валідацією (T-4524a)
- **Resize**: зміна тривалості потягуванням краю (якщо слот-політика дозволяє, T-4522)
- **Bulk selection**: Ctrl/Shift + клік, "Select all visible" → групові дії:
  - Перенести на інший час/день/барбера
  - Скасувати з причиною (T-4474)
  - Змінити статус
  - Надіслати нагадування/повідомлення
  - Add internal note
- **Today shortcut**: кнопка "Сьогодні", клавіша `T`
- **Search**: по імені клієнта, телефону, послузі в межах видимого періоду
- **Keyboard navigation**: стрілки між слотами, Enter — дії, Escape — відміна виділення

## Why

Оператор на рецепції щодня управляє десятками записів. Drag&drop + bulk — критично для продуктивності.

## Sources

- T-045 (admin calendar), T-4524 (productivity), T-4524a/b (slices), admin-screens.md §5
- Altegio: kalendarz przeciągnij-i-upuść, widok dzienny/tygodniowy/miesięczny, filtry, akcja masowe

## Done

- [ ] React-компонент `AdminCalendar` з перемикачем views (Day/Week/Month/Barber/Team)
- [ ] Drag&drop з `dnd-kit` або нативний HTML DnD, валідація через `Availability` API
- [ ] Bulk toolbar з групами дій, клавіатурні скорочення
- [ ] Фільтри в sidebar: мультивыбір барберів, послуг, статусів, локацій
- [ ] Пошук з debounce, підсвічування знайдених записів
- [ ] E2E Tests: drag&drop reschedule, bulk cancel, bulk move, filter combinations

## Risks

- [ ] **Перформанс**: тижневий/місячний вид — сотні записів → віртуалізація + пагінація по часу
- [ ] **Конфлікти drag&drop**: слот зайнявся між drag і drop — оптимістичне блокування (T-4524a risk)