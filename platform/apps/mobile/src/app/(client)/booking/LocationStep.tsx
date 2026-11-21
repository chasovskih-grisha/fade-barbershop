import { Pressable, Text, View } from 'react-native';
import { MobileEmptyState } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import type { LocationDto } from './booking-model';

export default function LocationStep({
  locations,
  selected,
  onSelect,
}: {
  locations: LocationDto[];
  selected: LocationDto | null;
  onSelect: (location: LocationDto) => void;
}) {
  if (locations.length === 0) {
    return <MobileEmptyState message="Локацій не знайдено" />;
  }
  return (
    <View style={wipStyles.content}>
      <Text style={wipStyles.title}>Виберіть студію</Text>
      {locations.map((location) => (
        <Pressable
          key={location.id}
          accessibilityRole="button"
          onPress={() => onSelect(location)}
          style={[wipStyles.row, selected?.id === location.id && wipStyles.rowSelected]}
        >
          <View style={wipStyles.rowBody}>
            <Text style={wipStyles.cardTitle}>{location.name}</Text>
            <Text style={wipStyles.muted}>{location.address}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
