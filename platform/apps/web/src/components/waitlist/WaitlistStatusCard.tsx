// Waitlist Status Card — T-171: Waitlist Surfaces.

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

interface WaitlistStatusCardProps {
  visible: boolean;
  onClose: () => void;
}

export const WaitlistStatusCard: React.FC<WaitlistStatusCardProps> = ({ visible, onClose }) => {
  const [holdMinutes, setHoldMinutes] = useState(15);
  const [missedCount, setMissedCount] = useState(0);
  const [canAccept, setCanAccept] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHoldMinutes(0);
      setCanAccept(true);
    }, holdMinutes * 60 * 1000);
    return () => clearTimeout(timer);
  }, [holdMinutes]);

  const acceptSlot = () => {
    Alert.alert('Slot Accepted', 'Your slot has been accepted');
    onClose();
  };

  const pauseQueue = () => {
    setMissedCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 3) {
        Alert.alert(
          'Queue Paused',
          '3 misses - queue paused for 30 days',
          [{ text: 'OK' }]
        );
        return 3;
      }
      setMissedCount(newCount);
      return newCount;
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.hold}>
        <Text style={styles.holdText}>
          Hold time: {holdMinutes} min remaining
        </Text>
      </View>
      {canAccept && (
        <View style={styles.accept}>
          <Text style={styles.acceptText}>
            Slot available - tap to accept
          </Text>
        </View>
      )}
      {!canAccept && !holdMinutes && (
        <View style={styles.info}>
          <Text style={styles.infoText}>
            Queue active - offers will appear shortly
          </Text>
        </View>
      )}
      {!canAccept && holdMinutes && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={acceptSlot} style={styles.btn}>
            <Text style={styles.btnText}>Accept Slot</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pauseQueue} style={styles.btn}>
            <Text style={styles.btnText}>
              {missedCount > 0 ? `Missed: ${missedCount}/3` : 'Skip Offer'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  hold: {
    backgroundColor: '#ECF0F1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  holdText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  accept: {
    backgroundColor: '#27AE60',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  acceptText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  info: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
  },
  infoText: {
    fontSize: 14,
    color: '#5D6D7E',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  btn: {
    padding: 8,
    borderRadius: 6,
  },
  btnText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  }
});

export default WaitlistStatusCard;