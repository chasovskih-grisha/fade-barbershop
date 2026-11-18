# Toast

Легке зворотне сповіщення після дії (збережено, записано, помилка).

## API

```ts
interface ToastProps {
  title: string;
  tone?: 'info' | 'success' | 'warning' | 'danger';
  description?: string;
  action?: ReactNode;               // наприклад Button ghost
  onClose?: () => void;             // кнопка × + автозакриття
  duration?: number;                // мс; з onClose вмикає таймер
  className?: string;
}

interface ToastViewportProps {
  children: ReactNode;
  className?: string;
}
```

- `role` — `alert` для danger, `status` для решти.
- `ToastViewport` — фіксований контейнер знизу, одна штука на екран.

## Стани

`info · success · warning · danger`.

## Приклад

```tsx
<ToastViewport>
  {toasts.map((t) => (
    <Toast key={t.id} title={t.title} tone={t.tone} onClose={close} duration={5000} />
  ))}
</ToastViewport>
```

## Do / Don't

- ✓ для підтвердження циклічних операцій (запис створено, оплата).
- ✓ одну й ту саму дію не дублювати toast + інлайн-блок.
- ✗ не для деструктивних підтверджень — там Modal з наслідком.
- ✗ не тримати кілька toast-стеків на одній сторінці.