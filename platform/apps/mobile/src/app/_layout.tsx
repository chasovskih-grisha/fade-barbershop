import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#121212' },
          headerTintColor: '#ffffff',
          contentStyle: { backgroundColor: '#0F0F11' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Barbershop' }} />
        <Stack.Screen name="(client)/account/appointments" options={{ title: 'Мої візити' }} />
        <Stack.Screen name="(client)/account/devices" options={{ title: 'Пристрої' }} />
        <Stack.Screen name="(client)/account/profile" options={{ title: 'Профіль' }} />
        <Stack.Screen name="(client)/barber-schedule" options={{ title: 'Мій графік' }} />
      </Stack>
    </ErrorBoundary>
  );
}
