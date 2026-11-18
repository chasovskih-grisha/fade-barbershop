# Badge

Короткий маркер: категорія, промо, AI. Тон — з токенової палітри.

## API

```ts
interface BadgeProps {
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  children: ReactNode;
  className?: string;
}
```

- `neutral` — контур + surface (за замовченням).
- `accent` — синій контур/текст — **AI-бейдж** (`<Badge tone="accent">AI</Badge>`).
- `success` / `warning` / `danger` / `info` — семантичні заливки 15%.

## Стани

Passthrough (не інтерактивний). Тон задається статично.

## Приклад

```tsx
<Badge tone="accent">AI</Badge>
<Badge tone="success">Депозит сплачено</Badge>
```

## Do / Don't

- ✓ для статусів використовувати `StatusPill` (7 візит-статусів), не Badge.
- ✓ `accent` тільки для AI; не плутати з акцентною заливкою.
- ✗ не робити Badge кнопкою — для дій swing `Button`/chips.
- ✗ тон не використовувати для передачі змісту одному кольором.