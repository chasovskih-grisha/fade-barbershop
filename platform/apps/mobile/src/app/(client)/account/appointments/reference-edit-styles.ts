import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  root: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#22262E',
    gap: 10,
  },
  hint: {
    fontSize: 12,
    color: '#9CA0A8',
    lineHeight: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: '#9CA0A8',
    fontWeight: '600',
  },
  input: {
    minHeight: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2E36',
    backgroundColor: '#151619',
    color: '#F4F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  counter: {
    fontSize: 12,
    color: '#898D94',
  },
  counterError: {
    color: '#F87171',
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  preview: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#151619',
  },
  action: {
    fontSize: 14,
    fontWeight: '600',
    color: '#93C5FD',
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleMark: {
    fontSize: 16,
    color: '#F4F4F6',
  },
  toggleLabel: {
    fontSize: 14,
    color: '#9CA0A8',
  },
  error: {
    fontSize: 14,
    color: '#F87171',
  },
});
