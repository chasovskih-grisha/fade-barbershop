import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable, ActivityIndicator, FlatList, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, OpenSans, Inter } from '@expo-google-fonts/open-sans';
import { useTon } from '../../../../lib/use-ton';
import { useOnlineStatus } from '../../../../lib/use-online-status';
import { usePush } from '../../../../lib/notifications';
import { fetchVisitsByBarber, fetchLikesByBarber, fetchNotesByBarber } from '../../../../lib/api';
import { styles } from '../../../../index.styles';

export default function BarberClientCardScreen({ route }: { route: { params: { barberId: string } } }) {
  const router = useRouter();
  const { loaded, family } = useFonts({ OpenSans, Inter });
  const [online, setOnline] = useOnlineStatus();
  const { token, permission, allowed, register, revoke, error } = usePush();
  const { canViewLoyalty, loyaltyPoints, referralCount } = useTon();

  const [barberId, setBarberId] = useState<string>(route.params.barberId);
  const [visits, setVisits] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load data
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [visitsResult, likesResult, notesResult] = await Promise.all([
          fetchVisitsByBarber(barberId),
          fetchLikesByBarber(barberId),
          fetchNotesByBarber(barberId),
        ]);
        if (mounted) {
          setVisits(visitsResult);
          setLikes(likesResult);
          setNotes(notesResult);
        }
      } catch (e) {
        if (mounted) setError('Помилка завантаження даних');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [barberId]);

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
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>КАРТА КЛІЄНТА</Text>
          <Text style={{ color: '#888', fontSize: 14 }}>{/* Barber name would come from API */}</Text>
        </View>

        {/* Tabs */}
        <View style={{ marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#3f3f4f', paddingBottom: 8 }}>
          <View
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: '#3f3f4f',
              borderRadius: 8,
              marginRight: 4,
            }}
            onPress={() => {}}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Візити</Text>
          </View>
          <View
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: '#2a2a30',
              borderRadius: 8,
              marginRight: 4,
            }}
            onPress={() => {}}
          >
            <Text style={{ color: '#888', fontWeight: '600' }}>Вподобання</Text>
          </View>
          <View
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: '#2a2a30',
              borderRadius: 8,
            }}
            onPress={() => {}}
          >
            <Text style={{ color: '#888', fontWeight: '600' }}>Нотатки</Text>
          </View>
        </View>

        {/* Visits Tab */}
        { /* Visits content */ }

        {/* Likes Tab - read-only */}
        <View style={{ backgroundColor: '#18181b', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 }}>Вподобання ({likes.length})</Text>
          {likes.length === 0 && (
            <Text style={{ color: '#64748b', fontSize: 14 }}>Немає підпублкованих візитів</Text>
          )}
          {likes.map((like: any) => (
            <View
              key={like.id}
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
                <Text style={{ color: '#fff', fontSize: 13 }}>{like.visitService}</Text>
                <Text style={{ color: '#888', fontSize: 10 }}>{like.date}</Text>
              </View>
              <Pressable
                style={{ padding: 4, borderRadius: 4, backgroundColor: '#4F46E5' }}>
                <Text style={{ color: 'white', fontSize: 10 }}>Деталі</Text>
              </Pressable>
            </View>
          ))}
        </View>

        {/* Notes Tab - with authorship */}
        <View style={{ backgroundColor: '#18181b', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 }}>Нотатки ({notes.length})</Text>
          {notes.length === 0 && (
            <Text style={{ color: '#64748b', fontSize: 14 }}>Немає нотаток</Text>
          )}
          {notes.map((note: any) => (
            <View
              key={note.id}
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
                  <Text style={{ color: '#fff', fontSize: 13 }}>{note.text}</Text>
                  <Text style={{ color: '#888', fontSize: 10 }}>{note.author} • {note.createdAt}</Text>
                </View>
                <Pressable
                  style={{ padding: 4, borderRadius: 4, backgroundColor: '#4F46E5' }}>
                  <Text style={{ color: 'white', fontSize: 10 }}>Деталі</Text>
                </Pressable>
              </View>
          ))}
        </View>

        {/* No visits state */}
        {visits.length === 0 && (
          <View style={{ padding: 40, textAlign: 'center' }}>
            <Text style={{ color: '#64748b', fontSize: 16, marginBottom: 8 }}>У цього барбера немає візитів</Text>
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