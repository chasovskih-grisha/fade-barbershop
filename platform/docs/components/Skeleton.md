# Skeleton

Заповнювач контенту під час завантаження. Завантаження > 300 мс → skeleton локальної зони, не спінер на всю сторінку.

## API

```ts
interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'text' | 'circle' | 'rect';
}
```

- `text` — рядок h-4, `radius-micro` (за замовченням).
- `circle` — коло (`rounded-pill`) — для аватарів.
- `rect` — прямокутник `radius-card` — для карток/героїв/фото.
- Завжди `aria-hidden="true"` (декоративний).

## Приклад

```tsx
<div className="flex flex-col gap-2">
  <Skeleton variant="circle" className="h-12 w-12" />
  <Skeleton />
  <Skeleton />
</div>
```

## Do / Don't

- ✓ skeleton локальної зони (список візитів, картка слота), поки дані їдуть.
- ✓ розмір підгоном `className` (ширина/висота).
- ✗ не спінер «на всю сторінку» замість skeleton.
- ✗ не рендерити skeleton поруч із реальним контентом (перемикання loading→data).