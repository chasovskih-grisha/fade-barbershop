# EmptyState

Пустий стан списку/секції з наступною дією (наприклад waitlist-CTA, «немає слотів»).

## API

```ts
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;    // Button/CTA
  className?: string;
}
```

- Центрована плашка `bg-surface-raised` + `border-line`.

## Приклад

```tsx
<EmptyState
  title="Немає вільних слотів"
  description="Додайте себе в лист очікування"
  action={<Button onClick={joinWaitlist}>У лист очікування</Button>}
/>
```

## Do / Don't

- ✓ завжди з наступною дією, де вона можлива (не глухий кут).
- ✓ опис пояснює «чому порожньо» і «що зробити».
- ✗ не порожній div або самотній текст без дії.
- ✗ не показувати EmptyState під час завантаження — там Skeleton.