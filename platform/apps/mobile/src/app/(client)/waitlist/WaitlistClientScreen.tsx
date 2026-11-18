// Waitlist Client Screen — T-173/WTL-WEB-01: Waitlist Surfaces (Mobile).
// Client-facing waitlist screen with 15-min hold timer, FIFO position,
// 'notify me when slot opens' button, and push notification when slot becomes available.
// Builds on waitlist infrastructure from T-170 (Waitlist Management) and T-171 (Waitlist Surfaces).

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
  SwitchItem,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { fetchActiveWaitlist } from '../../../lib/api';
import { usePush, usePushNotification } from '../../../../lib';
import { useNotificationSettings } from '../../../../lib/use-notification-settings';

interface WaitlistClientScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const WaitlistClientScreen: React.FC<WaitlistClientScreenProps> = ({
  visible,
  onClose,
}) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [waitlist, setWaitlist] = useState<
    | {
        id: string;
        clientId: string;
        locationId: string;
        barberId: string | null;
        serviceId: string;
        agreedPrice: number;
        holdExpiry: Date;
        status: string;
        createdAt: Date;
        missedCount: number;
      }[]
    | null>(null);
  const [nextSlot, setNextSlot] = useState<
    | {
        id: string;
        slotId: string;
        clientId: string;
        locationId: string;
        barberId: string | null;
        serviceId: string;
        agreedPrice: number;
        holdExpiry: Date;
        status: string;
        createdAt: Date;
        missedCount: number;
      } | null>(null);
  const [holdTimer, setHoldTimer] = useState<number | null>(null); // seconds remaining
  const [canAccept, setCanAccept] = useState(false);
  const [missedCount, setMissedCount] = useState(0);
  const [showNotificationCard, setShowNotificationCard] = useState(false);
  const [showNotifyMeCard, setShowNotifyMeCard] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(
    false
  );

  const { token, permission, register, error: pushError } = usePush();
  const { showNotificationPrompt, requestPermissions } = useNotificationSettings();

  // Fetch active waitlist from API
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['waitlist:active'],
    queryFn: async () => {
      const response = await fetchActiveWaitlist();
      return response.data?.entries || [];
    },
    enabled: false, // manually enable when needed
  });

  useEffect(() => {
    if (data) {
      const entries = data as Array<{
        id: string;
        clientId: string;
        locationId: string;
        barberId: string | null;
        serviceId: string;
        agreedPrice: number;
        holdExpiry: Date;
        status: string;
        createdAt: Date;
        missedCount: number;
      }>;
      setWaitlist(entries);

      // FIFO: first entry is the next slot to be offered
      if (entries.length > 0) {
        setNextSlot(entries[0]);

        // Start hold timer based on holdExpiry - createdAt
        // Backend holds slot for 15 minutes (T-171, T-105)
        const created = new Date(entries[0].createdAt);
        const expiry = new Date(entries[0].holdExpiry);
        const durationMs = expiry.getTime() - created.getTime(); // 15 min hold in backend
        const initialSeconds = Math.max(0, Math.ceil(durationMs / 1000));
        setHoldTimer(initialSeconds);

        // Check if hold has already expired
        if (Date.now() >= expiry.getTime()) {
          setCanAccept(true);
          setHoldTimer(0);
        }
      } else {
        setNextSlot(null);
        setHoldTimer(null);
      }
    }
    // Also refresh when nextSlot changes to check expiry
  }, [data]);

  // Timer to count down the hold period
  useEffect(() => {
    if (holdTimer === null || holdTimer <= 0) {
      setCanAccept(true);
      setHoldTimer(null);
      setShowNotifyMeCard(false);
      return;
    }

    const timer = setTimeout(() => {
      setHoldTimer(prev => {
        if (prev === undefined) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [holdTimer]);

  // Accept slot action
  const acceptSlot = async () => {
    if (!nextSlot) return;

    Alert.alert('Slot Accepted', 'Your slot has been accepted. Proceeding to booking...');
    setCanAccept(false);
    setHoldTimer(null);
    setMissedCount(0);
    setShowNotificationCard(false);
    setShowNotifyMeCard(false);

    // Notify server to consume the offer
    // In production: POST /api/waitlist/release with the offer

    // Navigate to booking or mark as accepted
    navigation.navigate('ConfirmBooking', {
      slotId: nextSlot.slotId,
      locationId: nextSlot.locationId,
      barberId: nextSlot.barberId,
      serviceId: nextSlot.serviceId,
      agreedPrice: nextSlot.agreedPrice,
    });
  };

  // Pause/skip offer action (anti-spam: 3 misses → pause)
  const pauseOffer = () => {
    setMissedCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 3) {
        Alert.alert(
          'Queue Paused',
          '3 misses - queue paused for 30 days. You can rejoin later.',
          [{ text: 'OK' }]
        );
        return 3;
      }
      setMissedCount(newCount);
      return newCount;
    });
  };

  // Show notification card when slot becomes available via push notification
  useEffect(() => {
    // This would be triggered by a push notification in production
    // For now, show the card when nextSlot becomes available with short remaining time
    if (nextSlot && !canAccept && holdTimer !== null && holdTimer < 600) {
      // Less than 10 min remaining - show notification
      setShowNotificationCard(true);
    }
  }, [nextSlot, canAccept, holdTimer]);

  // Show 'notify me when slot opens' card
  useEffect(() => {
    // Show notify me card when there's a next slot but user hasn't accepted/declined
    // and hold timer is still active
    if (
      nextSlot &&
      !canAccept &&
      holdTimer !== null &&
      holdTimer > 600 && // More than 10 min remaining
      !showNotifyMeCard
    ) {
      setShowNotifyMeCard(true);
    }
  }, [nextSlot, canAccept, holdTimer, showNotifyMeCard]);

  // Calculate remaining time from holdExpiry
  const holdExpiry = nextSlot ? new Date(nextSlot.holdExpiry) : null;
  const createdAt = nextSlot ? new Date(nextSlot.createdAt) : null;
  let remainingSeconds = 0;

  if (holdExpiry && createdAt) {
    remainingSeconds = Math.max(0, Math.ceil((holdExpiry.getTime() - Date.now()) / 1000));
  }

  // Subscribe to push notifications for waitlist slot availability
  useEffect(() => {
    // Register for waitlist slot availability push notifications
    if (token && !registered) {
      register();
      setNotificationEnabled(true);
    }
  }, [token, registered]);

  // Handle push notification when slot becomes available
  usePushNotification({
    onNotificationReceived: (notification) => {
      // Slot became available - show notify me card
      if (notification.data?.type === 'waitlist_slot_available') {
        setShowNotifyMeCard(true);
        setShowNotificationCard(false);
      }
    },
  });

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Waitlist</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>

      {/* FIFO Position Display */}
      {nextSlot && (
        <View style={styles.nextSlotCard}>
          <Text style={styles.nextSlotTitle}>Your Position</Text>
          <Text style={styles.nextSlotInfo}>
            {waitlist ? `${waitlist.indexOf(nextSlot) + 1}. в черзі` : '1. в черзі'}
          </Text>
          {nextSlot.barberId && (
            <Text style={styles.nextSlotBarber}>
              Будує з барбером {nextSlot.barberId}
            </Text>
          )}
          {nextSlot.serviceId && (
            <Text style={styles.nextSlotService}>
              Послуга: {nextSlot.serviceId}
            </Text>
          )}
        </View>
      )}

      {/* Hold Timer / Accept Slot */}
      {nextSlot && remainingSeconds !== undefined && (
        <View style={styles.holdTimer}>
          {remainingSeconds > 0 && (
            <View style={styles.timer}>
              <Text style={styles.timerText}>
                {remainingSeconds} сек до.accept
              </Text>
            </View>
          )}
          {remainingSeconds <= 0 && canAccept && (
            <View style={styles.acceptWindow}>
              <Text style={styles.acceptText}>
                Слот доступний! Будь ласка, підтвердіть у течение 15 хвилин.
              </Text>
            </View>
          )}
          {remainingSeconds > 0 && !canAccept && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={acceptSlot}
                style={styles.acceptButton}
                disabled={!canAccept}
              >
                <Text style={styles.acceptButtonText}>
                  {remainingSeconds <= 60 ? `${remainingSeconds} сек` : 'Прийняти слот'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={pauseOffer} style={styles.skipButton}>
                <Text style={styles.skipButtonText}>
                  {missedCount > 0 ? `Пропущено: ${missedCount}/3` : 'Пропустити предложення'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* "Notify me when slot opens" card */}
      {showNotifyMeCard && (
        <View style={styles.notificationCard}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>
              Ми надішлемо.push-повідомлення, коли слот станеться доступним
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationText}>
              Ваше місце у черзіближче до слотів. Ми надішлемо.push-повідомлення,
              коли слот станеться доступним для підтвердження в течение 15 хвилин.
            </Text>
            <Text style={styles.notificationTimer}>
              Ost remaining: {remainingSeconds > 0 ? `${remainingSeconds} сек` : 'щойно'}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => {
                setShowNotifyMeCard(false);
                // User dismissed - unsubscribe or keep subscribed
                // In production: unsubscribe from push notifications for this slot
              }}
              style={styles.confirmButton}
            >
              <Text style={styles.confirmButtonText}>Дякуємо, ми прочистимо</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowNotifyMeCard(false);
                // User wants to keep subscribed - stay in waitlist
                // In production: continue subscribing to push notifications
              }}
              style={styles.skipButton}
            >
              <Text style={styles.skipButtonText}>
                Підписатися на.push-повідомлення
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Info when no waitlist entries */}
      {!nextSlot && !showNotifyMeCard && !showNotificationCard && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Наразі немає доступних слотів</Text>
          <Text style={styles.emptySubText}>
            Черга очікування буде активна, коли стануть доступні відкриті слоти.
          </Text>
        </View>
      )}

      {/* Push notification status */}
      {showNotificationCard && (
        <View style={styles.pushStatus}>
          <Text style={styles.pushText}>
            Push-notifications:{' '}
            <Text style={styles.pushValue}>
              {' '}
              {notificationEnabled ? 'Увімкнені у設INGS' : 'Вимкнені'}
            </Text>
          </Text>
          {(!notificationEnabled || pushError) && (
            <TouchableOpacity
              onPress={() => {
                requestPermissions();
                setNotificationEnabled(true);
              }}
              style={styles.pushToggle}
            >
              <Text style={styles.pushText}>
                Налаштувати.push-повідомлення
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          onPress={() => refetch?.()}
          style={styles.refreshButton}
        >
          <Text style={styles.refreshButtonText}>
            Оновити
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>Закрити</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: Platform.select({
      ios: 20,
      android: 20,
    }),
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },

  closeButton: {
    padding: 6,
  },

  closeText: {
    color: '#7F8C8D',
    fontSize: 16,
  },

  nextSlotCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },

  nextSlotTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },

  nextSlotInfo: {
    fontSize: 16,
    color: '#5D6D7E',
    marginBottom: 4,
  },

  nextSlotBarber: {
    fontSize: 12,
    color: '#27AE60',
    marginBottom: 2,
  },

  nextSlotService: {
    fontSize: 12,
    color: '#5D6D7E',
  },

  holdTimer: {
    marginVertical: 16,
  },

  timer: {
    backgroundColor: '#ECF0F1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  timerText: {
    fontSize: 14,
    color: '#2C3E50',
  },

  acceptWindow: {
    backgroundColor: '#27AE60',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    color: '#fff',
    textAlign: 'center',
  },

  acceptText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#fff',
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  acceptButton: {
    backgroundColor: '#27AE60',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
  },

  acceptButtonText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },

  skipButton: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flex: 1,
  },

  skipButtonText: {
    color: '#5D6D7E',
    fontSize: 12,
    textAlign: 'center',
  },

  notificationCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 20,
    elevation: 4,
  },

  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },

  notificationContent: {
    marginBottom: 12,
  },

  notificationText: {
    fontSize: 14,
    color: '#5D6D7E',
    marginBottom: 8,
  },

  notificationTimer: {
    fontSize: 12,
    color: '#E74C3C',
    marginTop: 4,
  },

  confirmButton: {
    backgroundColor: '#34495E',
    padding: 10,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },

  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },

  pushStatus: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },

  pushText: {
    fontSize: 12,
    color: '#7F8C8D',
  },

  pushValue: {
    color: '#27AE60',
    fontWeight: '600',
  },

  pushToggle: {
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f8f9fa',
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },

  emptyText: {
    fontSize: 16,
    color: '#5D6D7E',
    marginBottom: 8,
  },

  emptySubText: {
    fontSize: 14,
    color: '#7F8C8D',
  },

  actionBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    display: 'flex',
    justifyContent: 'space-between',
  },

  refreshButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 6,
  },

  refreshButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  closeBtn: {
    backgroundColor: '#3f3f4f',
    padding: 12,
    borderRadius: 8,
  },

  closeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
);

export default WaitlistClientScreen;