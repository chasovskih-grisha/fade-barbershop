import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable, ActivityIndicator, RefreshControl, Modal, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, OpenSans, Inter } from '@expo-google-fonts/open-sans';
import { useTon } from '../../../../lib/use-ton';
import { useOnlineStatus } from '../../../../lib/use-online-status';
import { usePush } from '../../../../lib/notifications';
import { fetchLocations, fetchBarbers, fetchBarberSchedule, BarberDto } from '../../../../lib/api';
import { BarberCard } from '../../../../components/BarberCard';
import { styles } from '../../index.styles';
import { CABINET_STATUS } from '../../../../lib/booking-contract';

export default function BarberShellScreen({ route }: { route: { params: { barberId?: string } } }) {
  const router = useRouter();
  const { loaded, family } = useFonts({ OpenSans, Inter });
  const [online, setOnline] = useOnlineStatus();
  const { token, permission, allowed, register, revoke, error } = usePush();
  const { canViewLoyalty, loyaltyPoints } = useTon();

  const [barbers, setBarbers] = useState<BarberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedBarber, setSelectedBarber] = useState<BarberDto | null>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [chairOccupancy, setChairOccupancy] = useState<'0/2' | '1/2' | '2/2'>('0/2');

  // Load barbers
  useEffect(() => {
    let mounted = true;
    const loadBarbers = async () => {
      try {
        const locs = await fetchLocations();
        const activeLoc = locs.find((l) => l.active) || locs[0];
        if (!activeLoc || !mounted) return;
        const list = await fetchBarbers(activeLoc.id);
        if (mounted) setBarbers(list);
      } catch (e) {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadBarbers();
    return () => { mounted = false; };
  }, []);

  // Load schedule for selected barber and date
  useEffect(() => {
    if (selectedBarber) {
      loadSchedule(selectedBarber.id, selectedDate);
    }
  }, [selectedBarber, selectedDate]);

  const loadSchedule = async (barberId: string, date: Date) => {
    setLoading(true);
    try {
      const scheduleDate = new Date(date);
      scheduleDate.setDate(scheduleDate.getDate()); // just the day
      const schedule = await fetchBarberSchedule(barberId, scheduleDate);
      setSchedule(schedule);
      // Also load visits for this barber on this date
      const visits = await fetchVisitsForBarber(barberId, scheduleDate);
      setVisits(visits);
      // Update chair occupancy
      const occupied = visits.filter((v: any) => v.status === 'confirmed' || v.status === 'booked').length;
      setChairOccupancy(
        occupied >= 2 ? '2/2' : occupied >= 1 ? '1/2' : '0/2'
      );
    } catch (e) {
      console.error('Error loading schedule:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitsForBarber = async (barberId: string, date: Date) => {
    // Fetch visits for this barber on this date
    const visits = [];
    // TODO: Implement API call
    return visits;
  };

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
    if (selectedBarber) {
      loadSchedule(selectedBarber.id, date);
    }
  };

  const handleBarberPress = (barber: BarberDto) => {
    setSelectedBarber(barber);
    const date = new Date();
    loadSchedule(barber.id, date);
  };

  const pullToRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      if (selectedBarber) {
        loadSchedule(selectedBarber.id, selectedDate);
      }
    }, 1000);
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

  if (!loaded) {
    return null; // fonts still loading
  }

  if (loading) {
    return (
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <ActivityIndicator size="large" />
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: '#ef4444', fontSize: 16, marginBottom: 12 }}>Помилка завантаження</Text>
        <Pressable style={{ marginTop: 12 }} onPress={pullToRefresh}>
          <Text>Перезавантажити</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // Day column header
  const dayHeader = (date: Date) => {
    const days = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'Пятниця', 'Субота'];
    return <Text key={date.toISOString()} style={styles.dayHeader}>{days[date.getDay()]}</Text>;
  };

  // Time slot
  const timeSlot = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return <Text key={minutes} style={styles.timeSlot}>{h}:{m < 10 ? '0' : ''}{m} </Text>;
  };

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
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>КАБІНЕТ МАЙСТА</Text>
          <Text style={{ color: '#888', fontSize: 14 }}>{selectedBarber?.name || 'Оберіть барбера'} / {viewMode === 'day' ? 'День' : 'Тиждень'}</Text>
        </View>

        {/* View Mode Toggles */}
        <View style={{ marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Pressable
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: selectedBarber && viewMode === 'day' ? '#3f3f4f' : '#3f3f4f',
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={() => setViewMode('day')}
          >
            <Text style={{ color: viewMode === 'day' ? '#10b981' : '#fff', fontWeight: '600' }}>День</Text>
          </Pressable>
          <Pressable
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: !selectedBarber || viewMode === 'week' ? '#3f3f4f' : '#3f3f4f',
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={() => setViewMode('week')}
          >
            <Text style={{ color: viewMode === 'week' ? '#10b981' : '#fff', fontWeight: '600' }}>Тиждень</Text>
          </Pressable>
        </View>

        {/* Day Calendar */}
        {viewMode === 'day' && selectedBarber && schedule.length > 0 && (
          <View style={{ backgroundColor: '#18181b', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 }}>
              {selectedBarber.name} — {selectedDate.toLocaleDateString('uk-UA', { month: 'long', day: 'numeric' })}</Text>

            {/* Day timeline - 15 min intervals */}
            <View style={{ height: 400, backgroundColor: '#0f0f11', borderRadius: 8, overflow: 'hidden' }}>
              {/* Time grid header */}
              <View style={{ padding: 8, borderBottomWidth: 1, borderBottomColor: '#3f3f4f' }}>
                <View style={{ flex: 1 }} />
                {Array.from({ length: 96 }, (_, i) => i * 15).map((min) => timeSlot(min))}
              </View>

              {/* Slots */}
              <View style={{ flex: 1, padding: 8 }}>
                {schedule.map((slot: any) => {
                  const slotStartMin = slot.start.getHours() * 60 + slot.start.getMinutes();
                  const slotEndMin = slot.end.getHours() * 60 + slot.end.getMinutes();
                  const status = slot.status || 'available';

                  return (
                    <View
                      key={slot.id}
                      style={{
                        height: 20,
                        backgroundColor: status === 'booked' ? '#ef4444' : status === 'confirmed' ? '#f59e0b' : '#22c55e',
                        margin: 1,
                      }}
                    />
                  );
                })}
              </View>
            </View>

            {/* Visits list below calendar */}
            {visits.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>
                  {visits.length} візитів
                </Text>
                {visits.map((visit: any) => (
                  <View
                    key={visit.id}
                    style={{
                      padding: 8,
                      backgroundColor: '#3f3a3f',
                      borderRadius: 6,
                      marginBottom: 4,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontSize: 12 }}>{visit.serviceName}</Text>
                      <Text style={{ color: '#888', fontSize: 10 }}>
                        {visit.startTime} - {visit.endTime}</Text>
                    </View>
                    <Pressable
                      style={{ padding: 4, borderRadius: 4, backgroundColor: '#4F46E5' }}
                      onPress={() => router.push(`/(client)/barber/${selectedBarber.id}/visit/${visit.id}`)}
                    >
                      <Text style={{ color: 'white', fontSize: 10 }}>Деталі</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Week Calendar (simplified) */}
        {viewMode === 'week' && selectedBarber && (
          <View style={{ backgroundColor: '#18181b', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 }}>
              {selectedBarber.name} — Тиждень
            </Text>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#888', fontSize: 14 }}>
                Пн | Вт | Ср | Чт | Пт | Сб | Вс
              </View>
              <View style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <View
                    key={day}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      backgroundColor: '#3f3f4f',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: 2,
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12 }}>{day}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>
              Нажміть на день для перегляду графіка
            </Text>
          </View>
        )}

        {/* Barber List (if no barber selected or week mode) */}
        {!selectedBarber && viewMode === 'week' && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 }}>Майстри</Text>
            {barbers.map((b) => (
              <Pressable
                key={b.id}
                style={{
                  padding: 12,
                  backgroundColor: '#3f3f4f',
                  borderRadius: 8,
                  marginBottom: 8,
                  alignItems: 'center',
                }}
                onPress={() => handleBarberPress(b)}
              >
                <Text style={{ color: '#fff', fontSize: 16 }}>{b.name}</Text>
                <Text style={{ color: '#888', fontSize: 12 }}>{b.specialization || ''}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* FAB - Walk-in (gate phase 15) */
        <TouchableOpacity
          style={({
            position: 'absolute',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            backgroundColor: chairOccupancy < '2/2' ? '#10b981' : '#6b7280',
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
          })}
          onPress={() => {
            // Walk-in booking - only enabled when chairs available
            if (chairOccupancy >= '2/2') {
              Alert.alert('Будь ласка, вічір', 'Усі 2 місця на розкладі зайняті. Будь ласка, очікуйте або виберіть інший час.');
              return;
            }
            router.push('/barber/walkin');
          }}
        >
          <Text style={{ color: '#0f0f11', fontSize: 20, fontWeight: 'bold' }}>+</Text>
        </TouchableOpacity>

        {/* Chair occupancy info */}
        {selectedBarber && (
          <View style={{ position: 'absolute', top: 24, right: 24, backgroundColor: '#3f3f4f', borderRadius: 8, padding: 8 }}>
            <Text style={{ color: '#888', fontSize: 12 }}>Місця: {chairOccupancy}</Text>
          </View>
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