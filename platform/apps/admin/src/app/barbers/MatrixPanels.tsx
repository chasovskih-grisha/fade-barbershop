'use client';

// Панелі матриці (T-4521b): помилка, порожній каталог, режим, категорії та
// список послуг. Винесено з BarberServiceMatrixEditor за гейтом складності.
import { MatrixCategoryPicker } from './MatrixCategoryPicker';
import { MatrixModePicker } from './MatrixModePicker';
import { MatrixServiceList } from './MatrixServiceList';
import { MatrixStatus } from './MatrixStatus';
import { useBarberMatrix } from './use-barber-matrix';

type MatrixState = ReturnType<typeof useBarberMatrix>;

export function MatrixPanels({
  barberId,
  matrix,
  groups,
}: {
  barberId: string;
  matrix: MatrixState;
  groups: Array<{ name: string; serviceIds: string[] }>;
}) {
  const { locationId, services, loaded, busy, error, mode, categories } = matrix;
  const hasServices = Boolean(locationId) && loaded && services.length > 0;
  return (
    <>
      <MatrixStatus error={error} emptyCatalog={Boolean(locationId) && loaded && !services.length} />
      {hasServices && (
        <MatrixModePicker barberId={barberId} mode={mode} onPick={matrix.onPickMode} />
      )}
      {mode === 'category' && hasServices && (
        <MatrixCategoryPicker
          groups={groups}
          categories={categories}
          busy={busy}
          onToggle={matrix.onToggleCategory}
        />
      )}
      {hasServices && (
        <MatrixServiceList
          services={services}
          isChecked={matrix.isChecked}
          busy={busy}
          onToggle={matrix.onToggle}
        />
      )}
    </>
  );
}
