# RatingStars

Оцінка 1–5 у відгуках. Два режими: read-only (перегляд) та інтерактивний (відгук).

## API

```ts
interface RatingStarsProps {
  value: number;                           // 0–5
  onChange?: (value: number) => void;      // заданий onChange = інтерактивний
  label?: string;                          // base-aria-label
  className?: string;
}
```

- Без `onChange` — read-only: `role="img"`, `aria-label="Оцінка: N з 5"`.
- З `onChange` — `role="radiogroup"`, радіо-кнопки з `aria-checked`.
- Заповнена зірка — `★` (Bone), порожня — `☆` (muted).

## Стани

`read-only · interactive · focus-visible`.

## Приклад

```tsx
<RatingStars value={4} />                      // перегляд
<RatingStars value={score} onChange={setScore} />  // вибір у відгуку
```

## Do / Don't

- ✓ для оцінки відвідувань і відгуків.
- ✓ цілі значення; половини/дроби згоди-swing лише після рішення дизайну.
- ✗ не робити свої «зірки» з чужої іконки — тільки ★/☆ системи.
- ✗ не міняти read-only на інтерактивний без зміни `role`.