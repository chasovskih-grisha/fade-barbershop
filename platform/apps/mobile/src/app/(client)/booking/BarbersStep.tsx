import { Pressable, Text, View } from 'react-native';
import { MobileButton, MobileEmptyState } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import type { BarberDto } from './booking-model';

export default function BarbersStep({
  barbers,
  selected,
  onSelect,
  onNext,
}: {
  barbers: BarberDto[];
  selected: BarberDto | null;
  onSelect: (barber: BarberDto) => void;
  onNext: () => void;
}) {
  if (barbers.length === 0) {
    return <MobileEmptyState message="Барберів не знайдено" />;
  }
  return (
    <View style={wipStyles.content}>
      <Text style={wipStyles.title}>Виберіть барбера</Text>
      {barbers.map((barber) => (
        <Pressable
          key={barber.id}
          accessibilityRole="button"
          onPress={() => onSelect(barber)}
          style={[wipStyles.row, selected?.id === barber.id && wipStyles.rowSelected]}
        >
          <View style={wipStyles.rowBody}>
            <Text style={wipStyles.cardTitle}>{barber.name}</Text>
            <Text style={wipStyles.muted}>{barber.specialties?.join(', ') || 'MADE BY FADE'}</Text>
          </View>
        </Pressable>
      ))}
      <MobileButton title="Далі" onPress={onNext} disabled={!selected} />
    </View>
  );
}
