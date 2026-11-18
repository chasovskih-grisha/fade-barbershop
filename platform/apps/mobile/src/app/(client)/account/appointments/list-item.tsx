import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ExtendedAppointment } from '../../../../lib/booking-contract';
import { ReferenceThumbnail } from './reference-thumbnail';
import { ReferenceEditForm } from './reference-edit-form';
import type { ReferenceEdit } from './use-reference-editor';
import { styles } from './list-item-styles';
import { visitStatusBadge } from './visit-status';

export interface AppointmentRowProps {
  app: ExtendedAppointment;
  editing: boolean;
  busy: boolean;
  error: string | null;
  onEditReference: (app: ExtendedAppointment) => void;
  onCancelEdit: () => void;
  onSaveReference: (app: ExtendedAppointment, edit: ReferenceEdit) => void;
  onReschedule?: (app: ExtendedAppointment) => void;
  onCancelVisit?: (app: ExtendedAppointment) => void;
}

export function AppointmentRow({
  app,
  editing,
  busy,
  error,
  onEditReference,
  onCancelEdit,
  onSaveReference,
  onReschedule,
  onCancelVisit,
}: AppointmentRowProps) {
  const isUpcoming = app.status === 'upcoming' || app.status === 'confirmed';
  const badge = visitStatusBadge(app.status);

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>
            {app.date} о {app.startTime}
          </Text>
          <Text style={styles.muted}>{app.locationName}</Text>
        </View>
        <View style={styles.statusContainer}>
          <Text style={[styles.status, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      <View style={styles.bodyRow}>
        <View>
          <Text style={styles.service}>{app.serviceName}</Text>
          <Text style={styles.muted}>{app.barberName}</Text>
        </View>
        <Text style={styles.price}>{app.price}</Text>
      </View>

      <ReferenceThumbnail app={app} editing={editing} onEditReference={onEditReference} />

      {editing ? (
        <ReferenceEditForm
          app={app}
          busy={busy}
          error={error}
          onCancel={onCancelEdit}
          onSave={(edit) => onSaveReference(app, edit)}
        />
      ) : null}

      {isUpcoming && (onReschedule || onCancelVisit) ? (
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
      ) : null}
    </View>
  );
}
