# cn

Злиття Tailwind-класів для variant-API (twMerge-патерн без додаткових deps).

## API

```ts
function cn(...classes: Array<string | undefined | null | false>): string
```

Відкидає falsy, об'єднує рядки з пріоритетом останнього дублюючого класу.

## Приклад

```tsx
<button className={cn('h-11 rounded-input', variant === 'primary' && 'bg-accent', className)}>
```

## Do / Don't

- ✓ у кожному компоненті дизайн-системи для variant-класів + зовнішнього `className`.
- ✓ патерн variant у константі (приклад: `VARIANTS`, `TONES`).
- ✗ не конструювати класи через конкатенацію/шаблони — тільки через `cn`.