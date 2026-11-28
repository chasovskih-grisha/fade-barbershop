import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from './index.styles';
import { LocationDto } from '../lib/api/locations';
import { LocationChairLine } from '../components/LocationChairLine';

// T-4821b: список локацій у застосунку групується за `addressParts.city`,
// у порядку відповіді API. Локації без міста — один хвіст без підпису: місто
// не вигадуємо ні з коду, ні з «Києва».

// T-4843: маршрут студії живе в одному місці, щоб картка й тест не тримали
// власну копію рядка.
export function locationHref(code: string): string {
  return `/(client)/locations/${encodeURIComponent(code)}`;
}

export interface CityGroup {
  city: string | null;
  locations: LocationDto[];
}

export function groupByCity(locations: LocationDto[]): CityGroup[] {
  const named: CityGroup[] = [];
  const unknown: LocationDto[] = [];

  for (const location of locations) {
    const city = location.addressParts?.city?.trim() || null;
    if (!city) {
      unknown.push(location);
      continue;
    }
    const group = named.find((item) => item.city === city);
    if (group) group.locations.push(location);
    else named.push({ city, locations: [location] });
  }

  return unknown.length > 0 ? [...named, { city: null, locations: unknown }] : named;
}

export function LocationCityGroups({ locations }: { locations: LocationDto[] }) {
  const router = useRouter();

  return (
    <>
      {groupByCity(locations).map((group) => (
        <View key={group.city ?? 'unknown'} testID={`city-group-${group.city ?? 'unknown'}`}>
          {group.city ? <Text style={styles.cityTitle}>{group.city}</Text> : null}
          {group.locations.map((loc) => (
            <Pressable
              key={loc.id}
              accessibilityRole="button"
              accessibilityLabel={loc.name}
              testID={`location-card-${loc.code}`}
              style={styles.row}
              onPress={() => router.push(locationHref(loc.code))}
            >
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{loc.name}</Text>
                <Text style={styles.cardMuted}>{loc.address}</Text>
                <LocationChairLine chairs={loc.chairs} />
              </View>
            </Pressable>
          ))}
        </View>
      ))}
    </>
  );
}
