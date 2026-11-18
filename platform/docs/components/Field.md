# Field

Обгортка поля форми: `label` + вміст + `help`/`error`. Поля (TextField, PhoneInput…) будуються на `Field`.

## API

```ts
interface FieldProps {
  id: string;
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}
```

- `required` — маркер `*` біля label (колір danger).
- `help` — текст під полем, muted.
- `error` — текст під полем, danger, `role="alert"`; замінює `help`.
- `id` — зв'язок `htmlFor`; ID для `help`/`error` генерує `messageIds`.

## Стани

`default · error · (help) · required`.

## Приклад

```tsx
<Field id="name" label="Ім'я" required error="Заповніть ім'я">
  <input id="name" className="h-11 w-full ..." />
</Field>
```

## Do / Don't

- ✓ кожне поле форми — через `Field` (label/help/error не дублюються локально).
- ✓ помилка — конкретний текст, не тільки колір рамки.
- ✗ не показувати `help` і `error` одночасно (error пріоритет).
- ✗ не робити власні label/error-блоки у компонентах полів.