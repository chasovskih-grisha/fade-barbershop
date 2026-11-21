import { useEffect, useState } from 'react';
import { ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { wipStyles } from '../../wip-styles';
import { fetchServices, type ServiceDto } from '../../../lib/api/catalog';
import WalkInBody from './walkin-body';
import { phoneValid, walkInSlots } from './walkin-model';
import type { SlotOption } from './walkin-model';

export default function WalkInScreen() {
  const params = useLocalSearchParams<{
    barberId?: string | string[];
    locationId?: string | string[];
  }>();
  const router = useRouter();
  const barberId = Array.isArray(params.barberId)
    ? (params.barberId[0] ?? '')
    : (params.barberId ?? '');
  const locationId = Array.isArray(params.locationId)
    ? (params.locationId[0] ?? '')
    : (params.locationId ?? '');
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [service, setService] = useState<ServiceDto | null>(null);
  const [slot, setSlot] = useState<SlotOption | null>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchServices()
      .then((list) => {
        if (mounted) setServices(list);
      })
      .catch(() => {
        if (mounted) setError('Не вдалося завантажити послуги');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const selectService = (next: ServiceDto) => {
    setService(next);
    setSlot(walkInSlots(next.durationMinutes)[0] ?? null);
  };

  const submit = () => {
    if (!service || !slot) {
      setError('Будь ласка, оберіть послугу та час');
      return;
    }
    if (!phoneValid(phone)) {
      setError('Введіть номер телефону клієнта');
      return;
    }
    setError(null);
    router.push({
      pathname: '/barber/payment-walkin',
      params: {
        barberId,
        locationId,
        serviceId: service.id,
        amount: String(service.price),
        clientPhone: phone,
      },
    });
  };

  return (
    <SafeAreaView style={wipStyles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={wipStyles.content} style={wipStyles.scroll}>
        <WalkInBody
          barberId={barberId}
          locationId={locationId}
          services={services}
          service={service}
          slot={slot}
          phone={phone}
          loading={loading}
          error={error}
          onService={selectService}
          onSlot={setSlot}
          onPhone={setPhone}
          onSubmit={submit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
