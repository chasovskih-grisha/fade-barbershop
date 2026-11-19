import { StyleSheet } from 'react-native';
import { tokens } from '@fade/design-tokens';

// Дія «Записатися знову» на завершеному візиті (T-4617b): кольори — токени.
const COLOR = tokens.color;

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLOR.border.default.value,
    paddingTop: 12,
  },
  button: {
    minHeight: 44,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR.interactive.default.value,
  },
  buttonText: {
    color: COLOR.text.primary.value,
    fontWeight: '600',
    fontSize: 14,
  },
  notice: {
    flex: 1,
    fontSize: 14,
    color: COLOR.text.muted.value,
  },
});
