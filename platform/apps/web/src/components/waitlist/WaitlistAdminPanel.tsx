// Waitlist Admin Panel — T-171: Waitlist Surfaces.

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';

interface WaitlistAdminPanelProps {
  visible: boolean;
  onClose: () => void;
}

export const WaitlistAdminPanel: React.FC<WaitlistAdminPanelProps> = ({ visible, onClose }) => {
  const [configs, setConfigs] = useState([
    { id: '1', name: 'Default', activeCount: 5, paused: false, bookNow: false },
    { id: '2', name: 'Franchise', activeCount: 12, paused: false, bookNow: true },
  ]);
  const [efficiency, setEfficiency] = useState({ efficiency: 78, totalSlots: 150, filledSlots: 117, avgWaitTime: '4.2 min' });
  const [bookingNowEnabled, setBookingNowEnabledState] = useState(false);

  useEffect(() => {
    const loadData = () => {
      setConfigs([
        { id: '1', name: 'Default', activeCount: 5, paused: false, bookNow: false },
        { id: '2', name: 'Franchise', activeCount: 12, paused: false, bookNow: true },
      ]);
      setEfficiency({ efficiency: 78, totalSlots: 150, filledSlots: 117, avgWaitTime: '4.2 min' });
    };
    loadData();
  }, []);

  const togglePause = (configId: string) => {
    Alert.alert('Paused', `Queue ${configId} paused`);
  };

  const resumeQueue = (configId: string) => {
    Alert.alert('Resumed', `Queue ${configId} resumed`);
  };

  const toggleBookingNow = () => {
    setBookingNowEnabledState(!bookingNowEnabledState);
    Alert.alert('Setting', `Book now ${!bookingNowEnabledState ? 'disabled' : 'enabled'}`);
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Waitlist Admin</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Queue Configs</Text>
        {configs.map((c: any) => (
          <View key={c.id} style={styles.configItem}>
            <Text style={styles.configName}>{c.name}</Text>
            <Text style={styles.configStatus}>{c.paused ? 'Paused' : 'Active'}</Text>
            {c.bookNow && <Text style={styles.bookNow}>Book now</Text>}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Efficiency</Text>
        <Text style={styles.metric}>
          {Math.round(efficiency.efficiency)}% efficiency
          {efficiency.filledSlots}/{efficiency.totalSlots} slots
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Controls</Text>
        <TouchableOpacity onPress={togglePause.bind(this, 'all')} style={styles.btn}>
          <Text style={styles.btnText}>Pause All</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={resumeQueue.bind(this, 'all')} style={styles.btn}>
          <Text style={styles.btnText}>Resume All</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleBookingNow} style={styles.btn}>
          <Text style={styles.btnText}>
            {bookingNowEnabledState ? 'Disable Book Now' : 'Enable Book Now'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Metrics</Text>
        <Text style={styles.metric}>Waitlist Efficiency: {Math.round(efficiency.efficiency)}%</Text>
        <Text style={styles.metric}>Avg Wait: {efficiency.avgWaitTime}</Text>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={onClose} style={styles.bottomButton}>
          <Text style={styles.bottomButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    color: '#7F8C8D',
    fontSize: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  configItem: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  configName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
  },
  configStatus: {
    color: '#E74C3C',
    fontSize: 12,
    marginLeft: 8,
  },
  bookNow: {
    backgroundColor: '#27AE60',
    padding: 4,
    borderRadius: 4,
    marginLeft: 4,
    color: '#fff',
    fontSize: 10,
  },
  metric: {
    fontSize: 14,
    marginBottom: 8,
  },
  btn: {
    padding: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  btnText: {
    color: '#fff',
    fontSize: 12,
  },
  bottomBar: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  bottomButton: {
    backgroundColor: '#34495E',
    padding: 10,
    borderRadius: 6,
  },
  bottomButtonText: {
    color: '#fff',
    fontSize: 14,
  }
});

export default WaitlistAdminPanel;