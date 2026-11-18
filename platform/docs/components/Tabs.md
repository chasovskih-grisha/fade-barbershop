# Tabs

Вкладки для перемикання однорідних блоків (наприклад «Послуги» / «Ціни» на сайті).

## API

```ts
interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}
```

- Активна вкладка — `value`; fallback на першу.
- ARIA: `role=tablist/tab/tabpanel`, `aria-selected`, `aria-controls`, `tabIndex`-roвинг.
- Клавіатура: `ArrowLeft/ArrowRight`, `Home`, `End` з пропуском `disabled`.

## Стани

`default · selected · hover · focus-visible · disabled`.

## Приклад

```tsx
<Tabs
  value={tab}
  onChange={setTab}
  items={[
    { id: 'services', label: 'Послуги', content: <ServicesList /> },
    { id: 'prices', label: 'Ціни', content: <PriceTable /> },
  ]}
/>
```

## Do / Don't

- ✓ для переключення стану в межах сторінки/картки.
- ✗ не для навігації між сторінками — там роутер/посилання.
- ✓ стани контенту тримати в компоненті вкладки (умовний рендер всередині).