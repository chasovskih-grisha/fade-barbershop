import { Pressable, Text, View } from 'react-native';
import { MobileCard, MobileEmptyState } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import { priceLabel } from './walkin-model';
import type { ServiceDto } from '../../../lib/api/catalog';

export default function ServicePicker({
  services,
  selected,
  onSelect,
}: {
  services: ServiceDto[];
  selected: ServiceDto | null;
  onSelect: (service: ServiceDto) => void;
}) {
  if (services.length === 0) {
    return <MobileEmptyState message="Послуг не знайдено" />;
  }
  return (
    <MobileCard>
      <Text style={wipStyles.cardTitle}>Оберіть послугу</Text>
      {services.map((service) => (
        <Pressable
          key={service.id}
          accessibilityRole="button"
          onPress={() => onSelect(service)}
          style={[wipStyles.row, selected?.id === service.id && wipStyles.rowSelected]}
        >
          <View style={wipStyles.rowBody}>
            <Text style={wipStyles.subtitle}>{service.name}</Text>
            <Text style={wipStyles.muted}>{service.durationMinutes} хв</Text>
          </View>
          <Text style={wipStyles.cardTitle}>{priceLabel(service)}</Text>
        </Pressable>
      ))}
    </MobileCard>
  );
}
