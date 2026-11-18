# ProgressBar

Лояльність «X/7». **Сегменти-капсули** (висота 8, gap 4, радіус pill); 7-й візит — Bone-інверсія, не success.

## API

```ts
interface ProgressBarProps {
  value: number;
  total?: number;             // за замовченням 7
  label?: string;             // aria-label, за замовченням «Прогрес лояльності»
  className?: string;
}
```

- `role="progressbar"`, `aria-valuenow/min/max`.
- Сегменти: заповнені — `bg-fg-secondary`; **останній (7-й) заповнений — `bg-fg`** (Bone-інверсія — нагорода за 7-й візит, не зелений).
- Не заповнені — `bg-interactive`; останній не заповнений — контур `border-line-strong`.

## Стани

`0 · частково заповнений · 7 (повний, нагорода)`.

## Приклад

```tsx
<ProgressBar value={visitsCount} />
```

## Do / Don't

- ✓ тільки для лояльністі-прогресу X/7 (не як generic-прогрес).
- ✓ 7-й сегмент — саме Bone-інверсія, не `semantic-success`.
- ✗ не лінійний індикатор; сегменти-капсули — частина специфіки візуалу.
- ✗ `total` міняти без згоди дизайну — це сталість програми.