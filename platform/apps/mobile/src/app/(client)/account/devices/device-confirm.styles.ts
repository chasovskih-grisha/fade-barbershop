import { COLOR } from './device-color';

export const confirmStyles = {
  confirmOverlay: {
    position: 'absolute' as const,
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center' as const,
    padding: 16,
  },
  confirmCard: { backgroundColor: COLOR.raised, borderRadius: 16, padding: 18, gap: 12 },
  confirmTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  confirmDesc: { color: COLOR.muted, fontSize: 14, textAlign: 'center' as const },
  confirmActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 8,
    gap: 10,
  },
  confirmLink: { color: COLOR.accent, fontSize: 13, marginTop: 8, textAlign: 'center' as const },
  confirmCancel: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#333',
  },
  confirmDanger: {
    flex: 1,
    color: '#ff5a5a',
    fontSize: 15,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  confirmDangerLoading: { color: COLOR.muted },
};
