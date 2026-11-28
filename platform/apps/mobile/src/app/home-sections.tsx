// Секції головної (T-4846): кожна сама обирає скелет, порожній рядок чи
// помилку з повтором зі свого стану, тож падіння однієї не змінює іншу.
import React from 'react';
import { Text, View } from 'react-native';
import { styles } from './index.styles';
import type { LocationDto } from '../lib/api/locations';
import type { ServiceDto } from '../lib/api/catalog';
import type { StartupSection } from '../lib/use-startup-data';
import { LocationCityGroups } from './location-city-groups';
import { homeServiceFact } from './home-service-facts';
import { HomeCardsSkeleton, HomeRowsSkeleton } from './home-skeletons';
import {
  LOCATIONS_EMPTY,
  LOCATIONS_FAILED,
  SERVICES_EMPTY,
  SERVICES_FAILED,
  SectionError,
} from './home-section-states';

export function LocationsSection({
  section,
  onRetry,
}: {
  section: StartupSection<LocationDto[]>;
  onRetry?: (() => void) | undefined;
}) {
  if (section.status === 'loading') return <HomeCardsSkeleton />;
  if (section.status === 'error')
    return <SectionError testID="locations-error" text={LOCATIONS_FAILED} onRetry={onRetry} />;
  if (section.data.length === 0)
    return (
      <Text testID="locations-empty" style={styles.cardMuted}>
        {LOCATIONS_EMPTY}
      </Text>
    );
  return <LocationCityGroups locations={section.data} />;
}

export function ServicesSection({
  section,
  onRetry,
}: {
  section: StartupSection<ServiceDto[]>;
  onRetry?: (() => void) | undefined;
}) {
  if (section.status === 'loading') return <HomeRowsSkeleton />;
  if (section.status === 'error')
    return <SectionError testID="services-error" text={SERVICES_FAILED} onRetry={onRetry} />;
  if (section.data.length === 0)
    return (
      <Text testID="services-empty" style={styles.cardMuted}>
        {SERVICES_EMPTY}
      </Text>
    );
  return (
    <>
      {section.data.map((srv) => {
        const fact = homeServiceFact(srv);
        return (
          <View key={fact.id} style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{fact.title}</Text>
              <Text style={styles.cardMuted}>{fact.duration}</Text>
            </View>
          </View>
        );
      })}
    </>
  );
}
