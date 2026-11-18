import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#151619',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#151619',
  },
  photoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#0A0A0C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLabel: {
    fontSize: 12,
    color: '#898D94',
    textAlign: 'center',
  },
  comment: {
    flex: 1,
    fontSize: 14,
    color: '#9CA0A8',
  },
  editLabel: {
    fontSize: 14,
    color: '#F4F4F6',
    fontWeight: '600',
  },
});
