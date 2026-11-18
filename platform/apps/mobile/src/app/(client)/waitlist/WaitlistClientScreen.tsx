// Waitlist Client Screen — T-173: Waitlist Surfaces (Mobile).
// Client-facing waitlist screen with slot hold, FIFO position, and 10-min acceptance window.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { fetchActiveWaitlist } from '../../../lib/api';

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

    // Navigate to booking or mark as accepted
    navigation.navigate('ConfirmBooking', {
      slotId: nextSlot.slotId,
      locationId: nextSlot.locationId,
      barberId: nextSlot.barberId,
      serviceId: nextSlot.serviceId,
      agreedPrice: nextSlot.agreedPrice,
    });

    // Notify server to consume the offer
    // In production: POST /api/waitlist/release with the offer
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

  // Show notification card when slot becomes available
  useEffect(() => {
    // This would be triggered by a push notification in production
    // For now, show the card when nextSlot becomes available
    if (nextSlot && !canAccept && holdTimer !== null && holdTimer < 600) {
      // Less than 10 min remaining - show notification
      setShowNotificationCard(true);
    }
  }, [nextSlot, canAccept, holdTimer]);

  if (!visible) return null;

  // Calculate remaining time from holdExpiry
  const holdExpiry = nextSlot ? new Date(nextSlot.holdExpiry) : null;
  const createdAt = nextSlot ? new Date(nextSlot.createdAt) : null;
  let remainingSeconds = 0;

  if (holdExpiry && createdAt) {
    remainingSeconds = Math.max(0, Math.ceil((holdExpiry.getTime() - Date.now()) / 1000));
  }

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
                Слот доступний! Будь ласка, підтвердіть у течение 10 хвилин.
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
      {showNotificationCard && (
        <View style={styles.notificationCard}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>Слот скоро з'явиться</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationText}>
              Ваше місце у черзі ближче до слотів. Ми надішлемо.push-повідомлення, коли слот станеться доступним для підтвердження.
            </Text>
            <Text style={styles.notificationTimer}>
Доступу залишається: {remainingSeconds > 0 ? `${remainingSeconds} сек` : 'щойно'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>Дякуємо, ми прочистимо</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info when no waitlist entries */}
      {!nextSlot && !showNotificationCard && (
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
            <Text style={styles.pushValue}>Увімкнені у設INGS</Text>
          </Text>
        </View>
      )}
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
});

export default WaitlistClientScreen;