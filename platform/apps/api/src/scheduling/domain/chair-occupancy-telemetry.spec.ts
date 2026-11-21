import {
  buildOccupancySnapshot,
  overrunRate,
  resolveChairState,
  type ChairOccupancySnapshot,
  type ChairSlot,
} from './chair-occupancy-telemetry';

const NOW = new Date('2026-11-16T12:00:00.000Z').getTime();
const minutesAgo = (m: number): number => NOW - m * 60000;

/** Дістати єдиний знімок сценарію, гарантуючи наявність (без `!` у тесті). */
function only(snapshots: ChairOccupancySnapshot[]): ChairOccupancySnapshot {
  expect(snapshots).toHaveLength(1);
  return snapshots[0] as ChairOccupancySnapshot;
}

describe('chair occupancy telemetry (T-4622)', () => {
  it('treats an idle chair as free with zero utilization', () => {
    const snapshot = only(
      buildOccupancySnapshot({ chairs: [{ chairId: 'chair-1', state: 'idle' }], nowMs: NOW })
    );
    expect(snapshot).toEqual({
      chairId: 'chair-1',
      state: 'idle',
      utilization: 0,
      overrunMinutes: 0,
      isOverrun: false,
    });
  });

  it('reports utilization within the plan without overrun', () => {
    const snapshot = only(
      buildOccupancySnapshot({
        chairs: [
          { chairId: 'chair-1', state: 'cutting', startedAtMs: minutesAgo(20), plannedMinutes: 40 },
        ],
        nowMs: NOW,
      })
    );
    expect(snapshot.state).toBe('cutting');
    expect(snapshot.utilization).toBe(0.5);
    expect(snapshot.isOverrun).toBe(false);
  });

  it('flags overrun once the visit exceeds the plan past the grace window', () => {
    const snapshot = only(
      buildOccupancySnapshot({
        chairs: [
          { chairId: 'chair-1', state: 'cutting', startedAtMs: minutesAgo(55), plannedMinutes: 40 },
        ],
        nowMs: NOW,
      })
    );
    expect(snapshot.state).toBe('overrun');
    expect(snapshot.overrunMinutes).toBe(15);
    expect(snapshot.isOverrun).toBe(true);
  });

  it('keeps a chair within the grace window in its running state', () => {
    const chair: ChairSlot = {
      chairId: 'chair-1',
      state: 'sanitizing',
      startedAtMs: minutesAgo(45),
      plannedMinutes: 40,
    };
    expect(resolveChairState(chair, NOW, 10)).toBe('sanitizing');
  });

  it('reports the share of chairs in overrun for the SLO metric', () => {
    const snapshots = buildOccupancySnapshot({
      chairs: [
        { chairId: 'chair-1', state: 'cutting', startedAtMs: minutesAgo(60), plannedMinutes: 40 },
        { chairId: 'chair-2', state: 'idle' },
        { chairId: 'chair-3', state: 'cutting', startedAtMs: minutesAgo(10), plannedMinutes: 40 },
        { chairId: 'chair-4', state: 'prep', startedAtMs: minutesAgo(90), plannedMinutes: 30 },
      ],
      nowMs: NOW,
    });
    expect(overrunRate(snapshots)).toBe(0.5);
    expect(overrunRate([])).toBe(0);
  });
});
