import { StyleSheet } from 'react-native';
import { tokens } from '@fade/design-tokens';

// Тема профілю (T-4728b): усі кольори — з токенів застосунку, без hex-літералів
// і без `accent.blue` як заливки (docs/client-screens.md §5).
const COLOR = tokens.color;

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLOR.surface.base.value, padding: 16 },
  header: { gap: 4, marginBottom: 20 },
  title: { color: COLOR.text.primary.value, fontSize: 28, fontWeight: '700' },
  subtitle: { color: COLOR.text.secondary.value, fontSize: 15, lineHeight: 20 },
  alert: {
    backgroundColor: COLOR.surface.sunken.value,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  alertText: { color: COLOR.text.dangerText.value, fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: COLOR.surface.raised.value,
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  label: {
    color: COLOR.text.muted.value,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.1,
  },
  primaryButton: {
    color: COLOR.accent.onSolid.value,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLOR.accent.solid.value,
  },
  dangerButton: {
    color: COLOR.text.dangerText.value,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  input: {
    backgroundColor: COLOR.surface.sunken.value,
    color: COLOR.text.primary.value,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  errorText: { color: COLOR.text.dangerText.value, fontSize: 13 },
  visitCount: { color: COLOR.text.secondary.value, fontSize: 14 },
  phoneValue: { color: COLOR.text.primary.value, fontSize: 16 },
  namePrompt: { color: COLOR.text.secondary.value, fontSize: 15, lineHeight: 20 },
  successText: { color: COLOR.semantic.success.value, fontSize: 13 },
  buttonDisabled: { opacity: 0.5 },
  section: { marginBottom: 16 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  switchRowBordered: { borderBottomWidth: 1, borderBottomColor: COLOR.border.default.value },
  switchInfo: { flex: 1, gap: 2 },
  switchLabel: { color: COLOR.text.primary.value, fontSize: 15, fontWeight: '600' },
  switchDescription: { color: COLOR.text.secondary.value, fontSize: 13, lineHeight: 18 },
  primaryButtonText: {
    color: COLOR.accent.onSolid.value,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  deviceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLOR.border.default.value,
    paddingTop: 12,
    minHeight: 44,
  },
  deviceLink: { color: COLOR.accent.blue.value, fontSize: 15, fontWeight: '600' },
  deviceMeta: { color: COLOR.text.secondary.value, fontSize: 14 },
});
