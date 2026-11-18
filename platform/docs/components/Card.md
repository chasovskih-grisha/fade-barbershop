# Card

Контейнер контенту на поверхні `radius-card` (`bg-surface-raised`, `border-line`).

## API

```ts
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}
```

- за замовченням — статична поверхня `p-4`.
- `interactive` — hover (`border-line-strong`, поверхня `surface-base`) + `focus-visible` рing.

## Стани

`default · hover (interactive) · focus-visible (interactive)`.

## Приклад

```tsx
<Card interactive onClick={openLocation}>
  <h3>{location.name}</h3>
</Card>
```

## Do / Don't

- ✓ базова «плашка» списків: локації, послуги, візити, барбери.
- ✓ `interactive` лише коли весь card клікабельний.
- ✗ не робити Card клікабельним через onClick без role/клавіатури — для цього `interactive`.
- ✗ не вкладати Card у Card без потреби (щадити ієрархію поверхонь).