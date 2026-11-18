import { StyleSheet } from 'react-native';
import { tokens } from '@fade/design-tokens';

// Тема рядка візиту (T-4739b): усі кольори — з токенів застосунку, без hex.
const COLOR = tokens.color;

export const styles = StyleSheet.create({
  root: {
    backgroundColor: COLOR.surface.base.value,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 8,
    shadowColor: COLOR.surface.sunken.value,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLOR.text.primary.value,
  },
  statusContainer: {
    width: 64,
    height: 24,
    borderRadius: 999,
    backgroundColor: COLOR.surface.raised.value,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    color: COLOR.text.muted.value,
  },
  bodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  service: {
    fontSize: 16,
    fontWeight: '600',
    color: COLOR.text.primary.value,
  },
  muted: {
    fontSize: 14,
    color: COLOR.text.secondary.value,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: COLOR.semantic.info.value,
    textAlign: 'right',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLOR.border.default.value,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rescheduleButton: {
    backgroundColor: COLOR.interactive.default.value,
  },
  rescheduleButtonText: {
    color: COLOR.text.primary.value,
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: COLOR.text.dangerText.value,
    fontWeight: '600',
    fontSize: 14,
  },
});
