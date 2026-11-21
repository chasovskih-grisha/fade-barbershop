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
  tokenRow: { gap: 4 },
  tokenMuted: { color: COLOR.text.muted.value, fontSize: 13 },
  token: { color: COLOR.text.secondary.value, fontSize: 13, fontFamily: 'monospace' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { color: COLOR.text.muted.value, fontSize: 14 },
  statusBadge: { fontSize: 14, fontWeight: '600' },
  statusAllowed: { color: COLOR.semantic.success.value },
  statusDenied: { color: COLOR.text.dangerHoverText.value },
  actions: { marginTop: 16 },
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
  hint: {
    color: COLOR.text.muted.value,
    fontSize: 13,
    marginTop: 18,
    textAlign: 'center',
    lineHeight: 18,
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
  successText: { color: COLOR.semantic.success.value, fontSize: 13 },
  buttonDisabled: { opacity: 0.5 },
});
