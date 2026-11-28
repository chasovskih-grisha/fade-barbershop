import { Text, TextInput, View } from 'react-native';
import { MobileButton } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import { DayPicker, LocationChoices, Notice, ScheduleStatus } from './unavailability-parts';
import { markedDayText } from './marked-day-text';
import type { BarberUnavailabilityState } from './use-barber-unavailability';

// T-4616b: барбер лише передає факт «не вийду». Перенесення й скасування
// чужих візитів — адмінські дії (SCH-004), тож жодної такої кнопки тут немає.
export default function UnavailabilityBody({ state }: { state: BarberUnavailabilityState }) {
  if (state.signedOut) {
    return (
      <Notice
        testID="barber-schedule-signed-out"
        text="Увійдіть у застосунок, щоб позначити вихідний — графік привʼязаний до вашої сесії."
      />
    );
  }

  return (
    <>
      <View style={wipStyles.header}>
        <Text style={wipStyles.title}>МІЙ ГРАФІК</Text>
        <Text style={wipStyles.subtitle}>Не вийду — день стане вихідним</Text>
      </View>

      <ScheduleStatus
        loading={state.loading}
        failed={state.failed}
        locationsCount={state.locations.length}
      />

      <LocationChoices
        locations={state.locations}
        locationId={state.locationId}
        onSelect={state.selectLocation}
      />

      {!state.canEdit && state.locationId ? (
        <Notice
          testID="barber-schedule-read-only"
          text="Адміністратор не делегував вам керування графіком. Позначку може зробити він — тут графік лише для перегляду."
        />
      ) : null}

      <DayPicker days={state.days} day={state.day} onSelect={state.selectDay} />

      <TextInput
        testID="barber-unavailability-reason"
        style={wipStyles.input}
        placeholder="Причина (необовʼязково)"
        placeholderTextColor="#7A7A7A"
        value={state.reason}
        onChangeText={state.setReason}
      />

      <MobileButton
        testID="barber-unavailability-submit"
        title={state.markedConflicts === null ? 'Не вийду цього дня' : 'День уже позначено'}
        onPress={state.submit}
        disabled={!state.canEdit || !state.locationId || state.markedConflicts !== null}
        loading={state.busy}
      />

      {state.markedConflicts !== null ? (
        <Notice testID="barber-day-marked" text={markedDayText(state.markedConflicts)} />
      ) : null}

      {state.notice ? (
        <Notice testID="barber-unavailability-notice" text={state.notice} />
      ) : null}
    </>
  );
}
