import { Text, View } from 'react-native';
import type { ReactNode } from 'react';
import type { ExtendedAppointment } from '../../../../lib/booking-contract';
import { StatusFilterChips, type StatusFilter } from './status-filter';
import { styles as appointmentsStyles } from './page-styles';

export function VisitsBody(props: {
  error: string | null;
  loading: boolean;
  statusFilter: StatusFilter;
  onFilter: (value: StatusFilter) => void;
  onRetry: () => void;
  onBook: () => void;
  upcoming: ExtendedAppointment[];
  past: ExtendedAppointment[];
  total: number;
  row: (app: ExtendedAppointment) => ReactNode;
}) {
  const { error, loading, upcoming, past, total, row } = props;
  return (
    <View style={appointmentsStyles.screen}>
      {error ? (
        <View style={appointmentsStyles.alertBanner}>
          <Text style={appointmentsStyles.alertTitle}>{error}</Text>
          <Text style={appointmentsStyles.alertAction} onPress={props.onRetry}>
            Повторити
          </Text>
        </View>
      ) : null}
      <View style={appointmentsStyles.header}>
        <Text style={appointmentsStyles.title}>Мої візити</Text>
        <Text style={appointmentsStyles.subtitle}>Записуйте і переглядайте заплановане</Text>
      </View>
      {loading ? (
        <View style={appointmentsStyles.skeleton}>
          <View style={appointmentsStyles.skeletonRow} />
          <View style={appointmentsStyles.skeletonRow} />
        </View>
      ) : (
        <StatusFilterChips value={props.statusFilter} onChange={props.onFilter} />
      )}
      {loading ? null : upcoming.length > 0 || past.length > 0 ? (
        <View style={appointmentsStyles.list}>
          {upcoming.length > 0 ? (
            <>
              <Text style={appointmentsStyles.sectionTitle}>Майбутні</Text>
              {upcoming.map(row)}
            </>
          ) : null}
          {past.length > 0 ? (
            <>
              <Text style={appointmentsStyles.sectionTitle}>Минулі</Text>
              {past.map(row)}
            </>
          ) : null}
        </View>
      ) : total === 0 ? (
        <View style={appointmentsStyles.empty}>
          <Text style={appointmentsStyles.emptyTitle}>У вас немає візитів</Text>
          <Text style={appointmentsStyles.emptyDesc}>Запишіться на наступний візит.</Text>
          <Text style={appointmentsStyles.emptyAction} onPress={props.onBook}>
            Записатися
          </Text>
        </View>
      ) : (
        <View style={appointmentsStyles.empty}>
          <Text style={appointmentsStyles.emptyTitle}>Нічого не знайдено</Text>
          <Text style={appointmentsStyles.emptyDesc}>
            За обраним статусом візитів немає — змініть фільтр.
          </Text>
        </View>
      )}
    </View>
  );
}
