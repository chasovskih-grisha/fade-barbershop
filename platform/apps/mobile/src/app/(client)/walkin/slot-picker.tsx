import { Pressable, Text } from 'react-native';
import { MobileCard } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import { slotLabel } from './walkin-model';
import type { SlotOption } from './walkin-model';

export default function SlotPicker({
  slots,
  selected,
  onSelect,
}: {
  slots: SlotOption[];
  selected: SlotOption | null;
  onSelect: (slot: SlotOption) => void;
}) {
  return (
    <MobileCard>
      <Text style={wipStyles.cardTitle}>Оберіть час</Text>
      {slots.map((slot) => (
        <Pressable
          key={slot.start.toISOString()}
          accessibilityRole="button"
          onPress={() => onSelect(slot)}
          style={[
            wipStyles.row,
            selected?.start.getTime() === slot.start.getTime() && wipStyles.rowSelected,
          ]}
        >
          <Text style={wipStyles.subtitle}>{slotLabel(slot)}</Text>
        </Pressable>
      ))}
    </MobileCard>
  );
}
