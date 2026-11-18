# StatusPill

Статус візиту. Тон і підпис беруться з `visitStatus` у `tokens.json` — не дублюються в коді.

## API

```ts
type VisitStatus = 'booked' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'waitlist_hold';

interface StatusPillProps {
  status: VisitStatus;
  label?: string;        // кастомний підпис (для легенд/фільтрів)
  className?: string;
}
```

| Статус | Підпис | Тон |
|--------|--------|-----|
| booked | Заброньовано | neutral |
| confirmed | Підтверджено | info |
| in_progress | В процесі | accent |
| completed | Завершено | success |
| cancelled | Скасовано | muted |
| no_show | Не прийшов | danger |
| waitlist_hold | Лист очікування | warning |

## Приклад

```tsx
<StatusPill status={visit.status} />
```

## Do / Don't

- ✓ статуси візиту показувати тільки цим компонентом (single source у tokens.json).
- ✓ у `CalendarDay`, `Table`, картках візиту.
- ✗ не задавати тон самостійно — він живе в `tokens.json`.
- ✗ не використовувати для інших маркерів — там `Badge`.