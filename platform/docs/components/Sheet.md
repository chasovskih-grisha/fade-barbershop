# Sheet

Панель знизу (`Dialog`, `placement="bottom"`), `rounded-t-card`, `max-h-[85vh]`. Мобільні сценарії та «дотикові» дії.

## API

```ts
interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}
```

Та сама поведінка, що в `Modal`: portal, focus-trap, Escape, фон-клік, скрол-замок, повернення фокуса.

## Стани

`closed · open · focus-visible`.

## Приклад

```tsx
<Sheet open={addOpen} onClose={close} title="Додати послугу">
  <ServiceForm />
</Sheet>
```

## Do / Don't

- ✓ form-мини-сценарії на мобільному: швидкий запис, швидке додавання в admin.
- ✓ великий контент обмежений `max-h-[85vh]` зі скролом тіла.
- ✗ не для підтверджень з наслідком на десктопі — там `Modal`.
- ✗ не вкладати Sheet у Sheet.