# PriceBreakdown

**Єдиний** спосіб показу ціни (DSC-006, ADR 0006/0007): послуга → знижки → фінальний рядок.

## API

```ts
interface PriceLine {
  label: string;
  amount: number;   // гривні, цілі
}

interface PriceBreakdownProps {
  service: PriceLine;
  discounts?: PriceLine[];
  finalAmount: number;
  className?: string;
}
```

- Суми у валюти форматує `formatMoney` (₴, тисячі — нерозривний пробіл).
- Знижки показуються «−N ₴» зі знаком мінус (success), незалежно від знаку `amount`.
- Фінальний рядок «Разом» — акцентна типографіка.

## Приклад

```tsx
<PriceBreakdown
  service={{ label: 'Стрижка', amount: 700 }}
  discounts={[{ label: 'Перше відвідування', amount: -100 }]}
  finalAmount={600}
/>
```

## Do / Don't

- ✓ скрізь, де блокується ціна: екран 3, оплата, чек, відгук.
- ✗ «стара ціна + знижка» окремими розрізненими написами.
- ✗ ручне форматування ₴ у екранах.
- ✓ discounts завжди через поля `PriceLine`, ніколи не hardcode.