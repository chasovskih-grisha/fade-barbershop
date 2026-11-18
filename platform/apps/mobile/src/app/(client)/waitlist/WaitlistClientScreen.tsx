/***
 * T-195: Offline-First Mobile Functionality
 * 
 * Extends T-183 T-194 Mobile Waitlist Client with offline-first capabilities:
 * local caching, action queueing for sync on reconnection, stale data detection,
 * and background sync. Critical for barbershops in areas with spotty connectivity.
 * 
 * Builds on waitlist infrastructure from T-170/T-171/T-172/T-173/T-174/T-183/T-194.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Switch,
  SwitchItem,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Button,
  TextInput,
  RefreshControl,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { fetchActiveWaitlist } from '../../../lib/api';
import { usePush, usePushNotification } from '../../../../lib';
import { useNotificationSettings } from '../../../../lib/use-notification-settings';
import { T174BatchSlotSelectionUseCase } from '../../../../api/scheduling/application/t-174-batch-slot-selection.use-case';
import { BatchSlotSelectionInput, BatchSlotSelectionResult } from '../../../../api/scheduling/application/t-174-batch-slot-selection.use-case';
import { GroupBookingInput } from '../../../../api/scheduling/application/t-174-batch-slot-selection.use-case';

interface WaitlistClientScreenProps {
  visible: boolean;
  onClose: () => void;
}

interface Participant {
  id: string;
  name: string;
  phone: string;
}

interface GroupBookingStep {
  step: 'select' | 'participants' | 'confirm' | 'completed';
  error?: string;
}

/** T-195: Offline-First Mobile Functionality - Main Component */
export const WaitlistClientScreen: React.FC<WaitlistClientScreenProps> = ({
  visible,
  onClose,
}) => {
  const navigation = useNavigation();
  const { token, permission, register, error: pushError } = usePush();
  const { showNotificationPrompt, requestPermissions } = useNotificationSettings();

  // T-174 batch slot selection use case
  const batchUseCase = new T174BatchSlotSelectionUseCase(
    {} as any,
    {} as any,
    {} as any
  );

  // State
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
  const [holdTimer, setHoldTimer] = useState<number | null>(null);
  const [missedCount, setMissedCount] = useState(0);
  const [showNotificationCard, setShowNotificationCard] = useState(false);
  const [showNotifyMeCard, setShowNotifyMeCard] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(false);

  // T-183 Group Booking State
  const [groupSize, setGroupSize] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [batchSlots, setBatchSlots] = useState<
    | {
        slotId: string;
        barberId: string;
        serviceId: string;
        startTime: string;
        formattedTime: string;
      }[]
    | null>(null);
  const [rejectedReasons, setRejectedReasons] = useState<string[]>([]);
  const [totalEstimatedPrice, setTotalEstimatedPrice] = useState(0);
  const [bookingStep, setBookingStep] = useState<'select' | 'participants' | 'confirm' | 'completed'>(
    'select'
  );
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipantName, setNewParticipantName] = useState<string>('');
  const [newParticipantPhone, setNewParticipantPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [groupBookingStep, setGroupBookingStep] = useState<GroupBookingStep>('select');

  // T-195 Offline-First State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [localWaitlistCache, setLocalWaitlistCache] = useState<
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
  const [pendingActions, setPendingActions] = useState<
    | {
        type: 'join_waitlist' | 'accept_slot' | 'add_participant' | 'cancel_slot';
        payload: any;
        timestamp: Date;
      }[]
    | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAttempt, setLastSyncAttempt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Efficiency metrics
  const [efficiencyMetrics, setEfficiencyMetrics] = useState<{
    utilizationRate: number;
    averageWaitTime: number;
    fifoProgressionSpeed: number;
    totalEntries: number;
    completedEntries: number;
    declinedEntries: number;
    pausedEntries: number;
  } | null>(null);

  // FIFO cascade data
  const [cascadeData, setCascadeData] = useState<{
    timestamp: Date;
    positionsFreed: number;
    entriesOffered: number;
    acceptances: number;
    declinations: number;
    expirations: number;
  } | null>(null);

  // Fetch active waitlist (online or from cache)
  const {
    data,
    isLoading: queryLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['waitlist:active:online-cache'],
    queryFn: async () => {
      // Try online fetch first if online, otherwise use cache
      if (isOnline) {
        const response = await fetchActiveWaitlist();
        return response.data?.entries || [];
      }
      // Return cached data if available
      return localWaitlistCache || [];
    },
    refetchInterval: 30000,
    enabled: isOnline, // Disable auto-refetch when offline
  });

  // Use effect to cache data and handle app state changes
  useEffect(() => {
    // Cache the fetched data locally for offline use
    if (data && isOnline) {
      setLocalWaitlistCache(data as Array<{
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
      }>);
    }
    
    // When app returns to online, sync pending actions
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' && !isOnline) {
        // App just became active - check connectivity and sync
        setIsOnline(true);
        setTimeout(() => {
          syncPendingActions();
        }, 1000);
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isOnline, data, localWaitlistCache]);

  // Sync pending actions when coming online
  const syncPendingActions = async () => {
    if (!isOnline || isSyncing || !pendingActions?.length) return;
    
    setIsSyncing(true);
    setSyncError(null);
    
    try {
      // Process each pending action
      for (const action of pendingActions) {
        switch (action.type) {
          case 'join_waitlist':
            // Re-join waitlist when back online
            await refetch();
            break;
          case 'accept_slot':
            if (nextSlot) {
              await acceptSlot();
            }
            break;
          case 'add_participant':
            if (groupBookingStep === 'participants' && newParticipantName.trim() && newParticipantPhone.trim()) {
              addParticipant();
            }
            break;
          case 'cancel_slot':
            // Cancel any pending slot acceptance
            setCanAccept?.(false);
            break;
        }
      }
      setLastSyncAttempt(new Date());
    } catch (error) {
      setSyncError('Sync failed. Actions queued for later.');
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Calculate remaining time from holdExpiry
  const holdExpiry = nextSlot ? new Date(nextSlot.holdExpiry) : null;
  const createdAt = nextSlot ? new Date(nextSlot.createdAt) : null;
  let remainingSeconds = 0;

  if (holdExpiry && createdAt) {
    remainingSeconds = Math.max(0, Math.ceil((holdExpiry.getTime() - Date.now()) / 1000));
  }

  // Accept slot action
  const acceptSlot = async () => {
    if (!nextSlot) return;

    Alert.alert('Slot Accepted', 'Your slot has been accepted. Proceeding to booking...');
    setCanAccept(false);
    setHoldTimer(null);
    setMissedCount(0);
    setShowNotificationCard(false);
    setShowNotifyMeCard(false);

    // Navigate to booking or mark as accepted
    navigation.navigate('ConfirmBooking', {
      slotId: nextSlot.slotId,
      locationId: nextSlot.locationId,
      barberId: nextSlot.barberId,
      serviceId: nextSlot.serviceId,
      agreedPrice: nextSlot.agreedPrice,
      groupSize: groupSize,
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
    if (nextSlot && !canAccept && holdTimer !== null && holdTimer < 600) {
      setShowNotificationCard(true);
    }
  }, [nextSlot, canAccept, holdTimer]);

  // Show 'notify me when slot opens' card
  useEffect(() => {
    if (
      nextSlot &&
      !canAccept &&
      holdTimer !== null &&
      holdTimer > 600 &&
      !showNotifyMeCard
    ) {
      setShowNotifyMeCard(true);
    }
  }, [nextSlot, canAccept, holdTimer, showNotifyMeCard]);

  // Handle push notification when slot becomes available
  usePushNotification({
    onNotificationReceived: (notification) => {
      if (notification.data?.type === 'waitlist_slot_available') {
        setShowNotifyMeCard(true);
        setShowNotificationCard(false);
      }
    },
  });

  // Calculate remaining time
  const holdExpiryDate = nextSlot ? new Date(nextSlot.holdExpiry) : null;
  const createdAtDate = nextSlot ? new Date(nextSlot.createdAt) : null;
  let remainingSeconds = 0;

  if (holdExpiryDate && createdAtDate) {
    remainingSeconds = Math.max(0, Math.ceil((holdExpiryDate.getTime() - Date.now()) / 1000));
  }

  // Subscribe to push notifications
  useEffect(() => {
    if (token && !registered) {
      register();
      setNotificationEnabled(true);
    }
  }, [token, registered]);

  // Styles
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

    // Online/Offline status bar
    statusBar: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    statusOnline: {
      color: '#27AE60',
      fontSize: 12,
    },

    statusOffline: {
      color: '#E74C3C',
      fontSize: 12,
    },

    statusText: {
      fontSize: 12,
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
      fontWeight: 'bold',
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

    // T-183 Group Booking Styles
    groupSelectionCard: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      elevation: 2,
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },

    groupSelectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#2C3E50',
      marginBottom: 16,
    },

    serviceChip: {
      backgroundColor: '#E8EDF5',
      padding: 8,
      borderRadius: 6,
      marginRight: 8,
      marginBottom: 8,
    },

    serviceChipText: {
      fontSize: 12,
      color: '#2C3E50',
    },

    groupSizePicker: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },

    sizeOption: {
      backgroundColor: '#F5F5F5',
      padding: 10,
      borderRadius: 6,
      minWidth: 40,
      textAlign: 'center',
    },

    sizeOptionSelected: {
      backgroundColor: '#27AE60',
      padding: 10,
      borderRadius: 6,
      minWidth: 40,
      textAlign: 'center',
    },

    sizeOptionText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },

    participantCard: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },

    participantHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },

    participantName: {
      fontSize: 14,
      color: '#2C3E50',
    },

    participantPhone: {
      fontSize: 12,
      color: '#5D6D7E',
    },

    addParticipantInput: {
      flexDirection: 'row',
      marginBottom: 12,
      alignItems: 'center',
    },

    participantInput: {
      flex: 1,
      height: 40,
      borderWidth: 1,
      borderColor: '#e0e0e0',
      borderRadius: 6,
      paddingHorizontal: 10,
      marginRight: 8,
    },

    addParticipantButton: {
      backgroundColor: '#27AE60',
      padding: 8,
      borderRadius: 6,
    },

    addParticipantButtonText: {
      color: '#fff',
      fontSize: 12,
      textAlign: 'center',
    },

    participantList: {
      marginTop: 8,
    },

    participantListItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 4,
    },

    participantItemName: {
      fontSize: 12,
      color: '#2C3E50',
    },

    participantItemRemove: {
      color: '#E74C3C',
      fontSize: 12,
    },

    bookingStepIndicator: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 20,
    },

    stepIndicator: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: '#e0e0e0',
      justifyContent: 'center',
      alignItems: 'center',
    },

    stepIndicatorActive: {
      backgroundColor: '#27AE60',
    },

    stepIndicatorText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },

    // Group booking step styles
    groupBookingSelect: {
      padding: 20,
    },

    groupBookingParticipants: {
      padding: 20,
    },

    groupBookingConfirm: {
      padding: 20,
    },

    groupBookingCompleted: {
      padding: 20,
      textAlign: 'center',
    },

    groupBookingNote: {
      fontSize: 12,
      color: '#5D6D7E',
      marginTop: 8,
    },

    // Input styles using TextInput
    participantInputStyle: {
      flex: 1,
      height: 40,
      borderWidth: 1,
      borderColor: '#e0e0e0',
      borderRadius: 6,
      paddingHorizontal: 10,
      marginRight: 8,
    },

    // Offline indicator styles
    offlineBanner: {
      backgroundColor: '#E74C3C',
      padding: 10,
      borderRadius: 8,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },

    offlineBannerText: {
      color: '#fff',
      fontSize: 14,
      marginRight: 8,
    },

    offlineRetryButton: {
      backgroundColor: '#ECF0F1',
      padding: 6,
      borderRadius: 4,
    },

    offlineRetryButtonText: {
      color: '#2C3E50',
      fontSize: 12,
    },
  });

  // Online status listener
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // Check if we're online when app becomes active
        setIsOnline(navigator.onLine);
        // Attempt sync if we just came online
        if (navigator.onLine && pendingActions?.length) {
          syncPendingActions();
        }
      }
    };
    
    const handleNetworkChange = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        syncPendingActions();
      }
    };
    
    const onlineListener = addEventListener('online', handleNetworkChange);
    const offlineListener = addEventListener('offline', handleNetworkChange);
    
    return () => {
      removeEventListener('online', onlineListener);
      removeEventListener('offline', offlineListener);
    };
  }, [pendingActions]);

  // Initial data load
  useEffect(() => {
    if (!isLoading && data && isOnline) {
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

      // FIFO: first entry is next to be offered
      if (entries.length > 0) {
        setNextSlot(entries[0]);

        // Start hold timer based on holdExpiry - createdAt
        const created = new Date(entries[0].createdAt);
        const expiry = new Date(entries[0].holdExpiry);
        const durationMs = expiry.getTime() - created.getTime();
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
    setIsLoading(false);
  }, [data, isLoading, isOnline]);

  useEffect(() => {
    if (!isLoading) {
      refetch();
    }
  }, [refetch, isLoading]);

  // T-183: Find batch slots for group booking
  const fetchBatchSlots = async () => {
    if (!nextSlot) return;

    setGroupBookingStep('select');
    setIsSubmitting(true);
    setBookingError(null);
    setBookingSuccess(null);

    try {
      const input: BatchSlotSelectionInput = {
        clientId: nextSlot.clientId,
        preferredServices: selectedServices.length > 0 ? selectedServices : ['any'],
        groupSize: groupSize,
        preferredDate: new Date().toISOString().split('T')[0],
        fallbackEnabled: true,
      };

      const result: BatchSlotSelectionResult = await batchUseCase.findBatchSlots(input);

      setBatchSlots(result.selectedSlots || []);
      setRejectedReasons(result.rejectedReasons || []);
      setTotalEstimatedPrice(result.totalEstimatedPrice || 0);

      if (result.success && result.selectedSlots.length > 0) {
        setGroupBookingStep('participants');
      } else {
        setGroupBookingStep('select');
        Alert.alert('No Slots', result.rejectedReasons?.join(',') || 'No available slots matching criteria');
      }
    } catch (error) {
      setBookingError('Failed to find batch slots. Please try again.');
      setGroupBookingStep('select');
    } finally {
      setIsSubmitting(false);
    }
  };

  // T-183: Create group booking
  const createGroupBooking = async () => {
    if (participants.length < groupSize) {
      Alert.alert('Validation Error', `Need ${groupSize} participants, but only ${participants.length} registered`);
      return;
    }

    setIsSubmitting(true);
    setBookingError(null);
    setBookingSuccess(null);

    try {
      const input: GroupBookingInput = {
        clientId: nextSlot.clientId,
        assignedBarberId: nextSlot.barberId || '',
        serviceId: selectedServices[0] || 'any',
        slotId: batchSlots?.[0]?.slotId || '',
        groupSize: groupSize,
        notes: `Group booking of ${groupSize} participants`,
      };

      const result = await batchUseCase.createGroupBooking(input);

      if (result.success) {
        setGroupBookingStep('completed');
        setBookingSuccess(result.summary);
        // Reset state after successful booking
        setTimeout(() => {
          setGroupSize(1);
          setSelectedServices([]);
          setBatchSlots(null);
          setRejectedReasons([]);
          setTotalEstimatedPrice(0);
          setGroupBookingStep('select');
          setParticipants([]);
          setNewParticipantName('');
          setNewParticipantPhone('');
          setIsSubmitting(false);
          refetch();
        }, 3000);
      } else {
        setBookingError(result.summary || 'Group booking failed. Please try again.');
        setGroupBookingStep('confirm');
      }
    } catch (error) {
      setBookingError('Failed to create group booking. Please try again.');
      setGroupBookingStep('confirm');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add participant
  const addParticipant = () => {
    if (!newParticipantName.trim() || !newParticipantPhone.trim()) {
      Alert.alert('Validation Error', 'Please enter both name and phone number');
      return;
    }

    const newParticipant: Participant = {
      id: Math.random().toString(36).substr(2, 9),
      name: newParticipantName.trim(),
      phone: newParticipantPhone.trim(),
    };

    setParticipants([...participants, newParticipant]);
    setNewParticipantName('');
    setNewParticipantPhone('');
  };

  // Remove participant
  const removeParticipant = (participantId: string) => {
    setParticipants(participants.filter((p) => p.id !== participantId));
  };

  // Queue action for offline sync
  const queueAction = (type: 'join_waitlist' | 'accept_slot' | 'add_participant' | 'cancel_slot', payload: any) => {
    setPendingActions(prev => [...(prev || []), { type, payload, timestamp: new Date() }]);
  };

  // Waitlist Status
  {nextSlot && (
    <View style={styles.nextSlotCard}>
      <Text style={styles.nextSlotTitle}>Ваша позиція</Text>
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
      <Text style={styles.nextSlotService}>
        Час: {nextSlot.startTime || 'очікування'}
        {isOnline ? '' : ' (кэш)' }
      </Text>
    </V>
  )}

  {/* Online/Offline banner */}
  {!isOnline && (
    <View style={styles.offlineBanner}>
      <Text style={styles.offlineBannerText}>Офлайн-режим</Text>
      <Text style={styles.offlineRetryButtonText}>Онлайн</Text>
      <Button title="Повторити" onPress={() => setIsOnline(true)} style={styles.offlineRetryButton} />
    </V>
  )}

  {/* Hold Timer */}
  {nextSlot && remainingSeconds !== undefined && (
    <View style={styles.holdTimer}>
      {remainingSeconds > 0 && (
        <View style={styles.timer}>
          <Text style={styles.timerText}>
            {remainingSeconds} сек до слотів
          </Text>
        </V>
      )}
      {remainingSeconds <= 0 && canAccept && (
        <View style={styles.acceptWindow}>
          <Text style={styles.acceptText}>
            Слот доступний! Будь ласка, підтвердіть у течение 15 хвилин.
          </Text>
        </V>
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
        </V>
      )}
    </V>
  )}

  {/* T-183: Group Booking Flow */}
  {groupBookingStep === 'select' && (
    <View style={styles.groupSelectionCard}>
      <Text style={styles.groupSelectionTitle}>Group Booking</Text>

      {/* Group Size Selection */}
      <View style={styles.groupSizePicker}>
        {[1, 2, 3, 4, 5].map((size) => (
          <TouchableOpacity
            key={size}
            style={[
              styles.sizeOption,
              groupSize === size && styles.sizeOptionSelected,
            ]}
            onPress={() => setGroupSize(size)}
          >
            <Text style={[
              styles.sizeOptionText,
              groupSize === size && styles.sizeOptionTextSelected,
            ]}>
              {size}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Service Selection */}
      {selectedServices.length > 0 ? (
        <View>
          <Text style={styles.participantName}>Обрані послуги:</Text>
          {selectedServices.map((service, index) => (
            <View
              key={service}
              style={styles.serviceChip}
            >
              <Text style={styles.serviceChipText}>{service}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View>
          <Text style={styles.participantName}>Обрати послугу:</Text>
          <View style={styles.serviceChip}>
            <Text style={styles.serviceChipText}>Мужаре – стрижка</Text>
          </View>
          <View style={styles.serviceChip}>
            <Text style={styles.serviceChipText}>Жіночі – стрижка</Text>
          </View>
          <View style={styles.serviceChip}>
            <Text style={styles.serviceChipText}>Дитиночі – стрижка</Text>
          </View>
        </V>
      )}

      {/* Find Slots Button */}
      <TouchableOpacity
        onPress={fetchBatchSlots}
        style={styles.btnPrimary}
      >
        <Text style={styles.btnPrimaryText}>
          Знайти слоти для групи
        </Text>
      </TouchableOpacity>

      {rejectedReasons.length > 0 && (
        <View style={styles.alertBox}>
          <Text style={styles.alertText}>
            {rejectedReasons.join('. ')}
          </Text>
        </V>
      )}
    </V>
  )}

  {groupBookingStep === 'participants' && (
    <View style={styles.groupBookingParticipants}>
      <Text style={styles.groupSelectionTitle}>
        Деталі учасників ({participants.length}/{groupSize})
      </Text>

      {/* Participant List */}
      {participants.map((participant, index) => (
        <View
          key={participant.id}
          style={styles.participantCard}
        >
          <View style={styles.participantHeader}>
            <Text style={styles.participantName}>{participant.name}</Text>
            <Text style={styles.participantPhone}>{participant.phone}</Text>
            <TouchableOpacity
              onPress={() => removeParticipant(participant.id)}
              style={styles.participantRemove}
            >
              <Text style={{ color: '#E74C3C', fontSize: 12 }}>×</Text>
            </TouchableOpacity>
          </View>
        </V>
      ))}

      {participants.length < groupSize && (
        <View style={styles.addParticipantInput}>
          <TextInput
            style={styles.participantInputStyle}
            placeholder="Ім'я"
            value={newParticipantName}
            onChangeText={setNewParticipantName}
          />
          <TextInput
            style={styles.participantInputStyle}
            placeholder="Телефон"
            value={newParticipantPhone}
            onChangeText={setNewParticipantPhone}
          />
          <Button title="Додати учасника" onPress={addParticipant} />
        </V>
      )}

      {/* Continue to Confirm button */}
      <TouchableOpacity
        onPress={() => setGroupBookingStep('confirm')}
        style={styles.btnPrimary}
      >
        <Text style={styles.btnPrimaryText}>
          Далі: Підтвердити бронювання
        </Text>
      </TouchableOpacity>

      {participants.length < groupSize && (
        <Text style={styles.groupBookingNote}>
          Будь ласка, додайте {groupSize - participants.length} учасників
        </Text>
      )}
    </V>
  )}

  {groupBookingStep === 'confirm' && (
    <View style={styles.groupBookingConfirm}>
      <Text style={styles.groupSelectionTitle}>Підтвердити групу</Text>

      <View>
        <Text style={styles.participantName}>
          Група: {groupSize} учасників
        </Text>
        <Text style={styles.participantPhone}>
          Перший participation: {participants[0]?.name || 'не вибрано'}
        </Text>
      </V>

      <View style={styles.groupBookingNote}>
        Слот: {batchSlots?.[0]?.formattedTime || 'не вибрано'}
        | Барбер: {batchSlots?.[0]?.barberId || 'не вибрано'}
      </V>

      <TouchableOpacity
        onPress={createGroupBooking}
        style={styles.btnPrimary}
      >
        <Text style={styles.btnPrimaryText}>
          Створити групу бронювань
        </Text>
      </TouchableOpacity>

      {bookingError && (
        <View style={styles.alertBox}>
          <Text style={styles.alertText}>{bookingError}</Text>
        </V>
      )}

      {bookingSuccess && (
        <View style={styles.alertBoxSuccess}>
          <Text style={styles.alertText}>{bookingSuccess}</Text>
        </V>
      )}
    </V>
  )}

  {groupBookingStep === 'completed' && (
    <View style={styles.groupBookingCompleted}>
      <Text style={styles.groupSelectionTitle}>Бронювання завершено!</Text>
      <Text style={styles.groupBookingNote}>
        {bookingSuccess || 'Група успішно записана'}
      </Text>
      <Button title="Готово" onPress={onClose} />
    </V>
  )}

  {/* Waitlist Status */}
  {nextSlot && (
    <View style={styles.nextSlotCard}>
      <Text style={styles.nextSlotTitle}>Ваша позиція</Text>
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
      <Text style={styles.nextSlotService}>
        Час: {nextSlot.startTime || 'очікування'}
      </Text>
    </V>
  )}

  {/* Hold Timer (re-render with online status) */}
  {nextSlot && remainingSeconds !== undefined && (
    <View style={styles.holdTimer}>
      {remainingSeconds > 0 && (
        <View style={styles.timer}>
          <Text style={styles.timerText}>
            {remainingSeconds} сек до слотів
          </Text>
        </V>
      )}
      {remainingSeconds <= 0 && canAccept && (
        <View style={styles.acceptWindow}>
          <Text style={styles.acceptText}>
            Слот доступний! Будь ласка, підтвердіть у течение 15 хвилин.
          </Text>
        </V>
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
        </V>
      )}
    </V>
  )}

  {/* Notify me card */}
  {showNotifyMeCard && (
    <View style={styles.notificationCard}>
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationTitle}>
          Ми надішлемо.push-повідомлення, коли слот станеться доступним
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton} aria-label="Close waitlist screen">
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </V>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationText}>
          Ваше місце у черзіближче до слотів. Ми надішлемо.push-повідомлення,
          коли слот станеться доступним для підтвердження в течение 15 хвилин.
        </Text>
        <Text style={styles.notificationTimer}>
          Ost remaining: {remainingSeconds > 0 ? `${remainingSeconds} сек` : 'щойно'}
        </Text>
      </V>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          onPress={() => setShowNotifyMeCard(false)}
          style={styles.confirmButton}
        >
          <Text style={styles.confirmButtonText}>Дякуємо, ми прочистимо</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowNotifyMeCard(false)}
          style={styles.skipButton}
        >
          <Text style={styles.skipButtonText}>Підписатися на.push-повідомлення</Text>
        </TouchableOpacity>
      </V>
    </V>
  )}

  {/* Push notification status */}
  {showNotificationCard && (
    <View style={styles.pushStatus}>
      <Text style={styles.pushText}>
        Push-notifications:&nbsp;
        <Text style={styles.pushValue}>
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
          <Text style={styles.pushText}>Налаштувати.push-повідомлення</Text>
        </TouchableOpacity>
      )}
    </V>
  )}

  {/* Action Bar */}
  <View style={styles.actionBar}>
    <TouchableOpacity onPress={() => refetch?.()} style={styles.refreshButton}>
      <Text style={styles.refreshButtonText}>Оновити</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onClose} style={styles.closeBtn} aria-label="Close waitlist screen">
      <Text style={styles.closeBtnText}>Закрити</Text>
    </TouchableOpacity>
  </V>
};