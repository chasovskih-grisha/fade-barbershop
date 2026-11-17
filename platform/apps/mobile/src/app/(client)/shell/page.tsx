import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable, ActivityIndicator, RefreshControl, Modal, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, OpenSans } from '@expo-google-fonts/open-sans';
import { useTon } from '../../../../lib/use-ton';
import { useOnlineStatus } from '../../../../lib/use-online-status';
import { usePush } from '../../../../lib/notifications';
import { fetchAppointments, fetchLocations } from '../../../../lib/api';
import { styles } from '../../../../index.styles';
import { CABINET_STATUS } from '../../../../lib/booking-contract';

export default function ClientShellScreen() {
  const router = useRouter();
  const { loaded, family } = useFonts({ OpenSans });
  const [online, setOnline] = useOnlineStatus();
  const { token, permission, allowed, register, revoke, error } = usePush();
  const { canViewLoyalty, loyaltyPoints, referralCount } = useTon();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Load appointments
  useEffect(() => {
    let mounted = true;
    const loadAppointments = async () => {
      try {
        const result = await fetchAppointments();
        if (mounted) setAppointments(result);
      } catch (e) {
        if (mounted) setError('Помилка завантаження візитів');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadAppointments();
    return () => { mounted = false; };
  }, []);

  // Pull-to-refresh
  const pullToRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      loadAppointments();
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
        <Text style={{ color: '#ef4444', fontSize: 16, marginBottom: 12 }}>Помилка</Text>
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

  // Format date
  const formatDate = (date: Date) => date.toLocaleDateString('uk-UA', { month: 'long', day: 'numeric' });

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
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>МОЙ КАЛЕНДАР</Text>
          <Text style={{ color: '#888', fontSize: 14 }}>{formatDate(selectedDate)}</Text>
        </View>

        {/* View Mode Toggles */}
        <View style={{ marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Pressable
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: viewMode === 'day' ? '#3f3f4f' : '#3f3f4f',
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
              backgroundColor: viewMode === 'week' ? '#3f3f4f' : '#3f3f4f',
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={() => setViewMode('week')}
          >
            <Text style={{ color: viewMode === 'week' ? '#10b981' : '#fff', fontWeight: '600' }}>Тиждень</Text>
          </Pressable>
        </View>

        {/* Day Calendar */}
        {viewMode === 'day' && appointments.length > 0 && (
          <View style={{ backgroundColor: '#18181b', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 }}>{formatDate(selectedDate)}</Text>
            
            <View style={{ height: 350, backgroundColor: '#0f0f11', borderRadius: 8, overflow: 'hidden' }}>
              {/* Time grid header - 15 min intervals */}
              <View style={{ padding: 8, borderBottomWidth: 1, borderBottomColor: '#3f3f4f' }}>
                <View style={{ flex: 1 }} />
                {Array.from({ length: 96 }, (_, i) => i * 15).map((min) => timeSlot(min))}
              </View>
              
              {/* Slots with appointments */}
              <View style={{ flex: 1, padding: 8 }}>
                {appointments.map((appt: any) => {
                  const apptStartMin = new Date(appt.start).getHours() * 60 + new Date(appt.start).getMinutes();
                  const apptEndMin = new Date(appt.end).getHours() * 60 + new Date(appt.end).getMinutes();
                  const status = appt.status || 'upcoming';
                  
                  return (
                    <View
                      key={appt.id}
                      style={{
                        height: 20,
                        backgroundColor: status === 'completed' ? '#6b7280' : status === 'cancelled' ? '#9ca3af' : '#10b981',
                        margin: 1,
                      }}
                    />
                  );
                })}
              </View>
            </View>

            {/* Appointments list below calendar */}
            {appointments.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>{appointments.length} візитів</Text>
                {appointments.map((appt: any) => (
                  <View
                    key={appt.id}
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
                      <Text style={{ color: '#fff', fontSize: 13 }}>{appt.serviceName}</Text>
                      <Text style={{ color: '#888', fontSize: 10 }}>{new Date(appt.start).toLocaleTimeString()} - {new Date(appt.end).toLocaleTimeString()}</Text>
                    </View>
                    <Pressable
                      style={{ padding: 4, borderRadius: 4, backgroundColor: '#4F46E5' }}
                      onPress={() => router.push(`/(client)/appointment/${appt.id}`)}
                    >
                      <Text style={{ color: 'white', fontSize: 10 }}>Деталі</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ))
          </View>
        )}

        {/* Week Calendar */}
        {viewMode === 'week' && (
          <View style={{ backgroundColor: '#18181b', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 }}>Тиждень</Text>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#888', fontSize: 14 }}>Пн | Вт | Ср | Чт | Пт | Сб | Вс</Text>
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
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>Нажміть на день для перегляду графіка</Text>
          </View>
        )}

        {/* No appointments state */}
        {appointments.length === 0 && (
          <View style={{ padding: 40, textAlign: 'center' }}>
            <Text style={{ color: '#64748b', fontSize: 16, marginBottom: 8 }}>У вас ще немає записів</Text>
            <Text style={{ color: '#888', fontSize: 14 }}>Будь ласка, запишіться на послугу</Text>
            <Pressable
              style={{
                marginTop: 16,
                padding: 12,
                backgroundColor: '#3f3f4f',
                borderRadius: 8,
              }}
              onPress={() => router.push('/booking')}
            >
              <Text style={{ color: '#fff' }}>Записатися</Text>
            </Pressable>
          </View>
        )}

        {/* Walk-in FAB */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            backgroundColor: '#10b981',
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => {
            router.push('/booking');
          }}
        >
          <Text style={{ color: '#0f0f11', fontSize: 20, fontWeight: 'bold' }}>+</Text>
        </TouchableOpacity>

        {/* Pull-to-refresh indicator */}
        {refreshing && (
          <View style={{ marginTop: 16, alignSelf: 'center', padding: 12, backgroundColor: '#3f3f4f', borderRadius: 8 }}>
            <ActivityIndicator size="small" />
            <Text style={{ color: '#fff', marginLeft: 8, fontSize: 12 }}>Оновлюємо...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}