# T-4521e · Редактор матриці в межах LOC-гейта

- **Stage**: M1 · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-4521d

## What

Хвіст T-4521b: `eslint` падав на `BarberServiceMatrixEditor.tsx` (`max-lines` 163 і
`complexity` 15) та його спеці (128 рядків), а в `barber-matrix-data.ts` лишалося 115.
Розділено без зміни поведінки: категорії — окремий модуль, стан — хук, панелі — компоненти.

## Done

- [x] `barber-matrix-categories.ts`: `MatrixService`, `UNCATEGORIZED`, `toMatrixService`, `categoriesOf`; дані реекспортують їх.
- [x] `use-barber-matrix.ts` тримає стан і запити; `MatrixModePicker`/`MatrixCategoryPicker`/`MatrixServiceList`/`MatrixStatus`/`MatrixPanels` — розмітку.
- [x] Спека розділена на режими «всі/обрані» та «за категоріями», по одному прогону на файл.

## Implementation plan

Paths:
- apps/admin/src/app/barbers/barber-matrix-categories.ts
- apps/admin/src/app/barbers/barber-matrix-data.ts
- apps/admin/src/app/barbers/barber-matrix-data.test.ts
- apps/admin/src/app/barbers/use-barber-matrix.ts
- apps/admin/src/app/barbers/BarberServiceMatrixEditor.tsx
- apps/admin/src/app/barbers/MatrixPanels.tsx
- apps/admin/src/app/barbers/MatrixStatus.tsx
- apps/admin/src/app/barbers/MatrixModePicker.tsx
- apps/admin/src/app/barbers/MatrixCategoryPicker.tsx
- apps/admin/src/app/barbers/MatrixServiceList.tsx
- apps/admin/src/app/barbers/BarberServiceMatrixEditor.test.tsx
- apps/admin/src/app/barbers/BarberServiceMatrixEditor.category.test.tsx

Checks:
- pnpm --filter @fade/admin exec jest --runTestsByPath $PWD/apps/admin/src/app/barbers/barber-matrix-data.test.ts $PWD/apps/admin/src/app/barbers/BarberServiceMatrixEditor.test.tsx $PWD/apps/admin/src/app/barbers/BarberServiceMatrixEditor.category.test.tsx

## QA

- `pnpm --filter @fade/admin exec jest --runTestsByPath $PWD/apps/admin/src/app/barbers/barber-matrix-data.test.ts $PWD/apps/admin/src/app/barbers/BarberServiceMatrixEditor.test.tsx $PWD/apps/admin/src/app/barbers/BarberServiceMatrixEditor.category.test.tsx` exit 0



## Implementation notes

- apps/admin/src/app/barbers/BarberServiceMatrixEditor.category.test.tsx
- apps/admin/src/app/barbers/BarberServiceMatrixEditor.tsx
- apps/admin/src/app/barbers/MatrixCategoryPicker.tsx
- apps/admin/src/app/barbers/MatrixModePicker.tsx
- apps/admin/src/app/barbers/MatrixPanels.tsx
- apps/admin/src/app/barbers/MatrixServiceList.tsx
- apps/admin/src/app/barbers/MatrixStatus.tsx
- apps/admin/src/app/barbers/barber-matrix-categories.ts
- apps/admin/src/app/barbers/barber-matrix-data.ts
- apps/admin/src/app/barbers/use-barber-matrix.ts
