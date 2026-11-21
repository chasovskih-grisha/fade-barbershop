import { Text, View } from 'react-native';
import { MobileButton } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import { serviceNames } from './booking-model';
import type { BarberDto, BookingSlot, LocationDto, ServiceDto } from './booking-model';

export default function ConfirmStep({
  location,
  barber,
  slot,
  services,
  serviceIds,
  onSubmit,
  onCancel,
}: {
  location: LocationDto;
  barber: BarberDto;
  slot: BookingSlot;
  services: ServiceDto[];
  serviceIds: string[];
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const details = [
    `Студія: ${location.name}`,
    `Барбер: ${barber.name}`,
    `Послуги: ${serviceNames(services, serviceIds)}`,
    `Час: ${slot.start.toLocaleString('uk-UA')}`,
  ];
  return (
    <View style={wipStyles.content}>
      <Text style={wipStyles.title}>Підтвердження запису</Text>
      {details.map((line) => (
        <Text key={line} style={wipStyles.subtitle}>
          {line}
        </Text>
      ))}
      <MobileButton title="Завершити запис" onPress={onSubmit} />
      <MobileButton title="Назад" onPress={onCancel} />
    </View>
  );
}
