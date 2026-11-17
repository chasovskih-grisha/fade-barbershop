import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable, ActivityIndicator, Alert, Image, PermissionsAndroid, Camera, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchLocations, fetchBarbers, fetchServices } from '../../../lib/api';
import { useTon } from '../../../lib/use-ton';
import { useOnlineStatus } from '../../../lib/use-online-status';

export default function BookingScreen() {
  const router = useRouter();
  const { params } = router;
  const { locationCode } = params ?? {};

  const [online, setOnline] = useOnlineStatus();
  const [step, setStep] = useState<'location' | 'services' | 'barbers' | 'slots' | 'confirm' | 'done'>('location');
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationDto | null>(null);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [barbers, setBarbers] = useState<BarberDto[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<BarberDto | null>(null);
  const [slots, setSlots] = useState<TimeSlotData[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch data based on step
  useEffect(() => {
    let mounted = true;
    
    async function loadData() {
      if (step === 'location') {
        if (!mounted) return;
        fetchLocations()
          .then((locs) => {
            if (mounted) setLocations(locs);
          })
          .catch(() => {
            if (mounted) setError(true);
          });
      } else if (step === 'services' && selectedLocation) {
        if (!mounted) return;
        fetchServices(selectedLocation.code)
          .then((svcs) => {
            if (mounted) setServices(svcs);
          })
          .catch(() => {
            if (mounted) setError(true);
          });
      } else if (step === 'barbers' && selectedServices.length > 0) {
        if (!mounted) return;
        // Fetch barbers available for selected services
        const serviceIds = selectedServices.join(',');
        fetchBarbers(selectedLocation?.code || '', serviceIds)
          .then((barbs) => {
            if (mounted) setBarters(barbs);
          })
          .catch(() => {
            if (mounted) setError(true);
          });
      }
    }
    
    loadData();
    return () => { mounted = false; };
  }, [step, selectedLocation, selectedServices]);

  const handleNext = async () => {
    setLoading(true);
    
    switch (step) {
      case 'location':
        if (!selectedLocation) {
          setLoading(false);
          return;
        }
        setStep('services');
        break;
      case 'services':
        if (selectedServices.length === 0) {
          setLoading(false);
          return;
        }
        setStep('barbers');
        break;
      case 'barbers':
        if (!selectedBarber) {
          setLoading(false);
          return;
        }
        // Calculate slots based on selected services and barber
        // This is a simplified calculation - real implementation would use the use case
        const duration = selectedServices.reduce((sum, sId) => {
          const svc = services.find(s => s.id === sId);
          return sum + (svc?.durationMinutes || 0);
        }, 0);
        const slotDuration = 60; // default 1 hour
        const now = new Date();
        const start = new Date(now.getTime() + 30 * 60000); // 30 min from now
        const end = new Date(start.getTime() + duration * 60000);
        const slots: TimeSlotData[] = [];
        for (let i = 0; i < 4; i++) {
          const slotStart = new Date(start.getTime() + i * slotDuration * 60000);
          slots.push({
            start: slotStart,
            end: new Date(slotStart.getTime() + slotDuration * 60000),
          });
        }
        setSlots(slots);
        setStep('slots');
        break;
      case 'slots':
        if (!selectedSlot) {
          setLoading(false);
          return;
        }
        setStep('confirm');
        break;
      case 'confirm':
        // Submit booking
        setStep('done');
        break;
    }
    
    setLoading(false);
  };

  const handleBack = () => {
    setLoading(true);
    
    switch (step) {
      case 'services':
        setStep('location');
        break;
      case 'barbers':
        setStep('services');
        break;
      case 'slots':
        setStep('barbers');
        break;
      case 'confirm':
        setStep('slots');
        break;
      case 'done':
        router.back();
        break;
    }
    
    setLoading(false);
  };

  // Offline handling
  if (!online) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Офлайн режим</Text>
        <Text>Показаны сохраненные данные. Подключитесь к сети для обновления.</Text>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (loading) {
    return (
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <ActivityIndicator size="large" />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      style={{ flexGrow: 1 }}
    >
      {step === 'location' && (
        <View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Виберіть студію</Text>
          {locations.map((loc) => (
            <Pressable
              key={loc.code}
              style={{ marginBottom: 12, padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8 }}
              onPress={() => {
                setSelectedLocation(loc);
                setStep('services');
              }}
            >
              <Text>{loc.name}</Text>
              <Text style={{ color: '#666' }}>{loc.address}</Text>
            </Pressable>
          ))}
          {locations.length === 0 && <Text>Локацій не знайдено</Text>}
        </View>
      )}

      {step === 'services' && selectedLocation && (
        <View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Оберіть послуги</Text>
          {services.map((srv) => (
            <Pressable
              key={srv.id}
              style={{ marginBottom: 12, padding: 16, backgroundColor: '#e8e8e8', borderRadius: 8 }}
              onPress={() => {
                const isSelected = selectedServices.includes(srv.id);
                if (isSelected) {
                  setSelectedServices(selectedServices.filter(id => id !== srv.id));
                } else {
                  setSelectedServices([...selectedServices, srv.id]);
                }
              }}
            >
              <Text>{srv.name}</Text>
              <Text style={{ color: '#666' }}>{srv.durationMinutes} хв, {srv.price} ₴</Text>
            </Pressable>
          ))}
          {selectedServices.length > 0 && (
            <Pressable
              style={{ marginTop: 20, padding: 16, backgroundColor: '#4F46E5', borderRadius: 8 }}
              onPress={() => setStep('barbers')}
            >
              <Text style={{ color: 'white' }}>Далі →</Text>
            </Pressable>
          )}
          {selectedServices.length === 0 && <Text>Будь ласка, виберіть хоч одну послугу</Text>}
        </View>
      )}

      {step === 'barbers' && selectedServices.length > 0 && selectedLocation && (
        <View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Виберіть барбера</Text>
          {barbers.map((barber) => (
            <Pressable
              key={barber.id}
              style={{ marginBottom: 12, padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8 }}
              onPress={() => setSelectedBarber(barber)}
            >
              <Text>{barber.name}</Text>
              <Text style={{ color: '#666' }}>{barber.specialization}</Text>
            </Pressable>
          ))}
          {barbers.length === 0 && <Text>Барберів не знайдено</Text>}
          {selectedBarber && (
            <Pressable
              style={{ marginTop: 20, padding: 16, backgroundColor: '#4F46E5', borderRadius: 8 }}
              onPress={() => setStep('slots')}
            >
              <Text style={{ color: 'white' }}>Далі →</Text>
            </Pressable>
          )}
        </View>
      )}

      {step === 'slots' && selectedBarber && selectedServices.length > 0 && selectedLocation && (
        <View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Оберіть час</Text>
          {slots.map((slot, i) => (
            <Pressable
              key={i}
              style={{ marginBottom: 12, padding: 16, backgroundColor: '#e8e8e8', borderRadius: 8 }}
              onPress={() => setSelectedSlot(slot)}
            >
              <Text>{slot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {slot.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </Pressable>
          ))}
          {selectedSlot && (
            <Pressable
              style={{ marginTop: 20, padding: 16, backgroundColor: '#4F46E5', borderRadius: 8 }}
              onPress={() => setStep('confirm')}
            >
              <Text style={{ color: 'white' }}>Підтвердити →</Text>
            </Pressable>
          )}
        </View>
      )}

      {step === 'confirm' && selectedSlot && selectedBarber && selectedServices.length > 0 && selectedLocation && (
        <View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Підтвердження запису</Text>
          <View style={{ marginBottom: 20 }}>
            <Text>Студія: {selectedLocation.name}</Text>
            <Text>Барбер: {selectedBarber.name}</Text>
            <Text>Послуги: {selectedServices.map(id => services.find(s => s.id === id)?.name).join(', ')}</Text>
            <Text>Час: {selectedSlot.start.toLocaleTimeString()} - {selectedSlot.end.toLocaleTimeString()}</Text>
          </View>
          <Pressable
            style={{ width: '100%', padding: 16, backgroundColor: '#10B981', borderRadius: 8, marginTop: 20 }}
            onPress={() => {
              // TODO: Actually submit the booking
              setStep('done');
            }}
          >
            <Text style={{ color: 'white' }}>Зап�нити запис</Text>
          </Pressable>
          <Pressable
            style={{ width: '100%', padding: 16, backgroundColor: '#6B7280', borderRadius: 8, marginTop: 12 }}
            onPress={() => handleBack()}
          >
            <Text style={{ color: 'white' }}>Відміна</Text>
          </Pressable>
        </View>
      )}

      {step === 'done' && (
        <View style={{ padding: 20, textAlign: 'center' }}>
          <Text style={{ fontSize: 28, marginBottom: 20 }}>Будь ласка, перевірте свійemail</Text>
          <ActivityIndicator size="large" />
        </View>
      )}
    </ScrollView>
  );
}