# Modal

Модальне вікно по центру. Вбудований `Dialog` (`placement="center"`): portal, focus-trap, Escape, клік по фону, блокування скролу, повернення фокуса.

## API

```ts
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: ReactNode;    // наприклад <Button>…</Button>
  className?: string;
  children: ReactNode;
}
```

- `createPortal(document.body)`, `role="dialog"` + `aria-modal`, `aria-labelledby`, `aria-describedby`.
- Tab/Shift+Tab — focus-trap у межах панелі; Escape — закриття.

## Стани

`closed · open (фокус у панель) · focus-visible`.

## Приклад

```tsx
<Modal open={confirmOpen} onClose={close} title="Скасувати запис?" footer={<Button onClick={close}>Ні</Button>}>
  <p>Депозит не повернеться — вікно 4 год.</p>
</Modal>
```

## Do / Don't

- ✓ деструктивне підтвердження, короткі форми, деталі поверх контенту.
- ✓ заголовок короткий; контент щадний, не багатосторінковий.
- ✗ не для великого контенту (довгі форми) — розглянути сторінку/`Sheet`.
- ✗ не відкривати Modal з іншого Modal.