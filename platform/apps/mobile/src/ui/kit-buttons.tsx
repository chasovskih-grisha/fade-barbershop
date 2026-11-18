import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { tokens } from '@fade/design-tokens';
import { styles } from './kit-styles';

export function MobileButton({ title, onPress, disabled, loading, testID }: { title: string; onPress: () => void; disabled?: boolean; loading?: boolean; testID?: string }) {
  return (
    <Pressable
      testID={testID}
      disabled={disabled || loading}
      onPress={onPress}
      style={[styles.button, (disabled || loading) && styles.buttonDisabled]}
    >
      {loading ? (
        <ActivityIndicator testID="submit-spinner" color={tokens.color.accent.onSolid.value} />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </Pressable>
  );
}

export function MobileCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function MobileSkeleton({ testID }: { testID?: string }) {
  return (
    <View testID={testID || "loading-skeleton"} style={styles.skeleton}>
      <Text style={styles.skeletonText}>Завантаження...</Text>
    </View>
  );
}

export function MobileEmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

export function MobileToast({ message }: { message: string }) {
  return (
    <View testID="mobile-toast" style={styles.toast}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}
