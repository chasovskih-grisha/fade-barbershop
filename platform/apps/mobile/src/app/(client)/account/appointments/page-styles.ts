import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111318',
  },
  alertBanner: {
    backgroundColor: '#3A2A2A',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3A2A2A',
    gap: 8,
  },
  alertTitle: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '600',
  },
  alertAction: {
    color: '#93C5FD',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 6,
  },
  title: {
    color: '#F4F4F6',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9CA0A8',
    fontSize: 14,
    fontWeight: '500',
  },
  skeleton: {
    gap: 12,
  },
  skeletonRow: {
    height: 90,
    backgroundColor: '#1A1D23',
    borderRadius: 12,
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionTitle: {
    color: '#9CA0A8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyTitle: {
    color: '#9CA0A8',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyDesc: {
    color: '#9CA0A8',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyAction: {
    color: '#93C5FD',
    fontSize: 16,
    fontWeight: '600',
  },
});
