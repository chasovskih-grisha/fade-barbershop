import { StyleSheet } from 'react-native';
import { tokens } from '@fade/design-tokens';

// Стилі питання про незбережені зміни (T-4733c): кольори з токенів, без hex.
const COLOR = tokens.color;

const dialogStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLOR.surface.sunken.value,
  },
  dialog: {
    backgroundColor: COLOR.surface.raised.value,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: { color: COLOR.text.primary.value, fontSize: 20, fontWeight: '700' },
  description: { color: COLOR.text.secondary.value, fontSize: 15, lineHeight: 20 },
  actions: { gap: 8, marginTop: 4 },
  primary: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR.accent.solid.value,
  },
  primaryText: { color: COLOR.accent.onSolid.value, fontSize: 15, fontWeight: '600' },
  secondary: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR.surface.sunken.value,
  },
  secondaryText: { color: COLOR.text.primary.value, fontSize: 15, fontWeight: '600' },
  ghost: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  ghostText: { color: COLOR.text.secondary.value, fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});

export { dialogStyles as dialog };
