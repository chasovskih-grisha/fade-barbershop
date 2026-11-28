import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

// T-4835b: на телефоні корисна дія — віддати точку застосунку карт, який у
// людини вже є. Адреса лишається виділюваною (можна скопіювати), підпис
// містить лише координати з запису — без метро, парковки чи кави.

export function mapUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
}

export function LocationMapPin({
  address,
  lat,
  lng,
}: {
  address: string;
  lat: number;
  lng: number;
}) {
  const open = () => {
    void Linking.openURL(mapUrl(lat, lng)).catch(() => undefined);
  };

  return (
    <View style={{ marginTop: 12 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Відкрити ${address} у картах`}
        testID="studio-map-pin"
        onPress={open}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}
      >
        <Text>📍 {lat.toFixed(4)}, {lng.toFixed(4)}</Text>
        <Text>Відкрити в картах</Text>
      </Pressable>
    </View>
  );
}
