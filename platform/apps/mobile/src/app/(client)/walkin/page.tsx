import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable, ActivityIndicator, FlatList, RefreshControl, Modal, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, OpenSans } from '@expo-google-fonts/open-sans';
import { useTon } from '../../../../lib/use-ton';
import { useOnlineStatus } from '../../../../lib/use-online-status';
import { usePush } from '../../../../lib/notifications';
import { fetchBarberSchedule, fetchLocations } from '../../../../lib/api';
import { styles } from '../../../../index.styles';

export default function WalkInScreen({ route }: { route: { params: { barberId: string; locationId: string } } }) {
  const router = useRouter();
  const { loaded } = useFonts({ OpenSans });
  const [online, setOnline] = useOnlineStatus();
  const { token, permission, allowed, register, revoke, error } = usePush();
  const { canViewLoyalty, loyaltyPoints } = useTon();

  const [barberId, setBarberId] = useState(route.params.barberId);
  const [locationId, setLocationId] = useState(route.params.locationId);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [clientPhone, setClientPhone] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);

  // Load barber schedule and available slots
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const schedule = await fetchBarberSchedule(barberId, new Date());
        setAvailableSlots(schedule);
        setLoading(false);
      } catch (e) {
        console.error('Error loading schedule:', e);
        setError('Помилка завантаження графіка');
        setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [barberId]);

  // Filter slots that are available (no existing booking overlap)
  const getAvailableSlots = () => {
    if (!availableSlots.length) return [];
    // Slots without existing bookings
    return availableSlots.filter((slot: any) => slot.status !== 'booked' && slot.status !== 'confirmed');
  };

  const pullToRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      loadData();
    }, 1000);
  };

  // Handle service selection
  const handleServiceSelect = (service: any) => {
    setServiceId(service.id);
    // Auto-select first available slot
    const available = getAvailableSlots();
    if (available.length > 0) {
      setSelectedSlot({
        start: new Date(available[0].start),
        end: new Date(available[0].end),
      });
    }
  };

  // Create walk-in booking
  const createWalkInBooking = async () => {
    if (!serviceId || !selectedSlot) {
      Alert.alert('Помилка', 'Будь ласка, оберіть послугу і час');
      return;
    }

    if (clientPhone.length < 9) {
      Alert.alert('Помилка', 'Будь ласка, введіть номер телефону клієнта');
      return;
    }

    setLoading(true);
    try {
      // Create booking in 'booked' status with active Start
      const bookingData = {
        barberId,
        locationId,
        serviceId,
        start: selectedSlot.start,
        end: selectedSlot.end,
        source: 'walk_in' as const,
        origin: { clientId: null, source: 'walk_in' },
        status: 'booked',
        agreedDuration: Math.round((selectedSlot.end.getTime() - selectedSlot.start.getTime()) / 60000),
        agreedPrice: service.price ?? 0,
        appliedDiscounts: [],
        depositStatus: null,
        depositAmount: 0,
        depositPolicy: { depositPercent: 0, minDeposit: 0, maxDeposit: null, rounding: 'tens' },
      };

      // TODO: Call API to create booking
      // const createdBooking = await fetchCreateBooking(bookingData);

      // Navigate to confirmation or payment
      router.push('/barber/payment-walkin', {
        bookingId: 'temp-' + Date.now(),
        serviceId,
        amount: service.price ?? 0,
        clientPhone,
      });
    } catch (e) {
      console.error('Error creating walk-in booking:', e);
      setError('Помилка створення запису');
    } finally {
      setLoading(false);
    }
  };

  if (!online) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Офлайн режим</Text>
        <Text>Показаны сохраненные данные. Подключитесь к сети для обновления.</Text>
        <ActivityIndicator size="large" />
      </V>
    );
  }

  if (!loaded) {
    return null; // fonts still loading
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </V>
    );
  }

  const availableSlots = getAvailableSlots();

  return (
    <SafeAreaView style={{ backgroundColor: '#0f0f11' }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={pullToRefresh}
            tintColor="#4F46E5"
            titleColor="#4F46E5"
          />
        }
        style={{ flexGrow: 1 }}
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>
            БУДЬ-ЛАСКА ВІЗИТ
          </Text>
          <Text style={{ color: '#888', fontSize: 14 }}>
            Барбер ID: {barberId} • Локація ID: {locationId}
          </Text>
        </View>

        {/* Service Selection */}
        {serviceId ? (
          <View style={{ backgroundColor: '#18181b', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 }}>
              Обрана послуга
            </Text>
            <Text style={{ color: '#888', fontSize: 14 }}>{serviceId}</Text>
          </V>
        ) : (
          <View style={{ backgroundColor: '#18181b', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 }}>
              Оберіть послугу
            </Text>
            <FlatList
              data={availableSlots.map((s: any) => ({
                id: s.id,
                name: `${s.serviceName} — ${(s.start.getHours() % 12 || 12)}:${s.start.getMinutes()
                  .toString()
                  .padStart(2, '0')} - ${(s.end.getHours() % 12 || 12)}:${s.end.getMinutes()
                  .toString()
                  .padStart(2, '0')}`,
                price: s.price ?? 0,
              }))}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={{ padding: 12, marginBottom: 8, backgroundColor: '#3f3f4f', borderRadius: 8 }}
                  onPress={() => handleServiceSelect(item)}
                >
                  <Text style={{ color: '#10b981', fontSize: 14 }}>{item.name}</Text>
                  <Text style={{ color: '#fff', fontSize: 12 }}>₴{item.price}</Text>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
          </V>
        )}

        {/* Slot Selection */}
        {serviceId && selectedSlot && (
          <View style={{ backgroundColor: '#18181b', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 }}>
              Обраний час
            </Text>
            <Text style={{ color: '#10b981', fontSize: 14 }}>
              {selectedSlot.start.toLocaleTimeString('uk-UA', {
                hour: '2-digit',
                minute: '2-digit',
              })} - {selectedSlot.end.toLocaleTimeString('uk-UA', {
                hour: '2-digit',
                minute: '2-digit',
              })}</Text>
          </V>
        )}

        {/* Client Phone Form */}
        {!serviceId || selectedSlot ? null : (
          <View style={{ backgroundColor: '#18181b', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 }}>
              Телефон клієнта
            </Text>
            <TextInput
              placeholder="+380..."
              value={clientPhone}
              onChangeText=(text: string) => setClientPhone(text)
              keyboardType="phone-pad"
              style={styles.phoneInput}
              maxLength={15}
            />
          </V>
        )}

        {/* Quick Submit Button */}
        {serviceId && selectedSlot && clientPhone.length >= 9 && (
          <Pressable
            style={styles.submitButton}
            onPress={createWalkInBooking}
            disabled={loading}
          >
            <Text style={{ color: '#0f0f11', fontSize: 18, fontWeight: 'bold' }}>
              {loading ? 'Оформлюємо...' : 'Створити візит'}
            </Text>
          </Pressable>
        )}

        {/* Pull-to-refresh indicator */}
        {refreshing && (
          <View style={{ marginTop: 16, alignSelf: 'center', padding: 12, backgroundColor: '#3f3f4f', borderRadius: 8 }}>
            <ActivityIndicator size="small" />
            <Text style={{ color: '#fff', marginLeft: 8, fontSize: 12 }}>Оновлюємо...</Text>
          </V>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Input styles
const styles = StyleSheet.create({
  phoneInput: {
    height: 50,
    backgroundColor: '#3f3f4f',
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  submitButton: {
    height: 56,
    backgroundColor: '#10b981',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
});