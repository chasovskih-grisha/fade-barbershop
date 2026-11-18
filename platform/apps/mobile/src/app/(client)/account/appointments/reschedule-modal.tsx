/* eslint-disable max-lines */
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { tokens } from '@fade/design-tokens';
import type { ExtendedAppointment } from '../../../../lib/booking-contract';
import { rescheduleSlot } from './visit-time';

export interface RescheduleModalProps {
  visit: ExtendedAppointment | null;
  visible: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (when: { date: string; start: string; end: string }) => void;
}

export function RescheduleModal({
  visit,
  visible,
  busy,
  error,
  onClose,
  onConfirm,
}: RescheduleModalProps) {
  const [date, setDate] = useState(visit?.date ?? '');
  const [start, setStart] = useState(visit?.startTime ?? '');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (visit) {
      setDate(visit.date);
      setStart(visit.startTime);
      setLocalError(null);
    }
  }, [visit]);

  if (!visible || !visit) return null;

  const submit = () => {
    try {
      const when = rescheduleSlot(visit, date, start);
      onConfirm(when);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Не вдалося перенести');
    }
  };

  return (
    <View style={styles.overlay} testID="reschedule-modal">
      <View style={styles.modal}>
        <Text style={styles.title}>Перенести запис</Text>
        <Text style={styles.subtitle}>
          Оберіть новий час для послуги {visit.serviceName} у майстра {visit.barberName}.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Дата</Text>
          <TextInput
            testID="reschedule-date-input"
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Початок</Text>
          <TextInput
            testID="reschedule-start-input"
            style={styles.input}
            value={start}
            onChangeText={setStart}
            placeholder="HH:MM"
          />
        </View>

        {localError || error ? (
          <Text style={styles.errorText}>{localError ?? error}</Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            style={[styles.button, styles.secondaryButton]}
            onPress={onClose}
            disabled={busy}
          >
            <Text style={styles.secondaryButtonText}>Закрити</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[styles.button, styles.primaryButton]}
            onPress={submit}
            disabled={busy}
            testID="reschedule-confirm-button"
          >
            <Text style={styles.primaryButtonText}>
              {busy ? 'Перенесення...' : 'Перенести'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 100,
  },
  modal: {
    backgroundColor: tokens.color.surface.base.value,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.color.text.primary.value,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: tokens.color.text.secondary.value,
    marginBottom: 16,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.color.text.muted.value,
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: tokens.color.border.value,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: tokens.color.text.primary.value,
    backgroundColor: tokens.color.surface.sunken.value,
  },
  errorText: {
    color: tokens.color.accent.destructive?.value ?? '#ef4444',
    fontSize: 13,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: tokens.color.surface.sunken.value,
  },
  secondaryButtonText: {
    color: tokens.color.text.primary.value,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: tokens.color.accent.solid.value,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
