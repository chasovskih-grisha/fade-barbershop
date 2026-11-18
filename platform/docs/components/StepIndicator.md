# StepIndicator

Кроки флоу запису (T-053). Сегменти-лінії 16×3, капсульні: done → muted, current → text.primary.

## API

```ts
interface StepIndicatorProps {
  steps: string[];    // підписи кроків для скрін-рідерів
  current: number;    // 0-based індекс поточного кроку
  className?: string;
}
```

- `steps` — окремі `<span class="sr-only">`, видимий сегмент — мапа стану.
- `current` позначається `aria-current="step"`.

## Стани сегмента

`done (bg-fg-muted) · current (bg-fg) · future (bg-interactive)`.

## Приклад

```tsx
<StepIndicator steps={['Послуга', 'Час', 'Оплата']} current={1} />
```

## Do / Don't

- ✓ тільки індикація прогресу флоу, не кнопки навігації.
- ✓ підписи кроків обов'язково передавати (доступність).
- ✗ не міняти формулювання блоку кроків у межах одного флоу.
- ✗ не використовувати цифри-баджі «1», «2», «3» — це не єдина реалізація.