import { Pressable, Text, View } from 'react-native';
import { MobileButton, MobileEmptyState } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import type { ServiceDto } from './booking-model';

export default function ServicesStep({
  services,
  selected,
  onToggle,
  onNext,
}: {
  services: ServiceDto[];
  selected: string[];
  onToggle: (id: string) => void;
  onNext: () => void;
}) {
  if (services.length === 0) {
    return <MobileEmptyState message="Послуг не знайдено" />;
  }
  return (
    <View style={wipStyles.content}>
      <Text style={wipStyles.title}>Оберіть послуги</Text>
      {services.map((service) => (
        <Pressable
          key={service.id}
          accessibilityRole="button"
          onPress={() => onToggle(service.id)}
          style={[wipStyles.row, selected.includes(service.id) && wipStyles.rowSelected]}
        >
          <View style={wipStyles.rowBody}>
            <Text style={wipStyles.cardTitle}>{service.name}</Text>
            <Text style={wipStyles.muted}>
              {service.durationMinutes} хв · {service.price} ₴
            </Text>
          </View>
        </Pressable>
      ))}
      <MobileButton title="Далі" onPress={onNext} disabled={selected.length === 0} />
    </View>
  );
}
