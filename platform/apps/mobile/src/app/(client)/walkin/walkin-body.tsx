import { Text, TextInput, View } from 'react-native';
import { MobileButton, MobileCard, MobileSkeleton } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import type { ServiceDto } from '../../../lib/api/catalog';
import ServicePicker from './service-picker';
import SlotPicker from './slot-picker';
import { priceLabel, slotLabel, walkInSlots } from './walkin-model';
import type { SlotOption } from './walkin-model';

export default function WalkInBody({
  barberId,
  locationId,
  services,
  service,
  slot,
  phone,
  loading,
  error,
  onService,
  onSlot,
  onPhone,
  onSubmit,
}: {
  barberId: string;
  locationId: string;
  services: ServiceDto[];
  service: ServiceDto | null;
  slot: SlotOption | null;
  phone: string;
  loading: boolean;
  error: string | null;
  onService: (service: ServiceDto) => void;
  onSlot: (slot: SlotOption) => void;
  onPhone: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <Text style={wipStyles.title}>БУДЬ-ЛАСКА ВІЗИТ</Text>
      <Text style={wipStyles.subtitle}>
        Барбер: {barberId || '—'} · Локація: {locationId || '—'}
      </Text>
      {loading ? <MobileSkeleton /> : null}
      {!loading ? (
        <ServicePicker services={services} selected={service} onSelect={onService} />
      ) : null}
      {service ? (
        <SlotPicker
          slots={walkInSlots(service.durationMinutes)}
          selected={slot}
          onSelect={onSlot}
        />
      ) : null}
      {slot ? (
        <MobileCard>
          <Text style={wipStyles.cardTitle}>Обраний час: {slotLabel(slot)}</Text>
          <Text style={wipStyles.cardTitle}>{priceLabel(service)}</Text>
          <TextInput
            accessibilityLabel="Телефон клієнта"
            placeholder="+380..."
            value={phone}
            onChangeText={onPhone}
            keyboardType="phone-pad"
            maxLength={15}
            style={wipStyles.input}
          />
        </MobileCard>
      ) : null}
      {error ? (
        <View style={wipStyles.banner}>
          <Text style={wipStyles.bannerText}>{error}</Text>
        </View>
      ) : null}
      <MobileButton title="Створити візит" onPress={onSubmit} disabled={!service || !slot} />
    </>
  );
}
