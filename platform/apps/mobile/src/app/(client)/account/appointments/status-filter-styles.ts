import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2A2E36',
    backgroundColor: '#1A1D23',
  },
  chipSelected: {
    backgroundColor: '#2763FF',
    borderColor: '#2763FF',
  },
  chipLabel: {
    color: '#9CA0A8',
    fontSize: 13,
    fontWeight: '600',
  },
  chipLabelSelected: {
    color: '#FFFFFF',
  },
});
