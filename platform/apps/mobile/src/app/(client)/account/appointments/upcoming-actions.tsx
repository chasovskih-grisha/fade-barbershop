import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ExtendedAppointment } from '../../../../lib/booking-contract';
import { styles } from './list-item-styles';

/** «Перенести» і «Скасувати» для майбутнього візиту; кнопки, яких не дали, не малюються. */
export function UpcomingActions({
  app,
  busy,
  onReschedule,
  onCancelVisit,
}: {
  app: ExtendedAppointment;
  busy: boolean;
  onReschedule?: ((app: ExtendedAppointment) => void) | undefined;
  onCancelVisit?: ((app: ExtendedAppointment) => void) | undefined;
}) {
  if (!onReschedule && !onCancelVisit) return null;

  return (
    <View style={styles.actionsRow}>
      {onReschedule ? (
        <Pressable
          accessibilityRole="button"
          style={[styles.actionButton, styles.rescheduleButton]}
          onPress={() => onReschedule(app)}
          disabled={busy}
        >
          <Text style={styles.rescheduleButtonText}>Перенести</Text>
        </Pressable>
      ) : null}
      {onCancelVisit ? (
        <Pressable
          accessibilityRole="button"
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => onCancelVisit(app)}
          disabled={busy}
        >
          <Text style={styles.cancelButtonText}>Скасувати</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
