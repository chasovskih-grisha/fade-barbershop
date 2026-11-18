import React from 'react';
import { View, Text, Pressable } from 'react-native';

export function IndexNav({
  activeTab,
  signedIn,
  sessionName,
  onHome,
  onLogin,
  onAccount,
  onVisits,
}: {
  activeTab: 'home' | 'login';
  signedIn: boolean;
  sessionName: string | undefined;
  onHome: () => void;
  onLogin: () => void;
  onAccount: () => void;
  onVisits: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 10 }}>
      <Pressable onPress={onHome} accessibilityRole="button">
        <Text style={{ color: activeTab === 'home' ? '#fff' : '#888' }}>Головна</Text>
      </Pressable>
      {signedIn ? (
        <Pressable
          onPress={onAccount}
          accessibilityRole="button"
          accessibilityLabel={sessionName ? `Кабінет, ${sessionName}` : 'Кабінет'}
        >
          <Text style={{ color: '#888' }}>Кабінет</Text>
        </Pressable>
      ) : (
        <Pressable onPress={onLogin} accessibilityRole="button">
          <Text style={{ color: activeTab === 'login' ? '#fff' : '#888' }}>Вхід</Text>
        </Pressable>
      )}
      <Pressable onPress={onVisits} accessibilityRole="button">
        <Text style={{ color: '#888' }}>Мої візити</Text>
      </Pressable>
    </View>
  );
}
