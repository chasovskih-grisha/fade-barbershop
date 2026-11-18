import { StyleSheet } from 'react-native';
import { tokens } from '@fade/design-tokens';

const COLOR = tokens.color;
const RADIUS = tokens.radius;

export const styles = StyleSheet.create({
  button: {
    backgroundColor: COLOR.accent.solid.value,
    padding: 14,
    borderRadius: RADIUS.input.value,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: COLOR.accent.onSolid.value, fontWeight: '600' },
  card: { backgroundColor: COLOR.surface.raised.value, padding: 16, borderRadius: 12, marginVertical: 8 },
  skeleton: { backgroundColor: COLOR.surface.sunken.value, padding: 20, borderRadius: 8, alignItems: 'center' },
  skeletonText: { color: COLOR.text.muted.value },
  empty: { padding: 30, alignItems: 'center' },
  emptyText: { color: COLOR.text.muted.value, textAlign: 'center' },
  field: { marginVertical: 8 },
  label: { color: COLOR.text.primary.value, marginBottom: 4, fontSize: 14 },
  error: { color: COLOR.text.dangerText.value, fontSize: 12, marginTop: 4 },
  input: { backgroundColor: COLOR.surface.sunken.value, color: COLOR.text.primary.value, padding: 12, borderRadius: 8 },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLOR.surface.raised.value, padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  closeText: { color: COLOR.text.muted.value, textAlign: 'right', marginBottom: 10 },
  toast: { backgroundColor: COLOR.surface.raised.value, padding: 12, borderRadius: 8, marginVertical: 4 },
  toastText: { color: COLOR.text.primary.value },
  slotContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  slot: { padding: 12, backgroundColor: COLOR.surface.sunken.value, borderRadius: 8, minWidth: 70, alignItems: 'center' },
  slotSelected: { backgroundColor: COLOR.accent.solid.value },
  slotDisabled: { opacity: 0.3 },
  slotText: { color: COLOR.text.primary.value },
  priceContainer: { backgroundColor: COLOR.surface.raised.value, padding: 16, borderRadius: 12, marginVertical: 8 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  priceLabel: { color: COLOR.text.secondary.value },
  priceVal: { color: COLOR.text.primary.value },
  totalRow: { borderTopWidth: 1, borderTopColor: COLOR.border.default.value, marginTop: 8, paddingTop: 8 },
  totalLabel: { color: COLOR.text.primary.value, fontWeight: 'bold' },
  totalVal: { color: COLOR.text.primary.value, fontWeight: 'bold' },
});
