'use client';

import { Card, Button } from '@fade/ui';
import { useUsualChair } from './use-usual-chair';
import { UsualChairChoiceField } from './UsualChairChoiceField';

/**
 * Звична локація і барбер у профілі (T-4725b). Порожній пункт «Не обрано» —
 * справжній вибір; id, якого вже немає в довіднику, показується як «Більше не
 * доступно» і очищається однією кнопкою. Збереження не чіпає жодного візиту.
 */
export function AccountUsualChairCard({ token }: { token: string | null }) {
  const chair = useUsualChair(token);
  const busy = chair.status === 'saving' || chair.status === 'loading';

  return (
    <Card className="flex flex-col gap-4 p-6">
      <h2 className="font-display text-display">Звична локація і барбер</h2>
      <p className="text-body-s text-fg-muted">
        Підставимо їх у запис, коли ви заходите в кабінет. Це вподобання — записані візити не
        змінюються.
      </p>

      <UsualChairChoiceField
        id="usual-location"
        label="Звична локація"
        options={chair.options.locations}
        value={chair.draft.locationId}
        unavailable={chair.locationGone}
        onChange={(next) => void chair.pickLocation(next)}
      />
      <UsualChairChoiceField
        id="usual-barber"
        label="Звичний барбер"
        options={chair.options.barbers}
        value={chair.draft.barberId}
        unavailable={chair.barberGone}
        disabled={chair.draft.locationId === null}
        onChange={(next) => chair.setDraft((current) => ({ ...current, barberId: next }))}
      />

      {chair.status === 'error' && (
        <p role="alert" className="text-body-s text-danger">
          Не вдалося зберегти
        </p>
      )}
      <div className="flex gap-2">
        <Button
          size="md"
          onClick={() => void chair.persist()}
          disabled={!chair.dirty || busy}
          className="w-fit"
        >
          Зберегти звичне місце
        </Button>
        {(chair.locationGone || chair.barberGone) && (
          <Button size="md" variant="secondary" onClick={chair.clear} className="w-fit">
            Очистити
          </Button>
        )}
      </div>
    </Card>
  );
}
