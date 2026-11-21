/* eslint-disable max-lines */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { tokens } from '@fade/design-tokens';
import type { ExtendedAppointment } from '../../../../lib/booking-contract';

export interface CancelModalProps {
  visit: ExtendedAppointment | null;
  visible: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelModal({ visit, visible, busy, error, onClose, onConfirm }: CancelModalProps) {
  if (!visible || !visit) return null;

  return (
    <View style={styles.overlay} testID="cancel-modal">
      <View style={styles.modal}>
        <Text style={styles.title}>Скасувати запис</Text>
        <Text style={styles.subtitle}>
          Ви впевнені, що хочете скасувати запис на {visit.date} о {visit.startTime}?
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            style={[styles.button, styles.secondaryButton]}
            onPress={onClose}
            disabled={busy}
          >
            <Text style={styles.secondaryButtonText}>Залишити запис</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[styles.button, styles.destructiveButton]}
            onPress={onConfirm}
            disabled={busy}
          >
            <Text style={styles.destructiveButtonText}>
              {busy ? 'Скасування...' : 'Скасувати запис'}
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
  destructiveButton: {
    backgroundColor: tokens.color.accent.destructive?.value ?? '#ef4444',
  },
  destructiveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
