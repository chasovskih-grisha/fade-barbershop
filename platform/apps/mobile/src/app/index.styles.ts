import { StyleSheet } from 'react-native';
import { tokens } from '@fade/design-tokens';

const COLOR = tokens.color;
const RADIUS = tokens.radius;
const SIZE = tokens.typography.fontSize;

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLOR.surface.base.value },
  content: { gap: 16, padding: 16, paddingBottom: 40 },
  brand: { color: COLOR.text.primary.value, fontSize: SIZE.h4.value, fontWeight: '700' },
  hero: { color: COLOR.text.primary.value, fontSize: SIZE.h2.value, fontWeight: '700' },
  heroSub: { color: COLOR.text.secondary.value, fontSize: SIZE.bodyLg.value },
  card: {
    backgroundColor: COLOR.surface.raised.value,
    borderRadius: RADIUS.card.value,
    padding: 16,
    gap: 4,
  },
  cardLabel: { color: COLOR.text.muted.value, fontSize: SIZE.caption.value },
  cardTitle: { color: COLOR.text.primary.value, fontSize: SIZE.bodyLg.value, fontWeight: '600' },
  cardMuted: { color: COLOR.text.muted.value, fontSize: SIZE.body.value },
  cta: {
    backgroundColor: COLOR.accent.solid.value,
    borderRadius: RADIUS.input.value,
    padding: 16,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.5 },
  ctaLabel: { color: COLOR.accent.onSolid.value, fontSize: SIZE.bodyLg.value, fontWeight: '600' },
  sectionTitle: { color: COLOR.text.primary.value, fontSize: SIZE.h4.value, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLOR.surface.sunken.value,
    borderRadius: RADIUS.card.value,
    padding: 16,
  },
  rowBody: { gap: 2 },
  rowTitle: { color: COLOR.text.primary.value, fontSize: SIZE.bodyLg.value, fontWeight: '600' },
  rowPrice: { color: COLOR.text.primary.value, fontSize: SIZE.bodyLg.value },
  navAnchor: { marginTop: 8 },
  offlineBanner: {
    backgroundColor: COLOR.surface.sunken.value,
    borderRadius: RADIUS.card.value,
    padding: 12,
  },
  offlineText: { color: COLOR.text.secondary.value, fontSize: SIZE.caption.value },
  navCta: {
    backgroundColor: COLOR.surface.sunken.value,
    borderRadius: RADIUS.input.value,
  },
  navBar: { flexDirection: 'row', justifyContent: 'space-around', padding: 10 },
  navItem: { color: COLOR.text.muted.value },
  navItemActive: { color: COLOR.text.primary.value },
  loginInput: {
    backgroundColor: COLOR.surface.raised.value,
    color: COLOR.text.primary.value,
    padding: 12,
    borderRadius: RADIUS.input.value,
    marginVertical: 10,
  },
});

/** Колір спінера/індикатора на accent-заливці (ActivityIndicator бере рядок, не стиль). */
export const SPINNER_COLOR = COLOR.accent.onSolid.value;
