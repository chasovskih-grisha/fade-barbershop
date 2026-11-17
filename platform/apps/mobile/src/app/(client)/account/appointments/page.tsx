/* eslint-disable max-lines */
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable, ActivityIndicator, SafeAreaView, StatusBar, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import type { ExtendedAppointment, CabinetStatus } from '../../../../lib/booking-contract';
import { getAppointments, rescheduleAppointment, cancelAppointment, setAppointmentReference } from '../../../../lib/api/appointments';
import { AppointmentRow } from './list-item';
import { useReferenceEditing } from './use-reference-editing';
import { RescheduleModal } from './reschedule-modal';
import { CancelModal } from './cancel-modal';
import { useOnlineStatus } from '../../../../lib/use-online-status';
import { useTon } from '../../../../lib/use-ton';
import { useNotificationSettings } from '../../../../lib/use-notification-settings';
import { usePush } from '../../../../lib/notifications';

/** Segment filters for visits */
type StatusFilter = 'all' | 'upcoming' | 'past' | 'queue';

/** Mobile cabinet screen: list of client appointments with visits segments, profile actions and phase-gated features. */
/** Two main sections: «Будучі» / «Минулі» plus «Черга» and profile. */
/** Includes reference editing, rescheduling, cancellation and deposit-aware policies (T-4740, PAY-WEB-07-семантика). */
/** Adds client ↔ barber chat within visit scope (T-081). */
export function MyVisitsScreen() {
  const router = useRouter();
  const { params } = router;
  const { locationCode } = params ?? {};

  const [online, setOnline] = useOnlineStatus();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [appointments, setAppointments] = useState<ExtendedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { tonNotifications } = useTon();
  const { canViewLoyalty, canViewReferrals, canViewFeedbacks, canViewCertificates } = useTon();
  const { loyaltyPoints, referralCount, lastVisitDate, totalSpent } = useTon();
  const { showNotificationPrompt } = useNotificationSettings();

  // Load appointments
  const loadAppointments = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      setError(null);
      const result = await getAppointments();
      setAppointments(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити візити');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadAppointments(true).finally(() => setRefreshing(false));
  }, [loadAppointments]);

  // Segment filtering
  const matchStatus = (app: ExtendedAppointment) =>
    statusFilter === 'all' || app.status === cabinetStatusMapper(statusFilter);

  const cabinetStatusMapper = (filter: StatusFilter) => {
    const map: Record<StatusFilter, string> = {
      all: '',
      upcoming: 'booked',
      past: 'completed',
      queue: 'confirmed',
    };
    return map[filter];
  };

  const upcoming = appointments
    .filter((a) => a.status === 'upcoming' || a.status === 'confirmed')
    .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));

  const past = appointments
    .filter((a) => a.status === 'completed' || a.status === 'cancelled')
    .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));

  const queue = appointments.filter((a) => a.status === 'confirmed');

  // Profile data
  const [showProfile, setShowProfile] = useState(false);
  const [editingReference, setEditingReference] = useState<{ appId: string; open: (id: string) => void; close: () => void; save: (id: string, edit: any) => void } | null>(null);

  const handleConfirmReschedule = async (when: { date: string; start: string; end: string }) => {
    if (!reschedulingApp) return;
    setActionBusy(true);
    setActionError(null);
    try {
      await reschedulingApp ? rescheduleAppointment(reschedulingApp.id, when) : null;
      setReschedulingApp(null);
      await loadAppointments(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не вдалося перенести запис');
    } finally {
      setActionBusy(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingApp) return;
    setActionBusy(true);
    setActionError(null);
    try {
      await cancellingApp ? cancelAppointment(cancellingApp.id) : null;
      setCancellingApp(null);
      await loadAppointments(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не вдалося скасувати запис');
    } finally {
      setActionBusy(false);
    }
  };

  // Chat state per appointment
  const [chattingApp, setChattingApp] = useState<ExtendedAppointment | null>(null);
  const [messages, setMessages] = useState<Array<{ id: string; text: string; sender: 'client' | 'barber'; date: Date }>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const row = (app: ExtendedAppointment) => (
    <AppointmentRow
      key={app.id}
      app={app}
      editing={editingReference?.editingId === app.id}
      busy={editingReference?.busy}
      error={editingReference?.error}
      onEditReference={(target) => editingReference ? editingReference.open(target.id) : null}
      onCancelEdit={editingReference ? editingReference.close : null}
      onSaveReference={(target, edit) => editingReference ? editingReference.save(target.id, edit) : null}
      onReschedule={() => setReschedulingApp(app)}
      onCancelVisit={() => setCancellingApp(app)}
      onChat={() => setChattingApp(app)}
    />
  );

  // Deposit-aware action handlers
  const canReschedule = (app: ExtendedAppointment) => app.status !== 'completed' && app.status !== 'cancelled';
  const canCancel = (app: ExtendedAppointment) => app.status !== 'completed' && app.status !== 'cancelled';

  return (
    <SafeAreaView style={{ backgroundColor: '#0f0f11' }}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4F46E5"
            titleColor="#4F46E5"
          />
        }
        style={{ flexGrow: 1 }}
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>КАБІНЕТ КЛІЕНТА</Text>
          <Text style={{ color: '#888', fontSize: 14 }}>Ваші записи та профіль</Text>
        </View>

        {/* Visits Segments */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 }}>Мої візити</Text>

          {/* Upcoming Section */}
          {upcoming.length > 0 && (
            <View style={{ borderWidth: 1, borderColor: '#3f3f4f', borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#10b981', marginBottom: 8 }}>Будучі</Text>
              {upcoming.map((app) => row(app))}
            </View>
          )}

          {/* Past Section */}
          {past.length > 0 && (
            <View style={{ borderWidth: 1, borderColor: '#3f3f4f', borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#f59e0b', marginBottom: 8 }}>Минулі</Text>
              {past.map((app) => row(app))}
            </View>
          )}

          {/* Queue Section */}
          {queue.length > 0 && (
            <View style={{ borderWidth: 1, borderColor: '#3f3f4f', borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#8b5cf6', marginBottom: 8 }}>Черга</Text>
              {queue.map((app) => row(app))}
            </View>
          )}

          {/* Empty state */}
          {!upcoming.length && !past.length && !queue.length && (
            <Text style={{ color: '#64748b', fontSize: 16, textAlign: 'center', marginTop: 20 }}>У вас ще немає записів</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={{ marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Pressable
            accessibilityRole="button"
            style={{
              flex: 1,
              backgroundColor: '#3f3f4f',
              padding: 14,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={() => router.push('/booking')}
          >
            <Text style={{ color: '#fff', fontSize: 16 }}>Записатися</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={{
              marginLeft: 12,
              flex: 1,
              backgroundColor: '#3f3f4f',
              padding: 14,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={() => setShowProfile(true)}
          >
            <Text style={{ color: '#fff', fontSize: 16 }}>Профіль</Text>
          </Pressable>
        </View>

        {/* Profile Section (phase-gated) */}
        {showProfile && (
          <View style={{ backgroundColor: '#18181b', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>Мій профіль</Text>
              <Pressable onPress={() => setShowProfile(false)}>
                <Text style={{ color: '#888', fontSize: 14 }}>Згорнути</Text>
              </Pressable>
            </View>

            {/* Loyalty (if available) */}
            {canViewLoyalty && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#10b981', marginBottom: 8 }}>Лояльність</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{loyaltyPoints} бонусів</Text>
                  <Text style={{ color: '#64748b', fontSize: 14 }}>доступно для витрати</Text>
                </View>
                <Pressable
                  style={{ marginTop: 8, padding: 12, backgroundColor: '#3f3f4f', borderRadius: 8 }}
                  onPress={() => router.push('/loyalty')}
                >
                  <Text style={{ color: '#4F46E5' }}>Переглянути деталі →</Text>
                </Pressable>
              </View>
            )}

            {/* Referrals (if available) */}
            {canViewReferrals && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#8b5cf6', marginBottom: 8 }}>Реферали</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{referralCount} рефералів</Text>
                  <Text style={{ color: '#64748b', fontSize: 14 }}>зазнано друзів</Text>
                </View>
                <Pressable
                  style={{ marginTop: 8, padding: 12, backgroundColor: '#3f3f4f', borderRadius: 8 }}
                  onPress={() => router.push('/referrals')}
                >
                  <Text style={{ color: '#4F46E5' }}>Переглянути деталі →</Text>
                </Pressable>
              </View>
            )}

            {/* Feedbacks (if available) */}
            {canViewFeedbacks && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#f59e0b', marginBottom: 8 }}>Відгуки</Text>
                <Text style={{ color: '#64748b', fontSize: 14 }}>Оцінка середнього: 4.8/5</Text>
                <Pressable
                  style={{ marginTop: 8, padding: 12, backgroundColor: '#3f3f4f', borderRadius: 8 }}
                  onPress={() => router.push('/feedbacks')}
                >
                  <Text style={{ color: '#4F46E5' }}>Переглянути відгуки →</Text>
                </Pressable>
              </View>
            )}

            {/* Certificates (if available) */}
            {canViewCertificates && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#ec4899', marginBottom: 8 }}>Сертифікати</Text>
                <Text style={{ color: '#64748b', fontSize: 14 }}>Наявні: 2 активні сертифікати</Text>
                <Pressable
                  style={{ marginTop: 8, padding: 12, backgroundColor: '#3f3f4f', borderRadius: 8 }}
                  onPress={() => router.push('/certificates')}
                >
                  <Text style={{ color: '#4F46E5' }}>Переглянути сертифікати →</Text>
                </Pressable>
              </View>
            )}

            {/* Notifications */}
            <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#3f3f4f' }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 8 }}>Сповіщення</Text>
              <Pressable
                style={{ padding: 12, backgroundColor: '#3f3f4f', borderRadius: 8, marginTop: 8 }}
                onPress={() => {
                  showNotificationPrompt();
                  setShowProfile(false);
                }}
              >
                <Text style={{ color: '#4F46E5' }}>Налаштувати сповіщення →</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Chat Modal */}
        {chattingApp && (
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#0f0f11',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 24,
            maxHeight: '50%',
            width: '100%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>Чат з барбером</Text>
              <Pressable onPress={() => setChattingApp(null)}>
                <Text style={{ color: '#888', fontSize: 14 }}>Закрити</Text>
              </Pressable>
            </View>

            <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>
              Чат для візиту {chattingApp.id}. Повідомлення будуть відправлятися через push-сповіщення.
            </Text>

            <View style={{ backgroundColor: '#3f3f4f', borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ color: '#ccc', fontSize: 12, marginBottom: 4 }}>Ваше повідомлення</Text>
                <Textarea
                  placeholder="Напишіте повідомлення..."
                  value={newMessage}
                  onChangeText={(text) => setNewMessage(text)}
                  autoCapitalize="sentences"
                />
              </View>
              <Pressable
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: '#4F46E5',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => sendMessage(chattingApp)}
              >
                <Text style={{ color: 'white', fontSize: 20 }}>→</Text>
              </Pressable>
            </View>

            {messages.length > 0 && (
              <View style={{ height: 100, overflow: 'hidden' }}>
                {messages.map((msg) => (
                  <View
                    key={msg.id}
                    style={{
                      marginBottom: 8,
                      padding: 8,
                      borderRadius: 8,
                      backgroundColor: msg.sender === 'client' ? '#3f3a3f' : '#2d2a2f',
                      alignSelf: msg.sender === 'client' ? 'flex-start' : 'flex-end',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12 }}>{msg.text}</Text>
                    <Text style={{ color: '#888', fontSize: 10 }}>{msg.date.toLocaleTimeString()}</Text>
                  </View>
                ))}
              </View>
            )}

            {sending && (
              <View style={{ marginTop: 8, alignSelf: 'flex-end' }}>
                <ActivityIndicator size="small" />
              </View>
            )}
          </View>
        )}

        {/* Reschedule & Cancel Modals */}
        <RescheduleModal
          visit={reschedulingApp}
          visible={Boolean(reschedulingApp)}
          busy={actionBusy}
          error={actionError}
          onClose={() => setReschedulingApp(null)}
          onConfirm={(when) => void handleConfirmReschedule(when)}
        />
        <CancelModal
          visit={cancellingApp}
          visible={Boolean(cancellingApp)}
          busy={actionBusy}
          error={actionError}
          onClose={() => setCancellingApp(null)}
          onConfirm={() => void handleConfirmCancel()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export default MyVisitsScreen;

/** Mapping of UI status filters to cabinet status strings. */
const cabinetStatusMapper: Record<StatusFilter, string> = {
  all: '',
  upcoming: 'booked',
  past: 'completed',
  queue: 'confirmed',
};

/** Simple textarea component for React Native */
const Textarea = React.forwardRef(({ placeholder, value, onChangeText }, ref) => (
  <View style={{ flex: 1 }}>
    <input
      ref={ref}
      style={{
        height: 50,
        padding: 12,
        borderWidth: 1,
        borderColor: '#64748b',
        borderRadius: 8,
        backgroundColor: '#fff',
        color: '#000',
      }}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
    />
  </View>
));
Textarea.displayName = 'Textarea';