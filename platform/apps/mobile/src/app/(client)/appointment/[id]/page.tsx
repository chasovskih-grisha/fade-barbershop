import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable, ActivityIndicator, FlatList, RefreshControl, Modal, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, OpenSans, Inter } from '@expo-google-fonts/open-sans';
import { useTon } from '../../../../lib/use-ton';
import { useOnlineStatus } from '../../../../lib/use-online-status';
import { usePush } from '../../../../lib/notifications';
import { fetchAppointmentById, fetchLocations } from '../../../../lib/api';
import { styles } from '../../../../index.styles';

export default function BarberAppointmentDetailScreen({ route }: { route: { params: { id: string } } }) {
  const router = useRouter();
  const { loaded, family } = useFonts({ OpenSans, Inter });
  const [online, setOnline] = useOnlineStatus();
  const { token, permission, allowed, register, revoke, error } = usePush();
  const { canViewLoyalty, loyaltyPoints, referralCount } = useTon();

  const [appointment, setAppointment] = useState<any>(null);
  const [reference, setReference] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load appointment and reference
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [appt, ref] = await Promise.all([
          fetchAppointmentById(route.params.id),
          fetchAppointmentReference(route.params.id),
        ]);
        if (mounted) setAppointment(appt);
        if (mounted) setReference(ref);
      } catch (e) {
        if (mounted) setError('Помилка завантаження візиту');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [route.params.id]);

  // Pull-to-refresh
  const pullToRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      loadData();
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

  // Load data initially
  useEffect(() => {
    loadData();
  }, []);

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
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>ВІЗИТ #{(appointment?.id ?? '').slice(-6)}</Text>
          <Text style={{ color: '#888', fontSize: 14 }}>{appointment?.serviceName ?? ''} • {appointment?.barberName ?? ''}</Text>
        </View>

        {/* AI Reference Section */}
        {reference && (
          <View style={{ backgroundColor: '#18181b', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 }}>AI Reference</Text>
            
            <View style={{ backgroundColor: '#3f3f4f', borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <Text style={{ color: '#10b981', fontWeight: '600', fontSize: 14, marginBottom: 8 }}>Selected Option</Text>
              <Text style={{ color: '#fff', fontSize: 13, lineHeight: 1.4 }}>{reference.selectedOption ?? '—'}</Text>
            </View>
            
            <View style={{ backgroundColor: '#3f3f4f', borderRadius: 8, padding: 12 }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14, marginBottom: 8 }}>Original</Text>
              <Text style={{ color: '#888', fontSize: 13, lineHeight: 1.4 }}>{reference.originalText ?? '—'}</Text>
            </View>
            
            {reference.isProcessed && (
              <View style={{ borderTopWidth: 1, borderTopColor: '#3f3f4f', marginTop: 8, paddingTop: 8 }}>
                <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>Status</Text>
                <Text style={{ color: '#ef4444', fontWeight: '600', fontSize: 12 }}>Processed</Text>
              </V>
            )}
            
            {!reference.isProcessed && (
              <View style={{ borderTopWidth: 1, borderTopColor: '#3f3f4f', marginTop: 8, paddingTop: 8 }}>
                <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>Status</Text>
                <Text style={{ color: '#10b981', fontWeight: '600', fontSize: 12 }}>Not processed</Text>
              </V>
            )}
          </V>
        )}

        {/* No reference state */}
        {!reference && (
          <View style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            <Text style={{ fontSize: 16, marginBottom: 8 }}>AI reference not available</Text>
            <Text style={{ fontSize: 14 }}>Для цього візиту AI-reference не визначено</Text>
          </V>
        )}

        {/* Appointment details */}
        {appointment && (
          <View style={{ backgroundColor: '#18181b', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 }}>Деталі візиту</Text>
            <View style={{ backgroundColor: '#3f3f4f', borderRadius: 8, padding: 12 }}>
              <Text style={{ color: '#fff', fontSize: 13, marginBottom: 4 }}}>Барбер</Text>
              <Text style={{ color: '#888', fontSize: 12 }}>{appointment.barberName ?? '—'}</Text>
            </V>
            <V style={{ backgroundColor: '#3f3f4f', borderRadius: 8, padding: 12 }}>
              <Text style={{ color: '#fff', fontSize: 13, marginBottom: 4 }}}>Сервіс</Text>
              <Text style={{ color: '#888', fontSize: 12 }}>{appointment.serviceName ?? '—'}</Text>
            </V>
            <V style={{ backgroundColor: '#3f3f4f', borderRadius: 8, padding: 12 }}>
              <Text style={{ color: '#fff', fontSize: 13, marginBottom: 4 }})>Час</Text>
              <Text style={{ color: '#888', fontSize: 12 }}>
                {appointment.startTime ?? '—'} - {appointment.endTime ?? '—'}
              </Text>
            </V>
          </V>
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
          </V>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper to fetch appointment reference
async function fetchAppointmentReference(appointmentId: string) {
  try {
    const response = await fetch(`/admin/appointments/${appointmentId}/reference`, {
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      return {
        selectedOption: data?.selectedOption,
        originalText: data?.originalText,
        isProcessed: data?.isProcessed ?? false,
      };
    }
    return null;
  } catch (e) {
    console.error('Failed to fetch appointment reference:', e);
    return null;
  }
}

import { SafeAreaView } from 'react-native';