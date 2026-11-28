import { Pressable, Text, View } from 'react-native';
import { EMPTY_CHOICE_LABEL, UNAVAILABLE_CHOICE_LABEL, type ChairOption } from './usual-chair';
import { styles } from './usual-chair-styles';

/** Чип вибору. Один контрол на пункт — і для «Не обрано», і для довідника. */
export function Chip({
  label,
  testID,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  testID: string;
  selected: boolean;
  disabled?: boolean | undefined;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={[styles.chip, selected && styles.chipSelected, disabled && styles.chipDisabled]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

/**
 * Рядок вибору: «Не обрано» + пункти довідника (T-4725c). Зниклий id не стає
 * чипом — він показується окремим рядком «Більше не доступно» під рядом.
 */
export function ChoiceRow({
  groupLabel,
  prefix,
  options,
  selectedId,
  noneDisabled,
  unavailable,
  onPick,
}: {
  groupLabel: string;
  prefix: string;
  options: ChairOption[];
  selectedId: string | null;
  noneDisabled?: boolean | undefined;
  unavailable: boolean;
  onPick: (id: string | null) => void;
}) {
  return (
    <>
      <Text style={styles.groupLabel}>{groupLabel}</Text>
      <View style={styles.chipRow}>
        <Chip
          label={EMPTY_CHOICE_LABEL}
          testID={`${prefix}-none`}
          selected={selectedId === null}
          disabled={noneDisabled}
          onPress={() => onPick(null)}
        />
        {options.map((option) => (
          <Chip
            key={option.id}
            label={option.name}
            testID={`${prefix}-${option.id}`}
            selected={selectedId === option.id}
            onPress={() => onPick(option.id)}
          />
        ))}
      </View>
      {unavailable ? (
        <Text testID={`${prefix}-unavailable`} style={styles.unavailableText}>
          {UNAVAILABLE_CHOICE_LABEL}
        </Text>
      ) : null}
    </>
  );
}
