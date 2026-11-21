import { Pressable, Text, View } from 'react-native';
import { MobileButton } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import type { BookingSlot } from './booking-model';

function time(value: Date): string {
  return value.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

export default function SlotsStep({
  slots,
  selected,
  onSelect,
  onNext,
}: {
  slots: BookingSlot[];
  selected: BookingSlot | null;
  onSelect: (slot: BookingSlot) => void;
  onNext: () => void;
}) {
  return (
    <View style={wipStyles.content}>
      <Text style={wipStyles.title}>Оберіть час</Text>
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
          <Text style={wipStyles.cardTitle}>
            {time(slot.start)} — {time(slot.end)}
          </Text>
        </Pressable>
      ))}
      <MobileButton title="Підтвердити" onPress={onNext} disabled={!selected} />
    </View>
  );
}
