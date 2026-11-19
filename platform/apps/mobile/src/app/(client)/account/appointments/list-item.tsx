import React from 'react';
import { View, Text } from 'react-native';
import type { ExtendedAppointment } from '../../../../lib/booking-contract';
import { ReferenceThumbnail } from './reference-thumbnail';
import { ReferenceEditForm } from './reference-edit-form';
import type { ReferenceEdit } from './use-reference-editor';
import { styles } from './list-item-styles';
import { visitStatusBadge } from './visit-status';
import { BookAgainAction } from './book-again-action';
import { UpcomingActions } from './upcoming-actions';

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
  onBookAgain?: (params: Record<string, string>) => void;
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
  onBookAgain,
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

      {isUpcoming ? (
        <UpcomingActions
          app={app}
          busy={busy}
          onReschedule={onReschedule}
          onCancelVisit={onCancelVisit}
        />
      ) : null}

      {app.status === 'completed' && app.canBookAgain && onBookAgain ? (
        <BookAgainAction app={app} onBook={onBookAgain} />
      ) : null}
    </View>
  );
}
