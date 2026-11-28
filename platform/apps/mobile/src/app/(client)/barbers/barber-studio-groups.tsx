import React from 'react';
import { Text, View } from 'react-native';
import type { StudioRoster } from '../../../lib/api/studio-roster';
import { BarberCard } from '../../../components/BarberCard';
import { styles } from '../../index.styles';
import { BarberDirectoryEmpty } from './barber-directory-states';

/** Групи довідника: заголовок студії, під ним її люди (T-4852b). */
export function BarberStudioGroups({
  studios,
  onOpen,
}: {
  studios: StudioRoster[];
  onOpen: (id: string) => void;
}) {
  if (studios.length === 0) return <BarberDirectoryEmpty />;

  return (
    <View style={{ marginTop: 16, gap: 16 }}>
      {studios.map((studio) => (
        <View key={studio.code}>
          <Text style={styles.sectionTitle} testID={`studio-${studio.code}`}>
            {studio.name}
          </Text>
          {studio.barbers.map((barber) => (
            <BarberCard key={barber.id} barber={barber} onPress={() => onOpen(barber.id)} />
          ))}
        </View>
      ))}
    </View>
  );
}
