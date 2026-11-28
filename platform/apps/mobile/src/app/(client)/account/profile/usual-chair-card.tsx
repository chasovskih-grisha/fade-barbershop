import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { updateProfileUsualChair, type UsualChair } from '@/lib/api/identity';
import {
  EMPTY_CHOICE,
  isUnavailable,
  normalizeChoice,
  sameChoice,
  type UsualChairChoice,
} from './usual-chair';
import { ChoiceRow } from './usual-chair-chips';
import { UsualChairActions } from './usual-chair-actions';
import { useUsualChairCatalog } from './use-usual-chair-catalog';
import { styles } from './usual-chair-styles';

/**
 * Звична локація і барбер у застосунку (T-4725c). Той самий PATCH, що й на
 * сайті: вибір, збережений на сайті, видно тут. Порожній вибір лишається
 * порожнім — перша локація не підставляється.
 */
export function UsualChairCard({ initial }: { initial: UsualChair | null }) {
  const [saved, setSaved] = useState<UsualChairChoice>(normalizeChoice(initial));
  const [draft, setDraft] = useState<UsualChairChoice>(normalizeChoice(initial));
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle');
  const { locations, barbers, loading, clearBarbers } = useUsualChairCatalog(draft.locationId);

  const save = useCallback(async () => {
    setState('saving');
    try {
      const next = normalizeChoice(await updateProfileUsualChair(draft));
      setSaved(next);
      setDraft(next);
      setState('idle');
    } catch {
      setState('error');
    }
  }, [draft]);

  const locationGone = isUnavailable(locations, saved.locationId);
  const barberGone = isUnavailable(barbers, saved.barberId);

  return (
    <View style={styles.card} testID="profile-usual-chair-card">
      <Text style={styles.label}>Звична локація і барбер</Text>
      <Text style={styles.hint}>Підставимо їх у запис. Записані візити не змінюються.</Text>

      <ChoiceRow
        groupLabel="Звична локація"
        prefix="usual-location"
        options={locations}
        selectedId={draft.locationId}
        unavailable={locationGone}
        // Барбер іншої студії не переїжджає разом з локацією.
        onPick={(next) => setDraft({ locationId: next, barberId: null })}
      />
      <ChoiceRow
        groupLabel="Звичний барбер"
        prefix="usual-barber"
        options={barbers}
        selectedId={draft.barberId}
        noneDisabled={draft.locationId === null}
        unavailable={barberGone}
        onPick={(next) => setDraft((current) => ({ ...current, barberId: next }))}
      />

      <UsualChairActions
        dirty={!sameChoice(draft, saved)}
        busy={state === 'saving' || loading}
        error={state === 'error'}
        canClear={locationGone || barberGone}
        onSave={() => void save()}
        onClear={() => {
          setDraft(EMPTY_CHOICE);
          clearBarbers();
        }}
      />
    </View>
  );
}
