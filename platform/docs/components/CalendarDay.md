# CalendarDay / CalendarWeek

Календар admin і барбера: день з візитами та тиждень (сітка 7 колонок).

## API

```ts
interface CalendarVisit {
  id: string;
  time: string;      // "10:00"
  status: VisitStatus;
}

interface CalendarDayProps {
  label: string;          // назва дня/дата
  dateLabel?: string;     // додатковий підпис (наприклад число)
  isToday?: boolean;
  visits?: CalendarVisit[];
  onSelect?: () => void;  // заданий onSelect → рендер як <button>
  className?: string;
}

interface CalendarWeekProps {
  days: CalendarDayProps[];
  className?: string;
}
```

- Візити — `time` + `StatusPill`.
- `isToday` — підсвічена межа.
- \( \text{без onSelect} \) — `<div>`; з `onSelect` — `<button>` з hover/focus-станом.

## Стани

`default · today · з/без візитів · interactive (onSelect) · focus-visible`.

## Приклад

```tsx
<CalendarWeek days={days} />

// барбер: денна картка
<CalendarDay label="Пн, 21 вер" isToday visits={visits} onSelect={openDay} />
```

## Do / Don't

- ✓ адмін/барбер-календар — через ці компоненти з `StatusPill`.
- ✓ `onSelect` лише коли день інтерактивний (перехід у денний вигляд).
- ✗ не рендерити власну сітку тижня `<table>`/grid у екранах.
- ✗ не передавати «сирі» періоди годин без статусу — все через `CalendarVisit`.