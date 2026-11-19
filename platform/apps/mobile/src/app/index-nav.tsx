import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { styles } from './index.styles';

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
  const itemStyle = (active: boolean) => (active ? styles.navItemActive : styles.navItem);
  return (
    <View style={styles.navBar}>
      <Pressable onPress={onHome} accessibilityRole="button">
        <Text style={itemStyle(activeTab === 'home')}>Головна</Text>
      </Pressable>
      {signedIn ? (
        <Pressable
          onPress={onAccount}
          accessibilityRole="button"
          accessibilityLabel={sessionName ? `Кабінет, ${sessionName}` : 'Кабінет'}
        >
          <Text style={styles.navItem}>Кабінет</Text>
        </Pressable>
      ) : (
        <Pressable onPress={onLogin} accessibilityRole="button">
          <Text style={itemStyle(activeTab === 'login')}>Вхід</Text>
        </Pressable>
      )}
      <Pressable onPress={onVisits} accessibilityRole="button">
        <Text style={styles.navItem}>Мої візити</Text>
      </Pressable>
    </View>
  );
}
