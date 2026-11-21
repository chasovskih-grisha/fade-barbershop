import { StyleSheet } from 'react-native';
import { tokens } from '@fade/design-tokens';

const COLOR = tokens.color;
const RADIUS = tokens.radius;
const SIZE = tokens.typography.fontSize;

/** Спільні стилі для екранів, що добудуються з WIP (без hex/px у самому екрані). */
export const wipStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLOR.surface.base.value },
  scroll: { flexGrow: 1 },
  content: { gap: 16, padding: 16, paddingBottom: 96 },
  header: { gap: 4 },
  title: { color: COLOR.text.primary.value, fontSize: SIZE.h3.value, fontWeight: '700' },
  subtitle: { color: COLOR.text.secondary.value, fontSize: SIZE.body.value },
  muted: { color: COLOR.text.muted.value, fontSize: SIZE.body.value },
  cardTitle: { color: COLOR.text.primary.value, fontSize: SIZE.h4.value, fontWeight: '600' },
  cardMuted: { color: COLOR.text.muted.value, fontSize: SIZE.caption.value },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLOR.surface.sunken.value,
    borderRadius: RADIUS.card.value,
    padding: 12,
    gap: 8,
  },
  rowBody: { flex: 1, gap: 2 },
  rowSelected: {
    borderWidth: 1,
    borderColor: COLOR.accent.solid.value,
    backgroundColor: COLOR.surface.raised.value,
  },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1,
    padding: 12,
    borderRadius: RADIUS.input.value,
    backgroundColor: COLOR.surface.sunken.value,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: COLOR.accent.solid.value },
  tabLabel: { color: COLOR.text.secondary.value, fontWeight: '600' },
  tabLabelActive: { color: COLOR.accent.onSolid.value, fontWeight: '600' },
  input: {
    backgroundColor: COLOR.surface.sunken.value,
    color: COLOR.text.primary.value,
    borderRadius: RADIUS.input.value,
    padding: 12,
  },
  banner: {
    backgroundColor: COLOR.surface.sunken.value,
    borderRadius: RADIUS.card.value,
    padding: 12,
  },
  bannerText: { color: COLOR.text.secondary.value, fontSize: SIZE.caption.value },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: RADIUS.pill.value,
    backgroundColor: COLOR.semantic.success.value,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabLabel: { color: COLOR.surface.base.value, fontSize: SIZE.h3.value, fontWeight: '700' },
  metric: { flex: 1, gap: 2 },
  metricValue: { color: COLOR.text.primary.value, fontSize: SIZE.h4.value, fontWeight: '700' },
});
