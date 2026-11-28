'use client';

// Матриця «послуги барбера» (T-4521b): чекбокси послуг обраної локації.
// Порожня матриця = барбер робить усі послуги (дефолт «всі»), перше зняття
// чекбокса переводить локацію в режим «лише обрані».
import { categoriesOf } from './barber-matrix-data';
import { MatrixPanels } from './MatrixPanels';
import { useBarberMatrix } from './use-barber-matrix';

type Location = { id: string; name: string };

export default function BarberServiceMatrixEditor({
  barberId,
  locations,
}: {
  barberId: string;
  locations: Location[];
}) {
  const matrix = useBarberMatrix(barberId);
  const groups = categoriesOf(matrix.services);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-h4">Послуги барбера</h3>
      <p className="text-body text-fg-muted">
        Які послуги виконує барбер на локації: порожній список = усі послуги.
      </p>
      <label className="text-body">
        Локація
        <select
          aria-label={`Локація матриці барбера ${barberId}`}
          value={matrix.locationId}
          onChange={(event) => matrix.setLocationId(event.target.value)}
          className="ml-2 rounded-input border-line bg-surface-base p-2"
        >
          <option value="">Оберіть локацію</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </label>
      <MatrixPanels barberId={barberId} matrix={matrix} groups={groups} />
    </div>
  );
}
