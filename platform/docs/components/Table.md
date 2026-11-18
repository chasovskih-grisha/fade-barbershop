# Table

Таблиці admin-списків: локації, послуги, клієнти, оплати. Складається з семантичних частин.

## API

```tsx
<Table>      // border-collapse, text-body
  <THead>    // text-caption text-fg-muted
    <TR>
      <TH scope="col">…</TH>   // px-3 py-2, text-left
    </TR>
  </THead>
  <TBody>    // divide-y divide-line
    <TR>                      // hover:bg-surface-raised
      <TD>…</TD>              // px-3 py-2
    </TR>
  </TBody>
</Table>
```

## Стани

`default · row-hover · row-focus (focus-visible)`.

## Приклад

```tsx
<Table>
  <THead><TR><TH>Локація</TH><TH>Адреса</TH></TR></THead>
  <TBody>
    <TR><TD>Lviv Town</TD><TD>вул. Тепла, 5</TD></TR>
  </TBody>
</Table>
```

## Do / Don't

- ✓ data-dense, без зайвих рамок — dividers між рядками.
- ✓ числові колонки — `tabular-nums`, вирівнювання right у `TD`.
- ✗ не використовувати Table для стрічок/карток з різними висотами.
- ✗ статуси/тони не в комірці напряму — `StatusPill`/`Badge`.