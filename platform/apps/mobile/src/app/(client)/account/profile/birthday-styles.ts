import { StyleSheet } from 'react-native';
import { tokens } from '@fade/design-tokens';

// Стилі картки дня народження (T-4730c): кольори з токенів застосунку, без hex.
const COLOR = tokens.color;

export const styles = StyleSheet.create({
  card: {
    backgroundColor: COLOR.surface.raised.value,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  label: {
    color: COLOR.text.muted.value,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.1,
  },
  value: { color: COLOR.text.primary.value, fontSize: 16 },
  pickerLabel: { color: COLOR.text.secondary.value, fontSize: 13, marginTop: 4 },
  row: { gap: 8, paddingVertical: 2 },
  chip: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR.surface.sunken.value,
  },
  chipSelected: { backgroundColor: COLOR.accent.solid.value },
  chipLabel: { color: COLOR.text.primary.value, fontSize: 14 },
  chipLabelSelected: { color: COLOR.accent.onSolid.value, fontWeight: '600' },
  errorText: { color: COLOR.text.dangerText.value, fontSize: 13 },
  primaryButton: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR.accent.solid.value,
  },
  buttonText: { color: COLOR.accent.onSolid.value, fontSize: 15, fontWeight: '600' },
  clearButton: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  clearText: { color: COLOR.text.dangerText.value, fontSize: 15, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
});
